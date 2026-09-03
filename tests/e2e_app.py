from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from backend.main import create_app
from backend.memory.classifier import MemoryClassifier
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


def memory(index: int, **values):  # type: ignore[no-untyped-def]
    base = {
        "id": MEMORY_IDS[index], "user_id": USER_ID, "content": "",
        "memory_type": "knowledge", "kind": "fact", "title": None,
        "summary": None, "category": "knowledge", "tags": [], "source": "conversation",
        "importance": .7, "confidence": .95, "emotional_weight": 0,
        "metadata": {}, "access_count": index + 1, "mention_count": 1,
        "last_accessed_at": None, "last_reinforced_at": None,
        "created_at": NOW, "updated_at": NOW,
    }
    return {**base, **values}


MEMORIES = [
    memory(0, title="Arquitetura da HOPE", content="HOPE AI usa FastAPI e PostgreSQL.", category="knowledge", importance=.94, tags=["hope", "arquitetura"]),
    memory(1, title="Interfaces escuras", content="A usuária prefere interfaces escuras e douradas.", memory_type="preference", category="identity", importance=.86, tags=["preferência", "design"]),
    memory(2, title="Revisar Memory Globe", content="Revisar o Memory Globe amanhã.", memory_type="task", kind="event", category="temporal", importance=.78, tags=["globe", "tarefa"]),
]


class BrowserMockMemoryManager:
    database = None
    classifier = MemoryClassifier()

    async def graph(self, user_id, *, limit=200):  # type: ignore[no-untyped-def]
        return {
            "nodes": MEMORIES,
            "edges": [
                {"id": "40000000-0000-4000-8000-000000000001", "source_memory_id": MEMORY_IDS[0], "target_memory_id": MEMORY_IDS[2], "relation_type": "semantic_related", "weight": .72, "created_at": NOW},
                {"id": "40000000-0000-4000-8000-000000000002", "source_memory_id": MEMORY_IDS[1], "target_memory_id": MEMORY_IDS[2], "relation_type": "related_to", "weight": .58, "created_at": NOW},
            ],
            "entities": [{"id": ENTITY_ID, "name": "HOPE AI", "entity_type": "technology", "attributes": {}, "created_at": NOW, "updated_at": NOW}],
            "entity_links": [{"memory_id": MEMORY_IDS[0], "entity_id": ENTITY_ID, "role": "mentioned_in", "confidence": .98}],
        }

    async def retrieve(self, user_id, query, *, limit=10):  # type: ignore[no-untyped-def]
        hits = [item for item in MEMORIES if query.casefold() in (item["content"] + item["title"]).casefold()]
        return [{"memory": item, "score": .91, "match_kind": "hybrid"} for item in hits[:limit]]

    async def explain(self, user_id, memory_id):  # type: ignore[no-untyped-def]
        item = next((entry for entry in MEMORIES if entry["id"] == str(memory_id)), None)
        if item is None:
            return None
        return {
            "memory": item,
            "sources": [{"source_type": "conversation", "source_reference": "preview", "excerpt": item["content"], "created_at": NOW}],
            "entities": [], "relations": [],
            "events": [{"event_type": "created", "payload": {}, "created_at": NOW}],
        }


app = create_app(BrowserMockServices(), BrowserMockMemoryManager())  # type: ignore[arg-type]
