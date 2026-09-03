from sqlalchemy import CheckConstraint, ForeignKeyConstraint, UniqueConstraint

from backend.config import Settings
from backend.database.models import (
    EntityRecord,
    MemoryEntityRecord,
    MemoryRecord,
    MemoryRelationRecord,
)
from backend.database.session import Database, normalize_database_url
from backend.memory.embeddings import (
    LocalHashEmbeddingProvider,
    create_embedding_provider,
)


def test_normalize_database_url_for_asyncpg_ssl() -> None:
    result = normalize_database_url(
        "postgres://user:secret@example.test:5432/hope?sslmode=require&application_name=hope"
    )

    assert result == (
        "postgresql+asyncpg://user:secret@example.test:5432/hope"
        "?ssl=require&application_name=hope"
    )


def test_normalize_database_url_preserves_explicit_asyncpg_ssl() -> None:
    result = normalize_database_url(
        "postgresql://user:secret@example.test/hope?sslmode=require&ssl=verify-full"
    )

    assert result == "postgresql+asyncpg://user:secret@example.test/hope?ssl=verify-full"


def test_normalize_database_url_leaves_non_postgres_urls_usable() -> None:
    assert normalize_database_url("sqlite+aiosqlite:///:memory:") == (
        "sqlite+aiosqlite:///:memory:"
    )


def test_database_masks_password_and_applies_conservative_pool_budget() -> None:
    database = Database(
        "postgresql://hope_runtime:very-secret@example.test/hope",
        pool_size=2,
        max_overflow=1,
        pool_timeout=12,
        pool_recycle=600,
    )

    assert "very-secret" not in database.safe_url
    assert "***" in database.safe_url
    assert database.engine.pool.size() == 2  # type: ignore[union-attr]
    assert database.engine.pool._max_overflow == 1  # type: ignore[union-attr]
    assert database.engine.pool._timeout == 12  # type: ignore[union-attr]
    assert database.engine.pool._recycle == 600  # type: ignore[union-attr]


def test_settings_separate_runtime_and_migration_credentials(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    monkeypatch.setenv("DATABASE_URL", "postgresql://runtime:secret@db/hope")
    monkeypatch.setenv("DATABASE_ADMIN_URL", "postgresql://migration:secret@db/hope")
    monkeypatch.setenv("DB_POOL_SIZE", "4")
    monkeypatch.setenv("DB_MAX_OVERFLOW", "2")
    monkeypatch.setenv("DB_POOL_TIMEOUT", "15")
    monkeypatch.setenv("DB_POOL_RECYCLE", "1200")

    settings = Settings.from_env()

    assert settings.database_url.startswith("postgresql://runtime:")
    assert settings.migration_database_url.startswith("postgresql://migration:")
    assert (
        settings.db_pool_size,
        settings.db_max_overflow,
        settings.db_pool_timeout,
        settings.db_pool_recycle,
    ) == (4, 2, 15, 1200)


def test_migration_url_falls_back_to_runtime_url() -> None:
    settings = Settings.for_tests(database_url="postgresql://runtime@db/hope")

    assert settings.migration_database_url == settings.database_url


def test_local_hash_is_explicitly_blocked_for_deployed_environments() -> None:
    provider = create_embedding_provider("local-hash", 1536, "test")
    assert isinstance(provider, LocalHashEmbeddingProvider)

    for environment in ("production", "prod", "staging"):
        try:
            create_embedding_provider("local-hash", 1536, environment)
        except RuntimeError as exc:
            assert "exclusivo de desenvolvimento e testes" in str(exc)
        else:
            raise AssertionError(f"local-hash foi aceito em {environment}")


def test_metadata_preserves_hnsw_and_database_integrity_contracts() -> None:
    hnsw = next(
        index for index in MemoryRecord.__table__.indexes
        if index.name == "ix_memories_embedding_hnsw"
    )
    assert hnsw.dialect_options["postgresql"]["using"] == "hnsw"
    assert hnsw.dialect_options["postgresql"]["ops"] == {
        "embedding": "vector_cosine_ops"
    }

    memory_checks = {
        item.name
        for item in MemoryRecord.__table__.constraints
        if isinstance(item, CheckConstraint)
    }
    assert {
        "ck_memories_content_not_blank",
        "ck_memories_importance_range",
        "ck_memories_confidence_range",
        "ck_memories_emotional_weight_range",
        "ck_memories_access_count_nonnegative",
        "ck_memories_mention_count_nonnegative",
    } <= memory_checks

    entity_uniques = {
        item.name
        for item in EntityRecord.__table__.constraints
        if isinstance(item, UniqueConstraint)
    }
    assert "uq_entities_user_normalized_type" in entity_uniques

    relation_checks = {
        item.name
        for item in MemoryRelationRecord.__table__.constraints
        if isinstance(item, CheckConstraint)
    }
    assert "ck_memory_relations_no_self_relation" in relation_checks
    assert "ck_memory_relations_weight_range" in relation_checks

    link_foreign_keys = {
        item.name
        for item in MemoryEntityRecord.__table__.constraints
        if isinstance(item, ForeignKeyConstraint) and len(item.elements) == 2
    }
    assert link_foreign_keys == {
        "fk_memory_entities_user_memory",
        "fk_memory_entities_user_entity",
    }
