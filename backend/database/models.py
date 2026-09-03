from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    JSON,
    DateTime,
    Float,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, VectorType


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserRecord(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    display_name: Mapped[str | None] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )


class MemoryRecord(Base):
    __tablename__ = "memories"
    __table_args__ = (
        Index("ix_memories_user_type", "user_id", "memory_type"),
        Index("ix_memories_user_kind", "user_id", "kind"),
        Index("ix_memories_user_created", "user_id", "created_at"),
        Index(
            "ix_memories_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
        UniqueConstraint("user_id", "id", name="uq_memories_user_id_id"),
        CheckConstraint("length(trim(content)) > 0", name="ck_memories_content_not_blank"),
        CheckConstraint(
            "importance >= 0 AND importance <= 1", name="ck_memories_importance_range"
        ),
        CheckConstraint(
            "confidence >= 0 AND confidence <= 1", name="ck_memories_confidence_range"
        ),
        CheckConstraint(
            "emotional_weight >= -1 AND emotional_weight <= 1",
            name="ck_memories_emotional_weight_range",
        ),
        CheckConstraint("access_count >= 0", name="ck_memories_access_count_nonnegative"),
        CheckConstraint("mention_count >= 0", name="ck_memories_mention_count_nonnegative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    content: Mapped[str] = mapped_column(Text)
    memory_type: Mapped[str] = mapped_column(String(32), default="knowledge")
    kind: Mapped[str] = mapped_column(String(16), default="fact")
    title: Mapped[str | None] = mapped_column(String(240))
    summary: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(80))
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    source: Mapped[str] = mapped_column(String(80), default="manual")
    importance: Mapped[float] = mapped_column(Float, default=0.5)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    emotional_weight: Mapped[float] = mapped_column(Float, default=0.0)
    embedding: Mapped[list[float] | None] = mapped_column(VectorType(1536))
    extra_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSON, default=dict
    )
    access_count: Mapped[int] = mapped_column(Integer, default=0)
    mention_count: Mapped[int] = mapped_column(Integer, default=1)
    last_accessed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_reinforced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )


class MemoryRelationRecord(Base):
    __tablename__ = "memory_relations"
    __table_args__ = (
        Index("ix_memory_relations_source", "user_id", "source_memory_id"),
        Index("ix_memory_relations_target", "user_id", "target_memory_id"),
        UniqueConstraint(
            "user_id",
            "source_memory_id",
            "target_memory_id",
            "relation_type",
            name="uq_memory_relation",
        ),
        ForeignKeyConstraint(
            ["user_id", "source_memory_id"],
            ["memories.user_id", "memories.id"],
            name="fk_memory_relations_user_source",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["user_id", "target_memory_id"],
            ["memories.user_id", "memories.id"],
            name="fk_memory_relations_user_target",
            ondelete="CASCADE",
        ),
        CheckConstraint("weight >= 0 AND weight <= 1", name="ck_memory_relations_weight_range"),
        CheckConstraint(
            "source_memory_id <> target_memory_id",
            name="ck_memory_relations_no_self_relation",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    source_memory_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("memories.id", ondelete="CASCADE")
    )
    target_memory_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("memories.id", ondelete="CASCADE")
    )
    relation_type: Mapped[str] = mapped_column(String(32))
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class EntityRecord(Base):
    __tablename__ = "entities"
    __table_args__ = (
        Index("ix_entities_user_name", "user_id", "name"),
        Index("ix_entities_user_normalized", "user_id", "normalized_name", "entity_type"),
        UniqueConstraint("user_id", "id", name="uq_entities_user_id_id"),
        UniqueConstraint(
            "user_id",
            "normalized_name",
            "entity_type",
            name="uq_entities_user_normalized_type",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(200))
    normalized_name: Mapped[str] = mapped_column(String(200))
    entity_type: Mapped[str] = mapped_column(String(64), default="concept")
    attributes: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )


class EntityRelationRecord(Base):
    __tablename__ = "entity_relations"
    __table_args__ = (
        ForeignKeyConstraint(
            ["user_id", "source_entity_id"],
            ["entities.user_id", "entities.id"],
            name="fk_entity_relations_user_source",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["user_id", "target_entity_id"],
            ["entities.user_id", "entities.id"],
            name="fk_entity_relations_user_target",
            ondelete="CASCADE",
        ),
        CheckConstraint("weight >= 0 AND weight <= 1", name="ck_entity_relations_weight_range"),
        CheckConstraint(
            "source_entity_id <> target_entity_id",
            name="ck_entity_relations_no_self_relation",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    source_entity_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("entities.id", ondelete="CASCADE")
    )
    target_entity_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("entities.id", ondelete="CASCADE")
    )
    relation_type: Mapped[str] = mapped_column(String(64))
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ConversationRecord(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str | None] = mapped_column(String(240))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )


class MessageRecord(Base):
    __tablename__ = "messages"
    __table_args__ = (Index("ix_messages_conversation_created", "conversation_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE")
    )
    role: Mapped[str] = mapped_column(String(24))
    content: Mapped[str] = mapped_column(Text)
    extra_metadata: Mapped[dict[str, Any]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class MemoryEventRecord(Base):
    __tablename__ = "memory_events"
    __table_args__ = (
        Index("ix_memory_events_user_created", "user_id", "created_at"),
        ForeignKeyConstraint(
            ["user_id", "memory_id"],
            ["memories.user_id", "memories.id"],
            name="fk_memory_events_user_memory",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    memory_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("memories.id", ondelete="SET NULL")
    )
    event_type: Mapped[str] = mapped_column(String(40))
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class MemorySourceRecord(Base):
    __tablename__ = "memory_sources"
    __table_args__ = (
        Index("ix_memory_sources_memory", "user_id", "memory_id"),
        ForeignKeyConstraint(
            ["user_id", "memory_id"],
            ["memories.user_id", "memories.id"],
            name="fk_memory_sources_user_memory",
            ondelete="CASCADE",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    memory_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("memories.id", ondelete="CASCADE")
    )
    source_type: Mapped[str] = mapped_column(String(80))
    source_reference: Mapped[str | None] = mapped_column(String(500))
    excerpt: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class MemoryEntityRecord(Base):
    __tablename__ = "memory_entities"
    __table_args__ = (
        Index("ix_memory_entities_memory", "user_id", "memory_id"),
        Index("ix_memory_entities_entity", "user_id", "entity_id"),
        UniqueConstraint("memory_id", "entity_id", "role", name="uq_memory_entity_role"),
        ForeignKeyConstraint(
            ["user_id", "memory_id"],
            ["memories.user_id", "memories.id"],
            name="fk_memory_entities_user_memory",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["user_id", "entity_id"],
            ["entities.user_id", "entities.id"],
            name="fk_memory_entities_user_entity",
            ondelete="CASCADE",
        ),
        CheckConstraint(
            "confidence >= 0 AND confidence <= 1",
            name="ck_memory_entities_confidence_range",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )
    memory_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("memories.id", ondelete="CASCADE")
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("entities.id", ondelete="CASCADE")
    )
    role: Mapped[str] = mapped_column(String(64), default="mentioned_in")
    confidence: Mapped[float] = mapped_column(Float, default=0.8)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
