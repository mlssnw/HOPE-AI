from __future__ import annotations

from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON
from sqlalchemy.engine import Dialect
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.types import TypeDecorator, TypeEngine


class Base(DeclarativeBase):
    pass


class VectorType(TypeDecorator[list[float]]):
    """pgvector em produção e JSON nos testes SQLite."""

    impl = JSON
    cache_ok = True

    def __init__(self, dimensions: int = 1536) -> None:
        super().__init__()
        self.dimensions = dimensions

    def load_dialect_impl(self, dialect: Dialect) -> TypeEngine[Any]:
        if dialect.name == "postgresql":
            return dialect.type_descriptor(Vector(self.dimensions))
        return dialect.type_descriptor(JSON())
