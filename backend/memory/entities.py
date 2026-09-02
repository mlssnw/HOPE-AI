from __future__ import annotations

import re
import unicodedata
import uuid
from dataclasses import dataclass

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.models import EntityRecord, MemoryEntityRecord, MemoryRecord


def normalize_entity_name(value: str) -> str:
    folded = unicodedata.normalize("NFKD", value.casefold())
    return " ".join("".join(char for char in folded if not unicodedata.combining(char)).split())


@dataclass(frozen=True)
class EntityCandidate:
    name: str
    entity_type: str
    confidence: float


class EntityExtractor:
    async def extract(self, content: str) -> list[EntityCandidate]:
        raise NotImplementedError


class RuleBasedEntityExtractor(EntityExtractor):
    TECHNOLOGIES = (
        "HOPE AI",
        "Memory Globe",
        "FastAPI",
        "PostgreSQL",
        "pgvector",
        "Obsidian",
        "ElevenLabs",
        "Claude",
        "Tavily",
        "React",
        "Three.js",
        "OpenAI",
        "Azure",
        "GitHub",
        "Notion",
        "Gmail",
        "Spotify",
    )

    async def extract(self, content: str) -> list[EntityCandidate]:
        candidates: list[EntityCandidate] = []
        for technology in self.TECHNOLOGIES:
            if re.search(rf"(?<!\w){re.escape(technology)}(?!\w)", content, re.IGNORECASE):
                candidates.append(EntityCandidate(technology, "technology", 0.98))

        for match in re.finditer(
            r"\bprojeto\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÀ-ÿ.-]*(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÀ-ÿ.-]*){0,3})",
            content,
        ):
            candidates.append(EntityCandidate(match.group(1).strip(" .,"), "project", 0.9))

        for match in re.finditer(
            r"\b(?:meu|minha)\s+(?:amigo|amiga|irmão|irmã|colega|cliente)\s+(?:se chama\s+)?([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÀ-ÿ'-]+)",
            content,
        ):
            candidates.append(EntityCandidate(match.group(1), "person", 0.88))

        for hashtag in re.findall(r"#([\wÀ-ÿ-]+)", content):
            candidates.append(EntityCandidate(hashtag, "topic", 0.85))

        unique: dict[tuple[str, str], EntityCandidate] = {}
        for candidate in candidates:
            key = (normalize_entity_name(candidate.name), candidate.entity_type)
            if key[0]:
                unique[key] = candidate
        return list(unique.values())[:24]


class EntityRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upsert(self, user_id: uuid.UUID, candidate: EntityCandidate) -> EntityRecord:
        normalized = normalize_entity_name(candidate.name)
        statement = select(EntityRecord).where(
            EntityRecord.user_id == user_id,
            EntityRecord.normalized_name == normalized,
            EntityRecord.entity_type == candidate.entity_type,
        )
        entity = (await self.session.scalars(statement)).first()
        if entity is None:
            entity = EntityRecord(
                user_id=user_id,
                name=candidate.name,
                normalized_name=normalized,
                entity_type=candidate.entity_type,
                attributes={},
            )
            self.session.add(entity)
            await self.session.flush()
        return entity

    async def replace_memory_entities(
        self,
        user_id: uuid.UUID,
        memory_id: uuid.UUID,
        candidates: list[EntityCandidate],
    ) -> list[EntityRecord]:
        await self.session.execute(
            delete(MemoryEntityRecord).where(
                MemoryEntityRecord.user_id == user_id,
                MemoryEntityRecord.memory_id == memory_id,
            )
        )
        entities = []
        for candidate in candidates:
            entity = await self.upsert(user_id, candidate)
            self.session.add(
                MemoryEntityRecord(
                    user_id=user_id,
                    memory_id=memory_id,
                    entity_id=entity.id,
                    role="mentioned_in",
                    confidence=candidate.confidence,
                )
            )
            entities.append(entity)
        await self.session.flush()
        return entities

    async def list(self, user_id: uuid.UUID, *, limit: int = 200) -> list[EntityRecord]:
        statement = (
            select(EntityRecord)
            .where(EntityRecord.user_id == user_id)
            .order_by(EntityRecord.name)
            .limit(limit)
        )
        return list((await self.session.scalars(statement)).all())

    async def get(self, user_id: uuid.UUID, entity_id: uuid.UUID) -> EntityRecord | None:
        statement = select(EntityRecord).where(
            EntityRecord.user_id == user_id, EntityRecord.id == entity_id
        )
        return (await self.session.scalars(statement)).first()

    async def for_memory(self, user_id: uuid.UUID, memory_id: uuid.UUID) -> list[EntityRecord]:
        statement = (
            select(EntityRecord)
            .join(MemoryEntityRecord, MemoryEntityRecord.entity_id == EntityRecord.id)
            .where(
                MemoryEntityRecord.user_id == user_id,
                MemoryEntityRecord.memory_id == memory_id,
            )
            .order_by(EntityRecord.name)
        )
        return list((await self.session.scalars(statement)).all())

    async def memories_for(
        self, user_id: uuid.UUID, entity_id: uuid.UUID, *, limit: int = 100
    ) -> list[MemoryRecord]:
        statement = (
            select(MemoryRecord)
            .join(MemoryEntityRecord, MemoryEntityRecord.memory_id == MemoryRecord.id)
            .where(
                MemoryEntityRecord.user_id == user_id,
                MemoryEntityRecord.entity_id == entity_id,
            )
            .order_by(MemoryRecord.importance.desc())
            .limit(limit)
        )
        return list((await self.session.scalars(statement)).all())

    async def links(self, user_id: uuid.UUID) -> list[MemoryEntityRecord]:
        statement = select(MemoryEntityRecord).where(MemoryEntityRecord.user_id == user_id)
        return list((await self.session.scalars(statement)).all())
