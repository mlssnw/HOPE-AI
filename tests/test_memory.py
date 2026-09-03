from __future__ import annotations

import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError

from backend.database.models import (
    EntityRecord,
    MemoryRecord,
    MemoryRelationRecord,
    UserRecord,
)
from backend.database.session import Database
from backend.main import create_app
from backend.memory.classifier import MemoryClassifier
from backend.memory.embeddings import LocalHashEmbeddingProvider
from backend.memory.entities import EntityCandidate, EntityRepository
from backend.memory.manager import MemoryManager
from backend.memory.schemas import MemoryCreate, MemoryUpdate
from backend.models import ChatResponse, HealthResponse, ServiceStatus


class FakeServices:
    async def health(self) -> HealthResponse:
        status = ServiceStatus(configured=False)
        return HealthResponse(
            claude=status,
            tavily=status,
            elevenlabs=status,
            obsidian=status,
        )

    async def chat(self, payload):  # type: ignore[no-untyped-def]
        return ChatResponse(reply="ok")

    async def synthesize_speech(self, text: str) -> tuple[bytes, str]:
        return b"", "audio/mpeg"


async def make_manager() -> tuple[Database, MemoryManager]:
    database = Database("sqlite+aiosqlite:///:memory:")
    await database.create_schema_for_tests()
    manager = MemoryManager(database, LocalHashEmbeddingProvider(1536))
    return database, manager


@pytest.mark.asyncio
async def test_memory_lifecycle_search_consolidation_and_relations() -> None:
    database, manager = await make_manager()
    user_id = uuid.uuid4()
    other_user_id = uuid.uuid4()
    try:
        first = await manager.create(
            user_id,
            MemoryCreate(content="Prefiro café sem açúcar.", metadata={"topic": "coffee"}),
        )
        assert first.saved is True
        assert first.memory is not None
        assert first.memory.memory_type == "preference"
        assert first.memory.extra_metadata == {"topic": "coffee"}

        duplicate = await manager.create(
            user_id,
            MemoryCreate(content="Prefiro café sem açúcar.", importance=0.95),
        )
        assert duplicate.consolidated is True
        assert duplicate.memory is not None
        assert duplicate.memory.id == first.memory.id
        assert duplicate.memory.importance == 0.95

        second = await manager.create(
            user_id,
            MemoryCreate(content="Preciso concluir a migração até sexta-feira."),
        )
        assert second.memory is not None

        found = await manager.search(user_id, "café sem açúcar")
        assert found[0].id == first.memory.id
        assert await manager.get(other_user_id, first.memory.id) is None

        relation = await manager.relate(
            user_id, first.memory.id, second.memory.id, "related_to", 0.8
        )
        assert relation.weight == 0.8
        graph = await manager.graph(user_id)
        assert len(graph.nodes) == 2
        assert len(graph.edges) == 1

        updated = await manager.update(
            user_id, second.memory.id, MemoryUpdate(importance=0.9)
        )
        assert updated is not None and updated.importance == 0.9
        assert await manager.delete(user_id, second.memory.id) is True
        assert await manager.delete(user_id, second.memory.id) is False
    finally:
        await database.dispose()


@pytest.mark.asyncio
async def test_automatic_capture_respects_importance_threshold() -> None:
    database, manager = await make_manager()
    try:
        user_id = uuid.uuid4()
        result = await manager.create(
            user_id,
            MemoryCreate(content="Trecho genérico.", force=False),
        )
        assert result.saved is False
        assert result.reason is not None
        preference = await manager.create(
            user_id,
            MemoryCreate(content="Minha preferência é interface escura.", force=False),
        )
        assert preference.saved is True

        inference = await manager.create(
            user_id,
            MemoryCreate(content="Talvez a usuária prefira respostas curtas.", force=True),
        )
        assert inference.memory is not None
        assert inference.memory.kind == "inference"
        assert inference.memory.confidence <= 0.75
    finally:
        await database.dispose()


@pytest.mark.asyncio
async def test_memory_api_requires_identity_and_keeps_users_isolated() -> None:
    database, manager = await make_manager()
    app = create_app(FakeServices(), manager)  # type: ignore[arg-type]
    transport = ASGITransport(app=app)
    user_id = uuid.uuid4()
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            missing_identity = await client.get("/api/memories")
            assert missing_identity.status_code == 401

            created = await client.post(
                "/api/memories",
                headers={"X-Hope-User-Id": str(user_id)},
                json={"content": "Minha meta é aprender espanhol.", "metadata": {"lang": "es"}},
            )
            assert created.status_code == 200
            body = created.json()
            assert body["saved"] is True
            assert body["memory"]["metadata"] == {"lang": "es"}

            listed = await client.get(
                "/api/memories", headers={"X-Hope-User-Id": str(user_id)}
            )
            assert listed.status_code == 200
            assert len(listed.json()) == 1

            memory_id = body["memory"]["id"]
            explanation = await client.get(
                f"/api/memories/{memory_id}/explanation",
                headers={"X-Hope-User-Id": str(user_id)},
            )
            assert explanation.status_code == 200
            assert explanation.json()["sources"][0]["source_type"] == "manual"

            retrieved = await client.get(
                "/api/memories/retrieve",
                params={"q": "espanhol"},
                headers={"X-Hope-User-Id": str(user_id)},
            )
            assert retrieved.status_code == 200
            assert retrieved.json()[0]["memory"]["id"] == memory_id

            ignored_candidate = await client.post(
                "/api/memories/candidates",
                json={"content": "Trecho genérico."},
                headers={"X-Hope-User-Id": str(user_id)},
            )
            assert ignored_candidate.status_code == 200
            assert ignored_candidate.json()["saved"] is False

            isolated = await client.get(
                "/api/memories", headers={"X-Hope-User-Id": str(uuid.uuid4())}
            )
            assert isolated.status_code == 200
            assert isolated.json() == []
    finally:
        await database.dispose()


def test_classifier_distinguishes_decisions_events_and_inferences() -> None:
    classifier = MemoryClassifier()
    decision = classifier.classify("Decidi que o projeto HOPE AI usará PostgreSQL.")
    event = classifier.classify("Ontem conversei com a equipe sobre a migração.")
    inference = classifier.classify("Talvez a interface escura seja a preferência da usuária.")

    assert decision.memory_type == "decision"
    assert decision.kind == "fact"
    assert decision.importance >= 0.8
    assert event.kind == "event"
    assert inference.kind == "inference"
    assert inference.confidence < decision.confidence


@pytest.mark.asyncio
async def test_entities_provenance_hybrid_retrieval_and_explanation() -> None:
    database, manager = await make_manager()
    user_id = uuid.uuid4()
    try:
        created = await manager.create(
            user_id,
            MemoryCreate(
                content="Decidi que o projeto HOPE AI usa FastAPI e PostgreSQL.",
                source="conversation",
                source_reference="conversation:test:1",
                source_excerpt="Decidi que o projeto HOPE AI usa FastAPI.",
            ),
        )
        assert created.memory is not None
        assert created.memory.memory_type == "decision"
        assert created.memory.kind == "fact"
        assert created.memory.mention_count == 1

        repeated = await manager.create(
            user_id,
            MemoryCreate(
                content="Decidi que o projeto HOPE AI usa FastAPI e PostgreSQL.",
                source="manual",
            ),
        )
        assert repeated.consolidated is True
        assert repeated.memory is not None and repeated.memory.mention_count == 2

        entities = await manager.list_entities(user_id)
        names = {entity.name for entity in entities}
        assert {"HOPE AI", "FastAPI", "PostgreSQL"}.issubset(names)

        explanation = await manager.explain(user_id, created.memory.id)
        assert explanation is not None
        assert len(explanation.sources) == 2
        assert {entity.name for entity in explanation.entities} >= {
            "HOPE AI",
            "FastAPI",
            "PostgreSQL",
        }
        assert any(event.event_type == "consolidated" for event in explanation.events)

        retrieved = await manager.retrieve(user_id, "FastAPI", limit=5)
        assert retrieved
        assert retrieved[0].memory.id == created.memory.id
        assert retrieved[0].match_kind in {"semantic", "text", "hybrid"}

        graph = await manager.graph(user_id)
        assert len(graph.entities) >= 3
        assert len(graph.entity_links) >= 3

        fastapi = next(entity for entity in entities if entity.name == "FastAPI")
        linked = await manager.entity_memories(user_id, fastapi.id)
        assert linked is not None and linked[0].id == created.memory.id
    finally:
        await database.dispose()


@pytest.mark.asyncio
async def test_similar_memories_receive_automatic_relation() -> None:
    database, manager = await make_manager()
    user_id = uuid.uuid4()
    try:
        first = await manager.create(
            user_id, MemoryCreate(content="HOPE AI usa FastAPI no backend principal.")
        )
        second = await manager.create(
            user_id,
            MemoryCreate(content="O backend da HOPE AI usa FastAPI e PostgreSQL."),
        )
        assert first.memory is not None and second.memory is not None
        assert second.consolidated is False
        graph = await manager.graph(user_id)
        assert any(edge.relation_type == "semantic_related" for edge in graph.edges)
    finally:
        await database.dispose()


@pytest.mark.asyncio
async def test_entity_upsert_is_idempotent_for_normalized_identity() -> None:
    database, _ = await make_manager()
    user_id = uuid.uuid4()
    try:
        async with database.session() as session:
            session.add(UserRecord(id=user_id, display_name=None))
        async with database.session() as session:
            repository = EntityRepository(session)
            first = await repository.upsert(
                user_id, EntityCandidate("São Paulo", "place", 0.9)
            )
            repeated = await repository.upsert(
                user_id, EntityCandidate("SAO   PAULO", "place", 0.8)
            )
            count = await session.scalar(
                select(func.count()).select_from(EntityRecord).where(
                    EntityRecord.user_id == user_id,
                    EntityRecord.normalized_name == "sao paulo",
                    EntityRecord.entity_type == "place",
                )
            )

            assert repeated.id == first.id
            assert count == 1
    finally:
        await database.dispose()


@pytest.mark.asyncio
async def test_database_rejects_cross_user_relations() -> None:
    database, _ = await make_manager()
    first_user = uuid.uuid4()
    second_user = uuid.uuid4()
    first_memory = uuid.uuid4()
    second_memory = uuid.uuid4()
    try:
        async with database.engine.connect() as connection:
            await connection.execute(text("PRAGMA foreign_keys = ON"))
            await connection.commit()
        async with database.session() as session:
            session.add_all(
                [
                    UserRecord(id=first_user, display_name=None),
                    UserRecord(id=second_user, display_name=None),
                ]
            )
        async with database.session() as session:
            session.add_all(
                [
                    MemoryRecord(id=first_memory, user_id=first_user, content="Memória A"),
                    MemoryRecord(id=second_memory, user_id=second_user, content="Memória B"),
                ]
            )

        with pytest.raises(IntegrityError):
            async with database.session() as session:
                session.add(
                    MemoryRelationRecord(
                        user_id=first_user,
                        source_memory_id=first_memory,
                        target_memory_id=second_memory,
                        relation_type="related_to",
                    )
                )
    finally:
        await database.dispose()


@pytest.mark.asyncio
async def test_database_rejects_invalid_memory_values() -> None:
    database, _ = await make_manager()
    user_id = uuid.uuid4()
    try:
        async with database.engine.connect() as connection:
            await connection.execute(text("PRAGMA foreign_keys = ON"))
            await connection.commit()
        async with database.session() as session:
            session.add(UserRecord(id=user_id, display_name=None))

        with pytest.raises(IntegrityError):
            async with database.session() as session:
                session.add(
                    MemoryRecord(
                        user_id=user_id,
                        content="   ",
                        importance=1.1,
                        confidence=1.0,
                    )
                )
    finally:
        await database.dispose()
