from __future__ import annotations

import uuid

from ..database.models import MemoryRecord
from .repository import MemoryRepository


class RelationManager:
    def __init__(self, min_similarity: float = 0.28, max_relations: int = 5) -> None:
        self.min_similarity = min_similarity
        self.max_relations = max_relations

    async def link_similar(
        self,
        repository: MemoryRepository,
        *,
        user_id: uuid.UUID,
        memory: MemoryRecord,
        candidates: list[tuple[MemoryRecord, float]],
    ) -> None:
        linked = 0
        for candidate, similarity in candidates:
            if candidate.id == memory.id or similarity < self.min_similarity:
                continue
            await repository.create_relation(
                user_id=user_id,
                source_memory_id=memory.id,
                target_memory_id=candidate.id,
                relation_type="semantic_related",
                weight=min(1.0, similarity),
            )
            linked += 1
            if linked >= self.max_relations:
                break
