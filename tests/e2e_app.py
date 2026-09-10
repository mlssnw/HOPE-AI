from __future__ import annotations

import asyncio
import re
from datetime import datetime, timezone

from backend.main import create_app
from backend.memory.classifier import MemoryClassifier
from backend.memory.schemas import (
    EntityView,
    MemoryEntityLinkView,
    MemoryEventView,
    MemoryExplanation,
    MemoryGraph,
    MemoryRelationView,
    MemorySearchHit,
    MemorySourceView,
    MemoryView,
)
from backend.models import ChatResponse, HealthResponse, ServiceStatus, Source
from backend.services import ExternalServiceError


class BrowserMockServices:
    async def health(self) -> HealthResponse:
        online = ServiceStatus(configured=True, available=True)
        return HealthResponse(claude=online, tavily=online, elevenlabs=online, obsidian=online)

    async def chat(self, payload):  # type: ignore[no-untyped-def]
        if "erro" in payload.message.lower():
            raise ExternalServiceError("Erro simulado tratado com segurança.", 503)
        if "aguarde" in payload.message.lower():
            await asyncio.sleep(3)
        return ChatResponse(
            reply="Resposta **simulada** e segura. `<img src=x onerror=alert(1)>` permanece texto.",
            sources=[Source(kind="web", title="Fonte simulada", reference="https://example.com", excerpt="teste")],
        )

    async def synthesize_speech(self, text: str) -> tuple[bytes, str]:
        raise ExternalServiceError("Voz simulada sem chamada externa.", 503)


NOW = datetime.now(timezone.utc)
USER_ID = "10000000-0000-4000-8000-000000000001"
MEMORY_IDS = [
    "20000000-0000-4000-8000-000000000001",
    "20000000-0000-4000-8000-000000000002",
    "20000000-0000-4000-8000-000000000003",
]
ENTITY_ID = "30000000-0000-4000-8000-000000000001"


def memory(index: int, **values) -> MemoryView:  # type: ignore[no-untyped-def]
    base = {
        "id": MEMORY_IDS[index], "user_id": USER_ID, "content": "",
        "memory_type": "knowledge", "kind": "fact", "title": None,
        "summary": None, "category": "knowledge", "tags": [], "source": "conversation",
        "importance": .7, "confidence": .95, "emotional_weight": 0,
        "metadata": {}, "access_count": index + 1, "mention_count": 1,
        "last_accessed_at": None, "last_reinforced_at": None,
        "created_at": NOW, "updated_at": NOW,
    }
    return MemoryView.model_validate({**base, **values})


MEMORIES = [
    memory(0, title="Arquitetura da HOPE", content="HOPE AI usa FastAPI e PostgreSQL.", category="knowledge", importance=.94, tags=["hope", "arquitetura"]),
    memory(1, title="Interfaces escuras", content="A usuária prefere interfaces escuras e douradas.", memory_type="preference", category="identity", importance=.86, tags=["preferência", "design"]),
    memory(2, title="Revisar Memory Globe", content="Revisar o Memory Globe amanhã.", memory_type="task", kind="event", category="temporal", importance=.78, tags=["globe", "tarefa"]),
]


RELATIONS = [
    MemoryRelationView(
        id="40000000-0000-4000-8000-000000000001",
        source_memory_id=MEMORY_IDS[0],
        target_memory_id=MEMORY_IDS[2],
        relation_type="semantic_related",
        weight=.72,
        created_at=NOW,
    ),
    MemoryRelationView(
        id="40000000-0000-4000-8000-000000000002",
        source_memory_id=MEMORY_IDS[1],
        target_memory_id=MEMORY_IDS[2],
        relation_type="related_to",
        weight=.58,
        created_at=NOW,
    ),
]
ENTITIES = [
    EntityView(
        id=ENTITY_ID,
        name="HOPE AI",
        entity_type="technology",
        attributes={},
        created_at=NOW,
        updated_at=NOW,
    )
]
ENTITY_LINKS = [
    MemoryEntityLinkView(
        memory_id=MEMORY_IDS[0],
        entity_id=ENTITY_ID,
        role="mentioned_in",
        confidence=.98,
    )
]


def _search_text(value: str) -> str:
    return " ".join(re.findall(r"\w+", value.casefold()))


class BrowserMockMemoryManager:
    database = None
    classifier = MemoryClassifier()

    def __init__(self) -> None:
        self.memories = list(MEMORIES)
        self.relations = list(RELATIONS)
        self.entities = list(ENTITIES)
        self.entity_links = list(ENTITY_LINKS)

    async def graph(self, user_id, *, limit=200) -> MemoryGraph:  # type: ignore[no-untyped-def]
        return MemoryGraph(
            nodes=self.memories[:limit],
            edges=self.relations,
            entities=self.entities,
            entity_links=self.entity_links,
        )

    async def list(self, user_id, *, limit=50, offset=0) -> list[MemoryView]:  # type: ignore[no-untyped-def]
        return self.memories[offset : offset + limit]

    async def get(self, user_id, memory_id) -> MemoryView | None:  # type: ignore[no-untyped-def]
        return next((item for item in self.memories if item.id == memory_id), None)

    async def retrieve(self, user_id, query, *, limit=10) -> list[MemorySearchHit]:  # type: ignore[no-untyped-def]
        query_text = _search_text(query)
        query_terms = set(query_text.split())
        ranked: list[tuple[int, MemoryView]] = []
        for item in self.memories:
            candidate = _search_text(f"{item.title or ''} {item.content}")
            overlap = len(query_terms.intersection(candidate.split()))
            if query_text in candidate or overlap >= 2:
                ranked.append((overlap, item))
        ranked.sort(key=lambda value: (-value[0], -value[1].importance))
        return [
            MemorySearchHit(memory=item, score=.91, match_kind="hybrid")
            for _, item in ranked[:limit]
        ]

    async def explain(self, user_id, memory_id) -> MemoryExplanation | None:  # type: ignore[no-untyped-def]
        item = await self.get(user_id, memory_id)
        if item is None:
            return None
        relations = [
            relation for relation in self.relations
            if memory_id in (relation.source_memory_id, relation.target_memory_id)
        ]
        linked_entity_ids = {
            link.entity_id for link in self.entity_links if link.memory_id == memory_id
        }
        return MemoryExplanation(
            memory=item,
            sources=[
                MemorySourceView(
                    source_type="conversation",
                    source_reference="preview",
                    excerpt=item.content,
                    created_at=NOW,
                )
            ],
            entities=[entity for entity in self.entities if entity.id in linked_entity_ids],
            relations=relations,
            events=[MemoryEventView(event_type="created", payload={}, created_at=NOW)],
        )

    async def graph_fragment(self, user_id, memory_id) -> MemoryGraph | None:  # type: ignore[no-untyped-def]
        item = await self.get(user_id, memory_id)
        if item is None:
            return None
        relations = [
            relation for relation in self.relations
            if memory_id in (relation.source_memory_id, relation.target_memory_id)
        ]
        links = [link for link in self.entity_links if link.memory_id == memory_id]
        entity_ids = {link.entity_id for link in links}
        return MemoryGraph(
            nodes=[item],
            edges=relations,
            entities=[entity for entity in self.entities if entity.id in entity_ids],
            entity_links=links,
        )

    async def delete(self, user_id, memory_id) -> bool:  # type: ignore[no-untyped-def]
        item = await self.get(user_id, memory_id)
        if item is None:
            return False
        self.memories = [memory for memory in self.memories if memory.id != memory_id]
        self.relations = [
            relation for relation in self.relations
            if memory_id not in (relation.source_memory_id, relation.target_memory_id)
        ]
        self.entity_links = [
            link for link in self.entity_links if link.memory_id != memory_id
        ]
        return True


def create_browser_app():  # type: ignore[no-untyped-def]
    manager = BrowserMockMemoryManager()
    return create_app(BrowserMockServices(), manager), manager  # type: ignore[arg-type]


app, memory_manager = create_browser_app()
