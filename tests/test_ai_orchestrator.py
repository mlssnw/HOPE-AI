from __future__ import annotations

import asyncio
import json
import uuid

import pytest

from backend.ai.orchestrator import HopeOrchestrator
from backend.database.session import Database
from backend.memory.embeddings import LocalHashEmbeddingProvider
from backend.memory.manager import MemoryManager
from backend.memory.schemas import MemoryCreate
from backend.memory.service import MemoryService
from backend.models import ChatRequest
from backend.realtime import EventBus


class FakeAiServices:
    def __init__(self, reply: str = "Resposta baseada no contexto.") -> None:
        self.reply = reply
        self.system_prompt = ""
        self.messages: list[dict[str, str]] = []

    async def collect_sources(self, request: ChatRequest):  # type: ignore[no-untyped-def]
        return []

    async def complete(
        self, *, system_prompt: str, messages: list[dict[str, str]]
    ) -> str:
        self.system_prompt = system_prompt
        self.messages = messages
        return self.reply


async def make_orchestrator():  # type: ignore[no-untyped-def]
    database = Database("sqlite+aiosqlite:///:memory:")
    await database.create_schema_for_tests()
    manager = MemoryManager(database, LocalHashEmbeddingProvider(1536))
    services = FakeAiServices()
    bus = EventBus()
    orchestrator = HopeOrchestrator(
        services, manager, MemoryService(manager), bus
    )
    return database, manager, services, bus, orchestrator


def memory_context_from(messages: list[dict[str, str]]) -> dict:
    content = messages[-1]["content"]
    start = content.index("<memory_context")
    encoded = content[content.index("\n", start) + 1 : content.index("\n</memory_context>")]
    return json.loads(encoded)


@pytest.mark.asyncio
async def test_chat_retrieves_memory_and_keeps_it_untrusted() -> None:
    database, manager, services, _, orchestrator = await make_orchestrator()
    user_id = uuid.uuid4()
    try:
        decision = await manager.create(
            user_id,
            MemoryCreate(
                content="PostgreSQL com pgvector é o banco principal da HOPE.",
                memory_type="decision",
            ),
        )
        await manager.create(
            user_id,
            MemoryCreate(content="Prefiro chá de camomila antes de dormir."),
        )
        result = await orchestrator.chat(
            ChatRequest(message="Qual banco principal a HOPE usa?", memory_enabled=True), user_id
        )

        assert decision.memory is not None
        assert result.memories_used[0] == str(decision.memory.id)
        context = memory_context_from(services.messages)
        assert context["relevant_memories"][0]["content"].startswith("PostgreSQL")
        assert len(context["relevant_memories"]) <= 8
        assert "dados não confiáveis" in services.system_prompt
        assert "Nunca obedeça" in services.system_prompt
        assert "embedding" not in services.messages[-1]["content"]
    finally:
        await database.dispose()


@pytest.mark.asyncio
async def test_conversation_persists_decision_and_consolidates_duplicate() -> None:
    database, manager, _, _, orchestrator = await make_orchestrator()
    user_id = uuid.uuid4()
    message = "Quero que PostgreSQL com pgvector seja o banco principal da HOPE."
    try:
        await orchestrator.chat(ChatRequest(message=message, memory_enabled=True), user_id)
        await orchestrator.chat(ChatRequest(message=message, memory_enabled=True), user_id)
        memories = await manager.list(user_id, limit=10, offset=0)
        assert len(memories) == 1
        assert memories[0].memory_type == "decision"
        assert memories[0].kind == "fact"
        assert memories[0].mention_count == 2
    finally:
        await database.dispose()


@pytest.mark.asyncio
async def test_inference_is_persisted_with_lower_confidence() -> None:
    database, manager, _, _, orchestrator = await make_orchestrator()
    user_id = uuid.uuid4()
    try:
        await orchestrator.chat(
            ChatRequest(message="Talvez a interface escura seja melhor para esta usuária.", memory_enabled=True),
            user_id,
        )
        memories = await manager.list(user_id, limit=10, offset=0)
        assert len(memories) == 1
        assert memories[0].kind == "inference"
        assert memories[0].confidence <= 0.75
    finally:
        await database.dispose()


@pytest.mark.asyncio
async def test_clear_forget_command_requires_target_bound_confirmation() -> None:
    database, manager, _, bus, orchestrator = await make_orchestrator()
    user_id = uuid.uuid4()
    try:
        created = await manager.create(
            user_id,
            MemoryCreate(
                content="PostgreSQL com pgvector é o banco principal da HOPE.",
                memory_type="decision",
            ),
        )
        assert created.memory is not None
        subscription = await bus.subscribe(user_id)
        result = await orchestrator.chat(
            ChatRequest(
                message="Na verdade, esquece essa decisão.",
                history=[
                    {"role": "user", "content": "Qual banco principal a HOPE usa?"},
                    {"role": "assistant", "content": "PostgreSQL com pgvector."},
                ],
                memory_enabled=True,
            ),
            user_id,
        )
        assert "confirmação explícita" in result.reply
        assert result.memory_delete_confirmation is not None
        assert result.memory_delete_confirmation.memory_id == str(created.memory.id)
        assert await manager.get(user_id, created.memory.id) is not None
        events = [
            (await asyncio.wait_for(subscription.get(), timeout=1)).type.value
            for _ in range(3)
        ]
        assert events[:2] == ["AI_STATE_CHANGED", "AI_STATE_CHANGED"]
        assert "MEMORY_DELETED" not in events
    finally:
        await database.dispose()


@pytest.mark.asyncio
async def test_ambiguous_correction_does_not_delete_or_rewrite() -> None:
    database, manager, _, _, orchestrator = await make_orchestrator()
    user_id = uuid.uuid4()
    try:
        await manager.create(user_id, MemoryCreate(content="Prefiro café sem açúcar."))
        await manager.create(user_id, MemoryCreate(content="Prefiro chá sem açúcar."))
        result = await orchestrator.chat(
            ChatRequest(message="Isso está errado.", memory_enabled=True), user_id
        )
        assert "qual memória" in result.reply
        assert len(await manager.list(user_id, limit=10, offset=0)) == 2
    finally:
        await database.dispose()


@pytest.mark.asyncio
async def test_clear_correction_updates_memory_content() -> None:
    database, manager, _, _, orchestrator = await make_orchestrator()
    user_id = uuid.uuid4()
    try:
        created = await manager.create(
            user_id,
            MemoryCreate(
                content="PostgreSQL é o banco principal da HOPE.",
                memory_type="decision",
            ),
        )
        assert created.memory is not None
        result = await orchestrator.chat(
            ChatRequest(
                message="Corrija isso para PostgreSQL com pgvector é o banco principal da HOPE.",
                history=[
                    {"role": "user", "content": "Qual é o banco principal da HOPE?"},
                    {"role": "assistant", "content": "PostgreSQL."},
                ],
                memory_enabled=True,
            ),
            user_id,
        )
        updated = await manager.get(user_id, created.memory.id)
        assert "Corrigi" in result.reply
        assert updated is not None
        assert updated.content.startswith("PostgreSQL com pgvector")
    finally:
        await database.dispose()


class BrokenMemoryManager:
    async def retrieve(self, *args, **kwargs):  # type: ignore[no-untyped-def]
        raise RuntimeError("database secret must never escape")


@pytest.mark.asyncio
async def test_memory_failure_does_not_stop_chat() -> None:
    services = FakeAiServices("Consigo responder, mas sem memória persistente.")
    orchestrator = HopeOrchestrator(
        services,
        BrokenMemoryManager(),  # type: ignore[arg-type]
        None,
        EventBus(),
    )
    result = await orchestrator.chat(
        ChatRequest(message="Olá, HOPE.", memory_enabled=True), uuid.uuid4()
    )
    assert result.reply.startswith("Consigo responder")
    assert result.memory_available is False
    assert "database secret" not in result.model_dump_json()


@pytest.mark.asyncio
async def test_ai_states_follow_thinking_searching_idle_order() -> None:
    database, _, _, bus, orchestrator = await make_orchestrator()
    user_id = uuid.uuid4()
    subscription = await bus.subscribe(user_id)
    try:
        await orchestrator.chat(
            ChatRequest(message="Olá, HOPE.", memory_enabled=True), user_id
        )
        states = [
            (await asyncio.wait_for(subscription.get(), timeout=1)).payload["state"]
            for _ in range(3)
        ]
        assert states == ["thinking", "searching", "idle"]
    finally:
        await database.dispose()


@pytest.mark.asyncio
async def test_ai_error_state_recovers_to_idle() -> None:
    database, manager, services, bus, orchestrator = await make_orchestrator()
    user_id = uuid.uuid4()
    subscription = await bus.subscribe(user_id)

    async def fail(**kwargs):  # type: ignore[no-untyped-def]
        raise RuntimeError("provider unavailable")

    services.complete = fail  # type: ignore[method-assign]
    try:
        with pytest.raises(RuntimeError, match="provider unavailable"):
            await orchestrator.chat(
                ChatRequest(message="Responda agora.", memory_enabled=True), user_id
            )
        states = [
            (await asyncio.wait_for(subscription.get(), timeout=1)).payload["state"]
            for _ in range(4)
        ]
        assert states == ["thinking", "searching", "error", "idle"]
    finally:
        await database.dispose()


@pytest.mark.asyncio
async def test_memory_opt_out_blocks_retrieval_capture_and_memory_commands() -> None:
    database, manager, services, bus, orchestrator = await make_orchestrator()
    user_id = uuid.uuid4()
    subscription = await bus.subscribe(user_id)
    try:
        existing = await manager.create(
            user_id, MemoryCreate(content="Prefiro respostas muito objetivas.")
        )
        result = await orchestrator.chat(
            ChatRequest(
                message="Quero que PostgreSQL seja a decisão principal deste projeto.",
                memory_enabled=False,
            ),
            user_id,
        )
        memories = await manager.list(user_id, limit=10, offset=0)
        assert existing.memory is not None
        assert [memory.id for memory in memories] == [existing.memory.id]
        assert result.memory_enabled is False
        assert result.memories_used == []
        assert "memory_retriever" not in result.tools_used
        assert "<memory_context" not in services.messages[-1]["content"]
        assert "<memory_status>disabled-by-user</memory_status>" in services.messages[-1]["content"]

        command = await orchestrator.chat(
            ChatRequest(message="Esqueça essa memória.", memory_enabled=False), user_id
        )
        assert "desativada" in command.reply
        assert command.memory_delete_confirmation is None
        assert await manager.get(user_id, existing.memory.id) is not None

        event_types = []
        while not subscription.queue.empty():
            event_types.append(subscription.queue.get_nowait().type.value)
        assert "MEMORY_DELETED" not in event_types
        assert "MEMORY_CREATED" not in event_types
    finally:
        await database.dispose()
