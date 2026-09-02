from __future__ import annotations

import uuid
from dataclasses import dataclass

from ..database.models import MemoryRecord
from .embeddings import EmbeddingService
from .repository import MemoryRepository


@dataclass(frozen=True)
class RetrievedMemory:
    memory: MemoryRecord
    score: float
    match_kind: str


class MemoryRetriever:
    """Combina similaridade vetorial, texto e importância sem duplicar resultados."""

    def __init__(self, embeddings: EmbeddingService) -> None:
        self.embeddings = embeddings

    async def retrieve(
        self,
        repository: MemoryRepository,
        user_id: uuid.UUID,
        query: str,
        *,
        limit: int = 10,
    ) -> list[RetrievedMemory]:
        embedding = await self.embeddings.embed(query)
        semantic = await repository.search_semantic(
            user_id, embedding, limit=limit * 2, min_similarity=0.12
        )
        lexical = await repository.search_text(user_id, query, limit=limit)
        ranked: dict[uuid.UUID, RetrievedMemory] = {}
        for memory, similarity in semantic:
            score = max(0.0, similarity) * 0.8 + memory.importance * 0.2
            ranked[memory.id] = RetrievedMemory(memory, min(1.0, score), "semantic")
        for memory in lexical:
            score = 0.72 + memory.importance * 0.2
            existing = ranked.get(memory.id)
            candidate = RetrievedMemory(memory, min(1.0, score), "hybrid" if existing else "text")
            if existing is None or candidate.score >= existing.score:
                ranked[memory.id] = candidate
        return sorted(ranked.values(), key=lambda item: item.score, reverse=True)[:limit]
