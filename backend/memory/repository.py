from __future__ import annotations

import math
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Float, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.models import (
    MemoryEventRecord,
    MemoryRecord,
    MemoryRelationRecord,
    MemorySourceRecord,
    UserRecord,
)


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right):
        return 0.0
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if not left_norm or not right_norm:
        return 0.0
    return sum(a * b for a, b in zip(left, right, strict=True)) / (left_norm * right_norm)


class MemoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def ensure_user(self, user_id: uuid.UUID) -> UserRecord:
        user = await self.session.get(UserRecord, user_id)
        if user is None:
            user = UserRecord(id=user_id)
            self.session.add(user)
            await self.session.flush()
        return user

    async def create(
        self,
        *,
        user_id: uuid.UUID,
        content: str,
        memory_type: str,
        kind: str,
        title: str | None,
        summary: str | None,
        category: str | None,
        tags: list[str],
        source: str,
        importance: float,
        confidence: float,
        emotional_weight: float,
        embedding: list[float],
        extra_metadata: dict[str, Any],
    ) -> MemoryRecord:
        await self.ensure_user(user_id)
        memory = MemoryRecord(
            user_id=user_id,
            content=content,
            memory_type=memory_type,
            kind=kind,
            title=title,
            summary=summary,
            category=category,
            tags=tags,
            source=source,
            importance=importance,
            confidence=confidence,
            emotional_weight=emotional_weight,
            embedding=embedding,
            extra_metadata=extra_metadata,
        )
        self.session.add(memory)
        await self.session.flush()
        await self.record_event(user_id, memory.id, "created", {"source": source})
        return memory

    async def get(self, user_id: uuid.UUID, memory_id: uuid.UUID) -> MemoryRecord | None:
        statement = select(MemoryRecord).where(
            MemoryRecord.id == memory_id, MemoryRecord.user_id == user_id
        )
        return (await self.session.scalars(statement)).first()

    async def list(self, user_id: uuid.UUID, *, limit: int = 50, offset: int = 0) -> list[MemoryRecord]:
        statement = (
            select(MemoryRecord)
            .where(MemoryRecord.user_id == user_id)
            .order_by(MemoryRecord.importance.desc(), MemoryRecord.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list((await self.session.scalars(statement)).all())

    async def update(
        self, user_id: uuid.UUID, memory_id: uuid.UUID, values: dict[str, Any]
    ) -> MemoryRecord | None:
        memory = await self.get(user_id, memory_id)
        if memory is None:
            return None
        for key, value in values.items():
            setattr(memory, key, value)
        memory.updated_at = datetime.now(timezone.utc)
        await self.session.flush()
        await self.record_event(user_id, memory_id, "updated", {"fields": sorted(values)})
        return memory

    async def delete(self, user_id: uuid.UUID, memory_id: uuid.UUID) -> bool:
        memory = await self.get(user_id, memory_id)
        if memory is None:
            return False
        await self.record_event(
            user_id,
            None,
            "deleted",
            {"memory_id": str(memory_id), "title": memory.title},
        )
        await self.session.delete(memory)
        await self.session.flush()
        return True

    async def search_text(
        self, user_id: uuid.UUID, query: str, *, limit: int = 10
    ) -> list[MemoryRecord]:
        statement = (
            select(MemoryRecord)
            .where(
                MemoryRecord.user_id == user_id,
                or_(
                    func.lower(MemoryRecord.content).contains(query.casefold()),
                    func.lower(func.coalesce(MemoryRecord.title, "")).contains(query.casefold()),
                    func.lower(func.coalesce(MemoryRecord.summary, "")).contains(query.casefold()),
                ),
            )
            .order_by(MemoryRecord.importance.desc())
            .limit(limit)
        )
        return list((await self.session.scalars(statement)).all())

    async def search_semantic(
        self,
        user_id: uuid.UUID,
        embedding: list[float],
        *,
        limit: int = 10,
        min_similarity: float = 0.0,
    ) -> list[tuple[MemoryRecord, float]]:
        dialect_name = self.session.bind.dialect.name if self.session.bind else ""
        if dialect_name == "postgresql":
            distance = MemoryRecord.embedding.op("<=>", return_type=Float)(embedding)
            statement = (
                select(MemoryRecord, (1.0 - distance).label("similarity"))
                .where(
                    MemoryRecord.user_id == user_id,
                    MemoryRecord.embedding.is_not(None),
                    distance <= 1.0 - min_similarity,
                )
                .order_by(distance)
                .limit(limit)
            )
            rows = (await self.session.execute(statement)).all()
            return [(row[0], float(row[1])) for row in rows]

        memories = await self.list(user_id, limit=1000)
        scored = [
            (memory, cosine_similarity(memory.embedding or [], embedding))
            for memory in memories
            if memory.embedding
        ]
        return sorted(
            (item for item in scored if item[1] >= min_similarity),
            key=lambda item: item[1],
            reverse=True,
        )[:limit]

    async def touch(self, memory: MemoryRecord) -> None:
        memory.access_count += 1
        memory.last_accessed_at = datetime.now(timezone.utc)
        await self.record_event(memory.user_id, memory.id, "accessed", {})
        await self.session.flush()

    async def create_relation(
        self,
        *,
        user_id: uuid.UUID,
        source_memory_id: uuid.UUID,
        target_memory_id: uuid.UUID,
        relation_type: str,
        weight: float,
    ) -> MemoryRelationRecord:
        source = await self.get(user_id, source_memory_id)
        target = await self.get(user_id, target_memory_id)
        if source is None or target is None:
            raise ValueError("As duas memórias precisam pertencer ao usuário.")
        existing_statement = select(MemoryRelationRecord).where(
            MemoryRelationRecord.user_id == user_id,
            MemoryRelationRecord.source_memory_id == source_memory_id,
            MemoryRelationRecord.target_memory_id == target_memory_id,
            MemoryRelationRecord.relation_type == relation_type,
        )
        existing = (await self.session.scalars(existing_statement)).first()
        if existing is not None:
            existing.weight = max(existing.weight, weight)
            await self.session.flush()
            return existing
        relation = MemoryRelationRecord(
            user_id=user_id,
            source_memory_id=source_memory_id,
            target_memory_id=target_memory_id,
            relation_type=relation_type,
            weight=weight,
        )
        self.session.add(relation)
        await self.session.flush()
        return relation

    async def list_relations(self, user_id: uuid.UUID) -> list[MemoryRelationRecord]:
        statement = (
            select(MemoryRelationRecord)
            .where(MemoryRelationRecord.user_id == user_id)
            .order_by(MemoryRelationRecord.created_at)
        )
        return list((await self.session.scalars(statement)).all())

    async def clear_semantic_relations(
        self, user_id: uuid.UUID, source_memory_id: uuid.UUID
    ) -> None:
        await self.session.execute(
            delete(MemoryRelationRecord).where(
                MemoryRelationRecord.user_id == user_id,
                MemoryRelationRecord.source_memory_id == source_memory_id,
                MemoryRelationRecord.relation_type == "semantic_related",
            )
        )

    async def relations_for(
        self, user_id: uuid.UUID, memory_id: uuid.UUID
    ) -> list[MemoryRelationRecord]:
        statement = (
            select(MemoryRelationRecord)
            .where(
                MemoryRelationRecord.user_id == user_id,
                or_(
                    MemoryRelationRecord.source_memory_id == memory_id,
                    MemoryRelationRecord.target_memory_id == memory_id,
                ),
            )
            .order_by(MemoryRelationRecord.weight.desc())
        )
        return list((await self.session.scalars(statement)).all())

    async def add_source(
        self,
        *,
        user_id: uuid.UUID,
        memory_id: uuid.UUID,
        source_type: str,
        source_reference: str | None = None,
        excerpt: str | None = None,
    ) -> MemorySourceRecord:
        source = MemorySourceRecord(
            user_id=user_id,
            memory_id=memory_id,
            source_type=source_type,
            source_reference=source_reference,
            excerpt=excerpt,
        )
        self.session.add(source)
        await self.session.flush()
        return source

    async def list_sources(
        self, user_id: uuid.UUID, memory_id: uuid.UUID
    ) -> list[MemorySourceRecord]:
        statement = (
            select(MemorySourceRecord)
            .where(
                MemorySourceRecord.user_id == user_id,
                MemorySourceRecord.memory_id == memory_id,
            )
            .order_by(MemorySourceRecord.created_at)
        )
        return list((await self.session.scalars(statement)).all())

    async def list_events(
        self, user_id: uuid.UUID, memory_id: uuid.UUID
    ) -> list[MemoryEventRecord]:
        statement = (
            select(MemoryEventRecord)
            .where(
                MemoryEventRecord.user_id == user_id,
                MemoryEventRecord.memory_id == memory_id,
            )
            .order_by(MemoryEventRecord.created_at)
        )
        return list((await self.session.scalars(statement)).all())

    async def record_event(
        self,
        user_id: uuid.UUID,
        memory_id: uuid.UUID | None,
        event_type: str,
        payload: dict[str, Any],
    ) -> None:
        self.session.add(
            MemoryEventRecord(
                user_id=user_id,
                memory_id=memory_id,
                event_type=event_type,
                payload=payload,
            )
        )
