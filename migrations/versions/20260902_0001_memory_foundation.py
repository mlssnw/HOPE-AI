"""Cria a fundação cloud-first de memória.

Revision ID: 20260902_0001
Revises:
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision = "20260902_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("display_name", sa.String(120)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "memories",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("memory_type", sa.String(32), nullable=False),
        sa.Column("source", sa.String(80), nullable=False),
        sa.Column("importance", sa.Float(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("embedding", Vector(1536)),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("access_count", sa.Integer(), nullable=False),
        sa.Column("last_accessed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_memories_user_id", "memories", ["user_id"])
    op.create_index("ix_memories_user_type", "memories", ["user_id", "memory_type"])
    op.create_index("ix_memories_user_created", "memories", ["user_id", "created_at"])
    op.create_index(
        "ix_memories_embedding_hnsw",
        "memories",
        ["embedding"],
        postgresql_using="hnsw",
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )
    op.create_table(
        "memory_relations",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_memory_id", sa.Uuid(), sa.ForeignKey("memories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_memory_id", sa.Uuid(), sa.ForeignKey("memories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("relation_type", sa.String(32), nullable=False),
        sa.Column("weight", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_memory_relations_source", "memory_relations", ["user_id", "source_memory_id"])
    op.create_index("ix_memory_relations_target", "memory_relations", ["user_id", "target_memory_id"])
    op.create_table(
        "entities",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("entity_type", sa.String(64), nullable=False),
        sa.Column("attributes", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_entities_user_id", "entities", ["user_id"])
    op.create_index("ix_entities_user_name", "entities", ["user_id", "name"])
    op.create_table(
        "entity_relations",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_entity_id", sa.Uuid(), sa.ForeignKey("entities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_entity_id", sa.Uuid(), sa.ForeignKey("entities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("relation_type", sa.String(64), nullable=False),
        sa.Column("weight", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_entity_relations_user_id", "entity_relations", ["user_id"])
    op.create_table(
        "conversations",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(240)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_conversations_user_id", "conversations", ["user_id"])
    op.create_table(
        "messages",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("conversation_id", sa.Uuid(), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(24), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_messages_conversation_created", "messages", ["conversation_id", "created_at"])
    op.create_table(
        "memory_events",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("memory_id", sa.Uuid(), sa.ForeignKey("memories.id", ondelete="SET NULL")),
        sa.Column("event_type", sa.String(40), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_memory_events_user_created", "memory_events", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_table("memory_events")
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("entity_relations")
    op.drop_table("entities")
    op.drop_table("memory_relations")
    op.drop_index("ix_memories_embedding_hnsw", table_name="memories")
    op.drop_table("memories")
    op.drop_table("users")
