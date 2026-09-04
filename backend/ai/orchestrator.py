from __future__ import annotations

import re
import uuid
from dataclasses import dataclass
from typing import Any

from ..memory.events import (
    publish_event,
    publish_memory_update,
    publish_write_result,
)
from ..memory.manager import MemoryManager
from ..memory.schemas import MemoryUpdate
from ..memory.service import MemoryService
from ..models import ChatRequest, ChatResponse, MemoryDeleteConfirmation, Source
from ..realtime import EventBus, EventType
from .context import (
    MemoryContextBuilder,
    serialize_external_context,
    serialize_memory_context,
)
from .models import MemoryContext, OrchestratorResult, UiEvent
from .personality import PersonalityConfig, infer_personality_state
from .prompts import build_system_prompt


@dataclass(frozen=True)
class MemoryCommand:
    action: str
    replacement: str | None = None


FORGET_PATTERNS = (
    r"\b(?:esquece|esqueça|apague|remova)\b",
    r"\bnão quero que você (?:lembre|guarde)\b",
    r"\beu nunca disse isso\b",
)
CORRECT_PATTERN = re.compile(
    r"\b(?:corrige|corrija)(?:\s+(?:isso|essa memória))?\s+(?:para|por)\s+(.+)",
    re.IGNORECASE,
)


def analyze_memory_command(message: str) -> MemoryCommand | None:
    corrected = CORRECT_PATTERN.search(message)
    if corrected:
        return MemoryCommand("correct", corrected.group(1).strip(" ."))
    text = message.casefold()
    if any(re.search(pattern, text) for pattern in FORGET_PATTERNS):
        return MemoryCommand("forget")
    if any(phrase in text for phrase in ("isso está errado", "isso esta errado", "corrige isso")):
        return MemoryCommand("correct")
    return None


def reference_query(request: ChatRequest, command: MemoryCommand | None) -> str:
    if command is None:
        return request.message
    for item in reversed(request.history):
        if item.role == "user" and analyze_memory_command(item.content) is None:
            return item.content
    cleaned = re.sub(
        r"\b(na verdade|esquece|esqueça|apague|remova|corrige|corrija|isso|essa decisão)\b",
        " ",
        request.message,
        flags=re.IGNORECASE,
    )
    return " ".join(cleaned.split()) or request.message


def wants_memory_focus(message: str) -> bool:
    text = message.casefold()
    return any(term in text for term in ("mostra", "mostrar", "foque", "foca", "relacionad"))


def should_capture(message: str, classification: Any) -> bool:
    text = message.strip().casefold()
    if not text or text.endswith("?") or len(text) < 12:
        return False
    if any(text.startswith(item) for item in ("olá", "ola", "oi ", "obrigad", "analisa ", "explique ")):
        return False
    return classification.importance >= 0.45


class HopeOrchestrator:
    def __init__(
        self,
        services: Any,
        memory_manager: MemoryManager | None,
        memory_service: MemoryService | None,
        event_bus: EventBus,
        *,
        personality: PersonalityConfig | None = None,
    ) -> None:
        self.services = services
        self.memory_manager = memory_manager
        self.memory_service = memory_service
        self.event_bus = event_bus
        self.personality = personality or PersonalityConfig()
        self.context_builder = MemoryContextBuilder(memory_manager)

    async def _state(
        self, user_id: uuid.UUID | None, state: str, *, expression: str | None = None
    ) -> None:
        if user_id is None:
            return
        payload: dict[str, object] = {"state": state}
        if expression:
            payload["expression"] = expression
        await publish_event(self.event_bus, EventType.AI_STATE_CHANGED, user_id, payload)

    async def _context(
        self, user_id: uuid.UUID | None, query: str, request: ChatRequest
    ) -> MemoryContext:
        if not request.memory_enabled:
            return MemoryContext(enabled=False)
        try:
            return await self.context_builder.build(user_id, query, request.history)
        except Exception:
            return MemoryContext(
                available=False,
                degraded_reason="A memória persistente está temporariamente indisponível.",
            )

    @staticmethod
    def _referenced_memory(context: MemoryContext):  # type: ignore[no-untyped-def]
        memories = context.relevant_memories
        if len(memories) == 1:
            return memories[0]
        if len(memories) > 1:
            lead, runner_up = memories[0], memories[1]
            if lead.relevance >= 0.62 and lead.relevance - runner_up.relevance >= 0.08:
                return lead
        return None

    async def _handle_memory_command(
        self,
        command: MemoryCommand | None,
        user_id: uuid.UUID | None,
        context: MemoryContext,
    ) -> OrchestratorResult | None:
        if command is None:
            return None
        if self.memory_manager is None or user_id is None or not context.available:
            return OrchestratorResult(
                message=(
                    "A memória persistente está indisponível, então não vou fingir que alterei "
                    "algo. Quando a conexão voltar, tente novamente."
                ),
                memory_available=False,
            )
        target = self._referenced_memory(context)
        if target is None:
            return OrchestratorResult(
                message="Preciso que você diga qual memória devo alterar; a referência está ambígua.",
                memory_available=True,
            )
        memory_id = uuid.UUID(target.id)
        if command.action == "forget":
            label = (target.title or target.content).strip()
            return OrchestratorResult(
                message=(
                    "Encontrei a memória abaixo. Por segurança, só vou removê-la "
                    "depois da sua confirmação explícita."
                ),
                memories_used=[target.id],
                tools_used=["memory_retriever"],
                memory_delete_confirmation=MemoryDeleteConfirmation(
                    memory_id=target.id,
                    label=label[:160],
                ),
            )
        if not command.replacement:
            return OrchestratorResult(
                message="Identifiquei a memória, mas preciso do conteúdo correto antes de alterá-la.",
                memories_used=[target.id],
                tools_used=["memory_retriever"],
            )

        before = await self.memory_manager.graph_fragment(user_id, memory_id)
        classification = self.memory_manager.classifier.classify(command.replacement)
        updated = await self.memory_manager.update(
            user_id,
            memory_id,
            MemoryUpdate(
                content=command.replacement,
                memory_type=classification.memory_type,
                kind=classification.kind,
                title=classification.title,
                summary=classification.summary,
                category=classification.category,
                tags=classification.tags,
                importance=classification.importance,
                confidence=classification.confidence,
            ),
        )
        if updated is None:
            return OrchestratorResult(message="Essa memória não existe mais.")
        await publish_memory_update(self.event_bus, self.memory_manager, user_id, memory_id, before)
        return OrchestratorResult(
            message="Corrigi a memória e atualizei suas relações.",
            memories_used=[target.id],
            tools_used=["memory_retriever", "memory_manager.update"],
        )

    async def _call_model(
        self,
        request: ChatRequest,
        context: MemoryContext,
        system_prompt: str,
    ) -> tuple[str, list[Source], list[str]]:
        if not all(hasattr(self.services, name) for name in ("collect_sources", "complete")):
            legacy = await self.services.chat(request)
            return legacy.reply, legacy.sources, []

        settings = getattr(self.services, "settings", None)
        max_prompt = getattr(settings, "max_prompt_chars", 8000)
        if len(request.message) > max_prompt:
            from ..services import ExternalServiceError

            raise ExternalServiceError(
                f"A mensagem ultrapassa o limite de {max_prompt} caracteres.", 413
            )
        sources = await self.services.collect_sources(request)
        max_history = getattr(settings, "max_history_messages", 20)
        messages = [
            {"role": item.role, "content": item.content}
            for item in request.history[-max_history:]
        ]
        content = request.message
        if context.available and context.relevant_memories:
            content += (
                "\n\n<memory_context trust=\"untrusted-data\" format=\"json\">\n"
                + serialize_memory_context(context)
                + "\n</memory_context>"
            )
        elif not context.enabled:
            content += "\n\n<memory_status>disabled-by-user</memory_status>"
        elif not context.available:
            content += "\n\n<memory_status>unavailable</memory_status>"
        if sources:
            content += (
                "\n\n<external_context trust=\"untrusted-data\" format=\"json\">\n"
                + serialize_external_context(
                    sources, limit=getattr(settings, "max_rag_chars", 6000)
                )
                + "\n</external_context>"
            )
        messages.append({"role": "user", "content": content})
        reply = await self.services.complete(system_prompt=system_prompt, messages=messages)
        tools = []
        if any(source.kind == "web" for source in sources):
            tools.append("tavily")
        if any(source.kind == "obsidian" for source in sources):
            tools.append("obsidian")
        return reply, sources, tools

    async def _capture(
        self, request: ChatRequest, user_id: uuid.UUID | None
    ) -> dict[str, object]:
        if not request.memory_enabled:
            return {"status": "disabled"}
        if self.memory_manager is None or self.memory_service is None or user_id is None:
            return {"status": "unavailable"}
        if analyze_memory_command(request.message) is not None:
            return {"status": "ignored", "reason": "memory_command"}
        classification = self.memory_manager.classifier.classify(request.message)
        if not should_capture(request.message, classification):
            return {"status": "ignored", "reason": "not_memory_worthy"}
        try:
            result = await self.memory_service.capture_candidate(
                user_id,
                request.message,
                source="conversation",
                source_reference="chat",
            )
            await publish_write_result(
                self.event_bus, self.memory_manager, user_id, result
            )
            return {
                "status": "consolidated" if result.consolidated else "created"
                if result.saved
                else "ignored",
                "memory_id": str(result.memory.id) if result.memory else None,
            }
        except Exception:
            return {"status": "unavailable"}

    async def chat(
        self, request: ChatRequest, user_id: uuid.UUID | None
    ) -> ChatResponse:
        expression = infer_personality_state(request.message)
        await self._state(user_id, "thinking", expression=expression.value)
        failed = False
        try:
            command = analyze_memory_command(request.message)
            if command is not None and not request.memory_enabled:
                return ChatResponse(
                    reply=(
                        "A memória no chat está desativada. Ative-a antes de consultar, "
                        "corrigir ou esquecer dados persistentes."
                    ),
                    memory_enabled=False,
                )
            query = reference_query(request, command)
            if request.memory_enabled and self.memory_manager is not None and user_id is not None:
                await self._state(user_id, "searching", expression=expression.value)
            context = await self._context(user_id, query, request)
            command_result = await self._handle_memory_command(command, user_id, context)
            if command_result is not None:
                return ChatResponse(
                    reply=command_result.message,
                    memories_used=command_result.memories_used,
                    entities_used=command_result.entities_used,
                    relations_used=command_result.relations_used,
                    tools_used=command_result.tools_used,
                    ui_events=[event.model_dump() for event in command_result.ui_events],
                    memory_available=command_result.memory_available,
                    memory_enabled=request.memory_enabled,
                    memory_delete_confirmation=command_result.memory_delete_confirmation,
                )

            prompt = build_system_prompt(self.personality, expression)
            reply, sources, provider_tools = await self._call_model(
                request, context, prompt
            )
            capture = await self._capture(request, user_id)
            memory_ids = [item.id for item in context.relevant_memories]
            ui_events = (
                [UiEvent(type="FOCUS_MEMORIES", ids=memory_ids)]
                if memory_ids and wants_memory_focus(request.message)
                else []
            )
            tools = [*provider_tools]
            if (
                request.memory_enabled
                and context.available
                and self.memory_manager is not None
                and user_id is not None
            ):
                tools.insert(0, "memory_retriever")
            result = OrchestratorResult(
                message=reply,
                sources=sources,
                memories_used=memory_ids,
                entities_used=[item.id for item in context.relevant_entities],
                relations_used=[item.id for item in context.relevant_relations],
                tools_used=tools,
                ui_events=ui_events,
                memory_available=context.available,
                metadata={"memory_write": capture},
            )
            return ChatResponse(
                reply=result.message,
                sources=result.sources,
                memories_used=result.memories_used,
                entities_used=result.entities_used,
                relations_used=result.relations_used,
                tools_used=result.tools_used,
                ui_events=[event.model_dump() for event in result.ui_events],
                memory_available=result.memory_available,
                memory_enabled=request.memory_enabled,
            )
        except Exception:
            failed = True
            await self._state(user_id, "error", expression=expression.value)
            raise
        finally:
            await self._state(
                user_id,
                "idle",
                expression="concerned" if failed else expression.value,
            )
