from __future__ import annotations

import uuid
from typing import Any

from ..database.models import MemoryRelationRecord
from ..database.session import Database
from .classifier import MemoryClassifier
from .consolidator import MemoryConsolidator
from .embeddings import EmbeddingProvider, EmbeddingService
from .entities import EntityRepository, RuleBasedEntityExtractor
from .relations import RelationManager
from .repository import MemoryRepository
from .retriever import MemoryRetriever
from .schemas import (
    EntityView,
    MemoryCreate,
    MemoryEventView,
    MemoryExplanation,
    MemoryGraph,
    MemoryRelationView,
    MemorySearchHit,
    MemorySourceView,
    MemoryUpdate,
    MemoryView,
    MemoryWriteResult,
)


class MemoryManager:
    def __init__(
        self,
        database: Database,
        embeddings: EmbeddingProvider,
        *,
        min_importance: float = 0.45,
        duplicate_similarity: float = 0.92,
    ) -> None:
        self.database = database
        self.embeddings = EmbeddingService(embeddings)
        self.min_importance = min_importance
        self.duplicate_similarity = duplicate_similarity
        self.classifier = MemoryClassifier()
        self.consolidator = MemoryConsolidator(duplicate_similarity)
        self.extractor = RuleBasedEntityExtractor()
        self.retriever = MemoryRetriever(self.embeddings)
        self.relation_manager = RelationManager()

    async def create(self, user_id: uuid.UUID, payload: MemoryCreate) -> MemoryWriteResult:
        classification = self.classifier.classify(payload.content)
        memory_type = classification.memory_type if payload.memory_type == "auto" else payload.memory_type
        kind = classification.kind if payload.kind == "auto" else payload.kind
        importance = (
            payload.importance
            if payload.importance is not None
            else classification.importance
        )
        confidence = payload.confidence if payload.confidence is not None else classification.confidence
        if kind == "inference":
            confidence = min(confidence, 0.75)
        tags = list(dict.fromkeys([*classification.tags, *payload.tags]))[:24]
        if not payload.force and importance < self.min_importance:
            return MemoryWriteResult(
                saved=False,
                reason="Conteúdo abaixo do limiar de importância para captura automática.",
            )

        embedding = await self.embeddings.embed(payload.content)
        async with self.database.session() as session:
            repository = MemoryRepository(session)
            similar = await repository.search_semantic(user_id, embedding, limit=10)
            decision = await self.consolidator.find_duplicate(
                repository,
                user_id=user_id,
                embedding=embedding,
                importance=importance,
                confidence=confidence,
                tags=tags,
                extra_metadata=payload.extra_metadata,
            )
            if decision is not None:
                updated = await repository.update(
                    user_id,
                    decision.memory.id,
                    decision.update_values,
                )
                assert updated is not None
                await repository.add_source(
                    user_id=user_id,
                    memory_id=updated.id,
                    source_type=payload.source,
                    source_reference=payload.source_reference,
                    excerpt=payload.source_excerpt,
                )
                await repository.record_event(
                    user_id,
                    updated.id,
                    "consolidated",
                    {"similarity": round(decision.similarity, 4)},
                )
                return MemoryWriteResult(
                    saved=True,
                    consolidated=True,
                    memory=MemoryView.model_validate(updated),
                )

            memory = await repository.create(
                user_id=user_id,
                content=payload.content,
                memory_type=memory_type,
                kind=kind,
                title=payload.title or classification.title,
                summary=payload.summary or classification.summary,
                category=payload.category or classification.category,
                tags=tags,
                source=payload.source,
                importance=importance,
                confidence=confidence,
                emotional_weight=payload.emotional_weight,
                embedding=embedding,
                extra_metadata=payload.extra_metadata,
            )
            await repository.add_source(
                user_id=user_id,
                memory_id=memory.id,
                source_type=payload.source,
                source_reference=payload.source_reference,
                excerpt=payload.source_excerpt,
            )
            candidates = await self.extractor.extract(payload.content)
            await EntityRepository(session).replace_memory_entities(user_id, memory.id, candidates)
            await self.relation_manager.link_similar(
                repository,
                user_id=user_id,
                memory=memory,
                candidates=similar,
            )
            await repository.record_event(
                user_id,
                memory.id,
                "entities_extracted",
                {"count": len(candidates)},
            )
            return MemoryWriteResult(saved=True, memory=MemoryView.model_validate(memory))

    async def get(self, user_id: uuid.UUID, memory_id: uuid.UUID) -> MemoryView | None:
        async with self.database.session() as session:
            repository = MemoryRepository(session)
            memory = await repository.get(user_id, memory_id)
            if memory is None:
                return None
            await repository.touch(memory)
            return MemoryView.model_validate(memory)

    async def list(self, user_id: uuid.UUID, *, limit: int, offset: int) -> list[MemoryView]:
        async with self.database.session() as session:
            memories = await MemoryRepository(session).list(user_id, limit=limit, offset=offset)
            return [MemoryView.model_validate(memory) for memory in memories]

    async def update(
        self, user_id: uuid.UUID, memory_id: uuid.UUID, payload: MemoryUpdate
    ) -> MemoryView | None:
        values: dict[str, Any] = payload.model_dump(exclude_unset=True)
        if payload.kind == "inference":
            values["confidence"] = min(payload.confidence or 0.75, 0.75)
        if payload.content is not None:
            values["embedding"] = await self.embeddings.embed(payload.content)
        async with self.database.session() as session:
            repository = MemoryRepository(session)
            memory = await repository.update(user_id, memory_id, values)
            if memory is not None and payload.content is not None:
                candidates = await self.extractor.extract(payload.content)
                await EntityRepository(session).replace_memory_entities(
                    user_id, memory.id, candidates
                )
                await repository.clear_semantic_relations(user_id, memory.id)
                similar = await repository.search_semantic(
                    user_id, values["embedding"], limit=10
                )
                await self.relation_manager.link_similar(
                    repository,
                    user_id=user_id,
                    memory=memory,
                    candidates=similar,
                )
            return MemoryView.model_validate(memory) if memory else None

    async def delete(self, user_id: uuid.UUID, memory_id: uuid.UUID) -> bool:
        async with self.database.session() as session:
            return await MemoryRepository(session).delete(user_id, memory_id)

    async def search(
        self, user_id: uuid.UUID, query: str, *, limit: int = 10
    ) -> list[MemoryView]:
        async with self.database.session() as session:
            repository = MemoryRepository(session)
            results = await self.retriever.retrieve(repository, user_id, query, limit=limit)
            for result in results:
                await repository.touch(result.memory)
            return [MemoryView.model_validate(result.memory) for result in results]

    async def retrieve(
        self, user_id: uuid.UUID, query: str, *, limit: int = 10
    ) -> list[MemorySearchHit]:
        async with self.database.session() as session:
            repository = MemoryRepository(session)
            results = await self.retriever.retrieve(repository, user_id, query, limit=limit)
            for result in results:
                await repository.touch(result.memory)
            return [
                MemorySearchHit(
                    memory=MemoryView.model_validate(result.memory),
                    score=result.score,
                    match_kind=result.match_kind,
                )
                for result in results
            ]

    async def relate(
        self,
        user_id: uuid.UUID,
        source_memory_id: uuid.UUID,
        target_memory_id: uuid.UUID,
        relation_type: str,
        weight: float,
    ) -> MemoryRelationRecord:
        async with self.database.session() as session:
            return await MemoryRepository(session).create_relation(
                user_id=user_id,
                source_memory_id=source_memory_id,
                target_memory_id=target_memory_id,
                relation_type=relation_type,
                weight=weight,
            )

    async def delete_relation(
        self,
        user_id: uuid.UUID,
        memory_id: uuid.UUID,
        relation_id: uuid.UUID,
    ) -> MemoryRelationView | None:
        async with self.database.session() as session:
            relation = await MemoryRepository(session).delete_relation(
                user_id, memory_id, relation_id
            )
            return MemoryRelationView.model_validate(relation) if relation else None

    async def graph_fragment(
        self, user_id: uuid.UUID, memory_id: uuid.UUID
    ) -> MemoryGraph | None:
        async with self.database.session() as session:
            repository = MemoryRepository(session)
            memory = await repository.get(user_id, memory_id)
            if memory is None:
                return None
            entity_repository = EntityRepository(session)
            return MemoryGraph(
                nodes=[memory],
                edges=await repository.relations_for(user_id, memory_id),
                entities=await entity_repository.for_memory(user_id, memory_id),
                entity_links=await entity_repository.links_for_memory(user_id, memory_id),
            )

    async def graph(self, user_id: uuid.UUID, *, limit: int = 200) -> MemoryGraph:
        async with self.database.session() as session:
            repository = MemoryRepository(session)
            nodes = await repository.list(user_id, limit=limit)
            node_ids = {node.id for node in nodes}
            edges = [
                edge
                for edge in await repository.list_relations(user_id)
                if edge.source_memory_id in node_ids and edge.target_memory_id in node_ids
            ]
            entity_repository = EntityRepository(session)
            entities = await entity_repository.list(user_id, limit=limit)
            entity_ids = {entity.id for entity in entities}
            entity_links = [
                link
                for link in await entity_repository.links(user_id)
                if link.memory_id in node_ids and link.entity_id in entity_ids
            ]
            return MemoryGraph(
                nodes=nodes,
                edges=edges,
                entities=entities,
                entity_links=entity_links,
            )

    async def explain(
        self, user_id: uuid.UUID, memory_id: uuid.UUID
    ) -> MemoryExplanation | None:
        async with self.database.session() as session:
            repository = MemoryRepository(session)
            memory = await repository.get(user_id, memory_id)
            if memory is None:
                return None
            entity_repository = EntityRepository(session)
            return MemoryExplanation(
                memory=MemoryView.model_validate(memory),
                sources=[
                    MemorySourceView.model_validate(source)
                    for source in await repository.list_sources(user_id, memory_id)
                ],
                entities=[
                    EntityView.model_validate(entity)
                    for entity in await entity_repository.for_memory(user_id, memory_id)
                ],
                relations=await repository.relations_for(user_id, memory_id),
                events=[
                    MemoryEventView.model_validate(event)
                    for event in await repository.list_events(user_id, memory_id)
                ],
            )

    async def list_entities(
        self, user_id: uuid.UUID, *, limit: int = 200
    ) -> list[EntityView]:
        async with self.database.session() as session:
            entities = await EntityRepository(session).list(user_id, limit=limit)
            return [EntityView.model_validate(entity) for entity in entities]

    async def entity_memories(
        self, user_id: uuid.UUID, entity_id: uuid.UUID, *, limit: int = 100
    ) -> list[MemoryView] | None:
        async with self.database.session() as session:
            repository = EntityRepository(session)
            if await repository.get(user_id, entity_id) is None:
                return None
            memories = await repository.memories_for(user_id, entity_id, limit=limit)
            return [MemoryView.model_validate(memory) for memory in memories]
