"""Adiciona inteligência, proveniência e entidades à memória.

Revision ID: 20260902_0002
Revises: 20260902_0001
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260902_0002"
down_revision = "20260902_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "memories", sa.Column("kind", sa.String(16), nullable=False, server_default="fact")
    )
    op.add_column("memories", sa.Column("title", sa.String(240)))
    op.add_column("memories", sa.Column("summary", sa.Text()))
    op.add_column("memories", sa.Column("category", sa.String(80)))
    op.add_column(
        "memories",
        sa.Column("tags", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
    )
    op.add_column(
        "memories",
        sa.Column("emotional_weight", sa.Float(), nullable=False, server_default="0"),
    )
    op.add_column(
        "memories",
        sa.Column("mention_count", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column("memories", sa.Column("last_reinforced_at", sa.DateTime(timezone=True)))
    op.create_index("ix_memories_user_kind", "memories", ["user_id", "kind"])
    op.execute(
        """
        DELETE FROM memory_relations duplicate
        USING memory_relations original
        WHERE duplicate.id > original.id
          AND duplicate.user_id = original.user_id
          AND duplicate.source_memory_id = original.source_memory_id
          AND duplicate.target_memory_id = original.target_memory_id
          AND duplicate.relation_type = original.relation_type
        """
    )
    op.create_unique_constraint(
        "uq_memory_relation",
        "memory_relations",
        ["user_id", "source_memory_id", "target_memory_id", "relation_type"],
    )

    op.add_column(
        "entities",
        sa.Column("normalized_name", sa.String(200), nullable=False, server_default=""),
    )
    op.execute("UPDATE entities SET normalized_name = lower(name)")
    op.alter_column("entities", "normalized_name", server_default=None)
    op.create_index(
        "ix_entities_user_normalized",
        "entities",
        ["user_id", "normalized_name", "entity_type"],
    )

    op.create_table(
        "memory_sources",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "memory_id",
            sa.Uuid(),
            sa.ForeignKey("memories.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("source_type", sa.String(80), nullable=False),
        sa.Column("source_reference", sa.String(500)),
        sa.Column("excerpt", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_memory_sources_memory", "memory_sources", ["user_id", "memory_id"]
    )

    op.create_table(
        "memory_entities",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "memory_id",
            sa.Uuid(),
            sa.ForeignKey("memories.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "entity_id",
            sa.Uuid(),
            sa.ForeignKey("entities.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.String(64), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("memory_id", "entity_id", "role", name="uq_memory_entity_role"),
    )
    op.create_index(
        "ix_memory_entities_memory", "memory_entities", ["user_id", "memory_id"]
    )
    op.create_index(
        "ix_memory_entities_entity", "memory_entities", ["user_id", "entity_id"]
    )


def downgrade() -> None:
    op.drop_table("memory_entities")
    op.drop_table("memory_sources")
    op.drop_index("ix_entities_user_normalized", table_name="entities")
    op.drop_column("entities", "normalized_name")
    op.drop_constraint("uq_memory_relation", "memory_relations", type_="unique")
    op.drop_index("ix_memories_user_kind", table_name="memories")
    op.drop_column("memories", "last_reinforced_at")
    op.drop_column("memories", "mention_count")
    op.drop_column("memories", "emotional_weight")
    op.drop_column("memories", "tags")
    op.drop_column("memories", "category")
    op.drop_column("memories", "summary")
    op.drop_column("memories", "title")
    op.drop_column("memories", "kind")
