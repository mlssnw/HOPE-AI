from __future__ import annotations

import argparse
import asyncio
import sys
import uuid
from pathlib import Path

from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import Settings  # noqa: E402
from backend.database.session import Database  # noqa: E402
from backend.memory.embeddings import create_embedding_provider  # noqa: E402
from backend.memory.manager import MemoryManager  # noqa: E402
from backend.memory.schemas import MemoryCreate, MemoryUpdate  # noqa: E402

EXPECTED_TABLES = {
    "alembic_version",
    "conversations",
    "entities",
    "entity_relations",
    "memories",
    "memory_entities",
    "memory_events",
    "memory_relations",
    "memory_sources",
    "messages",
    "users",
}
EXPECTED_HEAD = "20260903_0003"
EXPECTED_CONSTRAINTS = {
    "ck_entity_relations_no_self_relation",
    "ck_entity_relations_weight_range",
    "ck_memories_access_count_nonnegative",
    "ck_memories_confidence_range",
    "ck_memories_content_not_blank",
    "ck_memories_emotional_weight_range",
    "ck_memories_importance_range",
    "ck_memories_mention_count_nonnegative",
    "ck_memory_entities_confidence_range",
    "ck_memory_relations_no_self_relation",
    "ck_memory_relations_weight_range",
    "fk_entity_relations_user_source",
    "fk_entity_relations_user_target",
    "fk_memory_entities_user_entity",
    "fk_memory_entities_user_memory",
    "fk_memory_events_user_memory",
    "fk_memory_relations_user_source",
    "fk_memory_relations_user_target",
    "fk_memory_sources_user_memory",
    "uq_entities_user_id_id",
    "uq_entities_user_normalized_type",
    "uq_memories_user_id_id",
    "uq_memory_entity_role",
    "uq_memory_relation",
}
EXPECTED_INDEXES = {
    "ix_entities_user_id",
    "ix_entities_user_name",
    "ix_entities_user_normalized",
    "ix_memory_entities_entity",
    "ix_memory_entities_memory",
    "ix_memory_events_user_created",
    "ix_memory_relations_source",
    "ix_memory_relations_target",
    "ix_memory_sources_memory",
    "ix_memories_embedding_hnsw",
    "ix_memories_user_created",
    "ix_memories_user_id",
    "ix_memories_user_kind",
    "ix_memories_user_type",
}
DATA_TABLES = EXPECTED_TABLES - {"alembic_version"}


async def inspect_schema(database: Database) -> dict[str, object]:
    async with database.engine.connect() as connection:
        revision = (
            await connection.execute(text("SELECT version_num FROM alembic_version"))
        ).scalar_one()
        extension = (
            await connection.execute(
                text("SELECT extversion FROM pg_extension WHERE extname = 'vector'")
            )
        ).scalar_one_or_none()
        tables = set(
            (
                await connection.execute(
                    text(
                        "SELECT table_name FROM information_schema.tables "
                        "WHERE table_schema = current_schema()"
                    )
                )
            ).scalars()
        )
        constraints = set(
            (
                await connection.execute(
                    text(
                        "SELECT conname FROM pg_constraint "
                        "WHERE connamespace = current_schema()::regnamespace"
                    )
                )
            ).scalars()
        )
        indexes = set(
            (
                await connection.execute(
                    text(
                        "SELECT indexname FROM pg_indexes "
                        "WHERE schemaname = current_schema()"
                    )
                )
            ).scalars()
        )
        foreign_keys = (
            await connection.execute(
                text(
                    "SELECT count(*) FROM pg_constraint "
                    "WHERE connamespace = current_schema()::regnamespace AND contype = 'f'"
                )
            )
        ).scalar_one()
        row_counts = {}
        for table in sorted(DATA_TABLES):
            row_counts[table] = (
                await connection.execute(text(f'SELECT count(*) FROM "{table}"'))
            ).scalar_one()

    missing_tables = EXPECTED_TABLES - tables
    missing_constraints = EXPECTED_CONSTRAINTS - constraints
    missing_indexes = EXPECTED_INDEXES - indexes
    if revision != EXPECTED_HEAD:
        raise RuntimeError(f"Revisão inesperada: {revision}")
    if extension is None:
        raise RuntimeError("Extensão vector não está instalada.")
    if missing_tables:
        raise RuntimeError(f"Tabelas ausentes: {sorted(missing_tables)}")
    if missing_constraints:
        raise RuntimeError(f"Constraints ausentes: {sorted(missing_constraints)}")
    if missing_indexes:
        raise RuntimeError(f"Índices ausentes: {sorted(missing_indexes)}")
    if foreign_keys < 25:
        raise RuntimeError(f"Quantidade inesperada de foreign keys: {foreign_keys}")
    return {
        "revision": revision,
        "vector_version": extension,
        "tables": len(EXPECTED_TABLES),
        "constraints": len(EXPECTED_CONSTRAINTS),
        "indexes": len(EXPECTED_INDEXES),
        "foreign_keys": foreign_keys,
        "row_counts": row_counts,
    }


async def exercise_memory_manager(
    database: Database, dimensions: int, provider_name: str, environment: str
) -> None:
    manager = MemoryManager(
        database, create_embedding_provider(provider_name, dimensions, environment)
    )
    user_id = uuid.uuid4()
    first_id: uuid.UUID | None = None
    second_id: uuid.UUID | None = None
    try:
        first = await manager.create(
            user_id,
            MemoryCreate(
                content="Decidi usar PostgreSQL com pgvector no projeto HOPE.",
                source="database-preflight",
                importance=0.95,
                force=True,
            ),
        )
        second = await manager.create(
            user_id,
            MemoryCreate(
                content="O Memory Globe organiza memórias e relações semânticas.",
                source="database-preflight",
                importance=0.85,
                force=True,
            ),
        )
        if not first.saved or first.memory is None or not second.saved or second.memory is None:
            raise RuntimeError("Insert de memória não retornou registros persistidos.")
        first_id, second_id = first.memory.id, second.memory.id

        updated = await manager.update(
            user_id,
            first_id,
            MemoryUpdate(title="PostgreSQL real validado", importance=0.98),
        )
        if updated is None or updated.title != "PostgreSQL real validado":
            raise RuntimeError("Update de memória não foi persistido.")

        hits = await manager.retrieve(
            user_id, "PostgreSQL pgvector HOPE", limit=10
        )
        if not any(hit.memory.id == first_id for hit in hits):
            raise RuntimeError("Busca semântica não recuperou a memória esperada.")

        relation = await manager.relate(
            user_id, first_id, second_id, "depends_on", 0.9
        )
        graph = await manager.graph(user_id, limit=50)
        if not any(edge.id == relation.id for edge in graph.edges):
            raise RuntimeError("Relação de memória não apareceu no grafo.")

        if not await manager.delete(user_id, second_id):
            raise RuntimeError("Delete da segunda memória falhou.")
        second_id = None
        graph_after_delete = await manager.graph(user_id, limit=50)
        if any(edge.id == relation.id for edge in graph_after_delete.edges):
            raise RuntimeError("Delete não removeu a relação associada.")
        if not await manager.delete(user_id, first_id):
            raise RuntimeError("Delete da primeira memória falhou.")
        first_id = None
    finally:
        async with database.session() as session:
            await session.execute(text("DELETE FROM users WHERE id = :id"), {"id": user_id})


async def main(exercise_crud: bool) -> None:
    settings = Settings.from_env()
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL não está configurada.")
    database = Database(
        settings.database_url,
        echo=False,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        pool_timeout=settings.db_pool_timeout,
        pool_recycle=settings.db_pool_recycle,
    )
    try:
        result = await inspect_schema(database)
        print(f"revision={result['revision']}")
        print(f"vector={result['vector_version']}")
        print(f"tables={result['tables']}")
        print(f"constraints={result['constraints']}")
        print(f"indexes={result['indexes']}")
        print(f"foreign_keys={result['foreign_keys']}")
        print(f"data_rows={sum(result['row_counts'].values())}")
        if exercise_crud:
            await exercise_memory_manager(
                database,
                settings.embedding_dimensions,
                settings.embedding_provider,
                settings.app_environment,
            )
            after = await inspect_schema(database)
            if sum(after["row_counts"].values()) != sum(result["row_counts"].values()):
                raise RuntimeError("O preflight deixou dados temporários no banco.")
            print("crud=ok")
            print("semantic_search=ok")
            print("relations=ok")
            print("cleanup=ok")
    finally:
        await database.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Valida PostgreSQL/pgvector da HOPE.")
    parser.add_argument(
        "--exercise-crud",
        action="store_true",
        help="Cria e remove dados temporários para validar MemoryManager.",
    )
    arguments = parser.parse_args()
    asyncio.run(main(arguments.exercise_crud))
