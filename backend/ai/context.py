from __future__ import annotations

import json
import uuid

from ..memory.manager import MemoryManager
from ..memory.schemas import MemorySearchHit, MemoryView
from ..models import HistoryMessage, Source
from .models import (
    MemoryContext,
    RecentContextItem,
    RetrievedEntityContext,
    RetrievedMemoryContext,
    RetrievedRelationContext,
)


def _trim(value: str | None, limit: int) -> str:
    normalized = " ".join((value or "").replace("\x00", "").split())
    return normalized[:limit]


def _memory_item(memory: MemoryView, relevance: float) -> RetrievedMemoryContext:
    return RetrievedMemoryContext(
        id=str(memory.id),
        kind=memory.kind,
        memory_type=memory.memory_type,
        title=_trim(memory.title, 180) or None,
        content=_trim(memory.summary or memory.content, 700),
        importance=memory.importance,
        confidence=memory.confidence,
        source=_trim(memory.source, 80),
        created_at=memory.created_at,
        updated_at=memory.updated_at,
        relevance=max(0.0, min(1.0, relevance)),
    )


def _is_profile_query(query: str) -> bool:
    text = query.casefold()
    return any(
        phrase in text
        for phrase in (
            "o que você sabe sobre mim",
            "o que voce sabe sobre mim",
            "o que você lembra sobre mim",
            "minhas preferências",
            "minhas preferencias",
        )
    )


class MemoryContextBuilder:
    def __init__(self, manager: MemoryManager | None, *, limit: int = 8) -> None:
        self.manager = manager
        self.limit = limit

    async def build(
        self,
        user_id: uuid.UUID | None,
        query: str,
        history: list[HistoryMessage],
    ) -> MemoryContext:
        recent = [
            RecentContextItem(role=item.role, content=_trim(item.content, 500))
            for item in history[-6:]
        ]
        if self.manager is None or user_id is None:
            return MemoryContext(
                available=False,
                degraded_reason="Memória persistente não configurada para esta conversa.",
                recent_context=recent,
            )

        if _is_profile_query(query):
            listed = await self.manager.list(user_id, limit=self.limit, offset=0)
            hits = [
                MemorySearchHit(memory=memory, score=memory.importance, match_kind="text")
                for memory in listed
            ]
        else:
            hits = await self.manager.retrieve(user_id, query, limit=self.limit * 2)
            hits = [hit for hit in hits if hit.score >= 0.28][: self.limit]

        memories = [_memory_item(hit.memory, hit.score) for hit in hits]
        entities: dict[str, RetrievedEntityContext] = {}
        relations: dict[str, RetrievedRelationContext] = {}
        for hit in hits[:5]:
            explanation = await self.manager.explain(user_id, hit.memory.id)
            if explanation is None:
                continue
            for entity in explanation.entities:
                entities[str(entity.id)] = RetrievedEntityContext(
                    id=str(entity.id), name=_trim(entity.name, 160), entity_type=entity.entity_type
                )
            for relation in explanation.relations:
                relations[str(relation.id)] = RetrievedRelationContext(
                    id=str(relation.id),
                    source_memory_id=str(relation.source_memory_id),
                    target_memory_id=str(relation.target_memory_id),
                    relation_type=relation.relation_type,
                    weight=relation.weight,
                )

        average = sum(item.relevance for item in memories) / len(memories) if memories else 0.0
        return MemoryContext(
            relevant_memories=memories,
            relevant_entities=list(entities.values()),
            relevant_relations=list(relations.values()),
            recent_context=recent,
            user_preferences=[item for item in memories if item.memory_type == "preference"],
            decisions=[item for item in memories if item.memory_type == "decision"],
            confidence=min(1.0, average),
        )


def serialize_memory_context(context: MemoryContext, *, limit: int = 9000) -> str:
    payload = context.model_dump(mode="json", exclude_none=True)
    encoded = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    if len(encoded) <= limit:
        return encoded
    payload["recent_context"] = []
    payload["relevant_entities"] = payload["relevant_entities"][:12]
    payload["relevant_relations"] = payload["relevant_relations"][:12]
    for memory in payload["relevant_memories"]:
        memory["content"] = memory["content"][:400]
    while len(payload["relevant_memories"]) > 1:
        encoded = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        if len(encoded) <= limit:
            return encoded
        removed_id = payload["relevant_memories"].pop()["id"]
        payload["user_preferences"] = [
            item for item in payload["user_preferences"] if item["id"] != removed_id
        ]
        payload["decisions"] = [
            item for item in payload["decisions"] if item["id"] != removed_id
        ]
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def serialize_external_context(sources: list[Source], *, limit: int = 6000) -> str:
    remaining = limit
    data: list[dict[str, str]] = []
    for source in sources:
        if remaining <= 0:
            break
        excerpt = _trim(source.excerpt, remaining)
        remaining -= len(excerpt)
        data.append(
            {
                "kind": source.kind,
                "title": _trim(source.title, 200),
                "reference": _trim(source.reference, 1000),
                "excerpt": excerpt,
            }
        )
    return json.dumps(data, ensure_ascii=False, separators=(",", ":"))
