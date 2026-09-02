from backend.database.session import normalize_database_url


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
