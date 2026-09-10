from __future__ import annotations

from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import AsyncIterator
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy import inspect, text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from .base import Base

REQUIRED_MEMORY_SCHEMA_REVISION = "20260903_0003"


@dataclass(frozen=True)
class SchemaCompatibility:
    compatible: bool
    required_revision: str
    current_revisions: tuple[str, ...]
    detail: str


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
        self._schema_created_for_tests = False

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
        self._schema_created_for_tests = True

    async def check_schema_compatibility(
        self,
        required_revision: str = REQUIRED_MEMORY_SCHEMA_REVISION,
    ) -> SchemaCompatibility:
        """Valida o contrato do runtime sem executar migrations ou alterar o banco."""
        if self._schema_created_for_tests:
            return SchemaCompatibility(
                compatible=True,
                required_revision=required_revision,
                current_revisions=(required_revision,),
                detail="Schema descartável criado pelo metadata atual para testes.",
            )

        try:
            async with self.engine.connect() as connection:
                has_version_table = await connection.run_sync(
                    lambda sync_connection: inspect(sync_connection).has_table(
                        "alembic_version"
                    )
                )
                if not has_version_table:
                    return SchemaCompatibility(
                        compatible=False,
                        required_revision=required_revision,
                        current_revisions=(),
                        detail=(
                            "Memória desativada: a tabela alembic_version não existe; "
                            f"o runtime exige a migration {required_revision}."
                        ),
                    )
                result = await connection.execute(
                    text("SELECT version_num FROM alembic_version")
                )
                revisions = tuple(sorted(str(value) for value in result.scalars().all()))
        except Exception:
            return SchemaCompatibility(
                compatible=False,
                required_revision=required_revision,
                current_revisions=(),
                detail=(
                    "Memória desativada: não foi possível validar o schema do banco; "
                    f"o runtime exige a migration {required_revision}."
                ),
            )

        if revisions == (required_revision,):
            return SchemaCompatibility(
                compatible=True,
                required_revision=required_revision,
                current_revisions=revisions,
                detail=f"Schema compatível com {required_revision}.",
            )
        observed = ", ".join(revisions) if revisions else "sem revisão registrada"
        return SchemaCompatibility(
            compatible=False,
            required_revision=required_revision,
            current_revisions=revisions,
            detail=(
                f"Memória desativada: schema em {observed}; "
                f"o runtime exige exatamente {required_revision}."
            ),
        )

    async def dispose(self) -> None:
        await self.engine.dispose()

    @property
    def safe_url(self) -> str:
        """Representação apropriada para diagnóstico, sempre sem senha."""
        return self.url.render_as_string(hide_password=True)
