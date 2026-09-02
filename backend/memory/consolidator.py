from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from ..database.models import MemoryRecord
from .repository import MemoryRepository


@dataclass(frozen=True)
class ConsolidationDecision:
    memory: MemoryRecord
    similarity: float
    update_values: dict[str, Any]


class MemoryConsolidator:
    def __init__(self, duplicate_similarity: float = 0.92) -> None:
        self.duplicate_similarity = duplicate_similarity

    async def find_duplicate(
        self,
        repository: MemoryRepository,
        *,
        user_id,
        embedding: list[float],
        importance: float,
        confidence: float,
        tags: list[str],
        extra_metadata: dict[str, Any],
    ) -> ConsolidationDecision | None:
        matches = await repository.search_semantic(
            user_id,
            embedding,
            limit=1,
            min_similarity=self.duplicate_similarity,
        )
        if not matches:
            return None
        memory, similarity = matches[0]
        update_values = {
            "importance": max(memory.importance, importance),
            "confidence": max(memory.confidence, confidence),
            "tags": list(dict.fromkeys([*memory.tags, *tags]))[:24],
            "extra_metadata": {**memory.extra_metadata, **extra_metadata},
            "mention_count": memory.mention_count + 1,
            "last_reinforced_at": datetime.now(timezone.utc),
        }
        return ConsolidationDecision(memory, similarity, update_values)
