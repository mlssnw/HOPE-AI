from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy import text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from .base import Base


def normalize_database_url(url: str) -> str:
    normalized = url
    if url.startswith("postgres://"):
        normalized = "postgresql+asyncpg://" + url.removeprefix("postgres://")
    elif url.startswith("postgresql://"):
        normalized = "postgresql+asyncpg://" + url.removeprefix("postgresql://")
    if not normalized.startswith("postgresql+asyncpg://"):
        return normalized

    parts = urlsplit(normalized)
    query = parse_qsl(parts.query, keep_blank_values=True)
    has_asyncpg_ssl = any(key == "ssl" for key, _ in query)
    translated_query = [
        ("ssl", value) if key == "sslmode" and not has_asyncpg_ssl else (key, value)
        for key, value in query
        if key != "sslmode" or not has_asyncpg_ssl
    ]
    return urlunsplit(
        (parts.scheme, parts.netloc, parts.path, urlencode(translated_query), parts.fragment)
    )


class Database:
    def __init__(
        self,
        url: str,
        *,
        echo: bool = False,
        pool_size: int = 3,
        max_overflow: int = 1,
        pool_timeout: int = 30,
        pool_recycle: int = 900,
    ) -> None:
        if not url.strip():
            raise ValueError("DATABASE_URL não pode ser vazia.")
        self.url: URL = make_url(normalize_database_url(url.strip()))
        engine_options: dict[str, object] = {
            "echo": echo,
            "hide_parameters": True,
            "pool_pre_ping": True,
        }
        if self.url.drivername == "postgresql+asyncpg":
            engine_options.update(
                pool_size=pool_size,
                max_overflow=max_overflow,
                pool_timeout=pool_timeout,
                pool_recycle=pool_recycle,
            )
        self.engine: AsyncEngine = create_async_engine(
            self.url, **engine_options
        )
        self.session_factory = async_sessionmaker(
            self.engine, expire_on_commit=False, class_=AsyncSession
        )

    @asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        async with self.session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    async def ping(self) -> bool:
        try:
            async with self.engine.connect() as connection:
                await connection.execute(text("SELECT 1"))
            return True
        except Exception:
            return False

    async def create_schema_for_tests(self) -> None:
        """Somente para testes; produção deve usar Alembic."""
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

    async def dispose(self) -> None:
        await self.engine.dispose()

    @property
    def safe_url(self) -> str:
        """Representação apropriada para diagnóstico, sempre sem senha."""
        return self.url.render_as_string(hide_password=True)
