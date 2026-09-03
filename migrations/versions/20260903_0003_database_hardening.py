"""Endurece integridade, isolamento e paridade do schema de memória.

Revision ID: 20260903_0003
Revises: 20260902_0002
"""
from __future__ import annotations

from alembic import op

revision = "20260903_0003"
down_revision = "20260902_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_memories_user_id_id", "memories", ["user_id", "id"]
    )
    op.create_unique_constraint(
        "uq_entities_user_id_id", "entities", ["user_id", "id"]
    )
    op.create_unique_constraint(
        "uq_entities_user_normalized_type",
        "entities",
        ["user_id", "normalized_name", "entity_type"],
    )

    op.create_check_constraint(
        "ck_memories_content_not_blank", "memories", "length(trim(content)) > 0"
    )
    op.create_check_constraint(
        "ck_memories_importance_range",
        "memories",
        "importance >= 0 AND importance <= 1",
    )
    op.create_check_constraint(
        "ck_memories_confidence_range",
        "memories",
        "confidence >= 0 AND confidence <= 1",
    )
    op.create_check_constraint(
        "ck_memories_emotional_weight_range",
        "memories",
        "emotional_weight >= -1 AND emotional_weight <= 1",
    )
    op.create_check_constraint(
        "ck_memories_access_count_nonnegative", "memories", "access_count >= 0"
    )
    op.create_check_constraint(
        "ck_memories_mention_count_nonnegative", "memories", "mention_count >= 0"
    )
    op.create_check_constraint(
        "ck_memory_relations_weight_range",
        "memory_relations",
        "weight >= 0 AND weight <= 1",
    )
    op.create_check_constraint(
        "ck_memory_relations_no_self_relation",
        "memory_relations",
        "source_memory_id <> target_memory_id",
    )
    op.create_check_constraint(
        "ck_entity_relations_weight_range",
        "entity_relations",
        "weight >= 0 AND weight <= 1",
    )
    op.create_check_constraint(
        "ck_entity_relations_no_self_relation",
        "entity_relations",
        "source_entity_id <> target_entity_id",
    )
    op.create_check_constraint(
        "ck_memory_entities_confidence_range",
        "memory_entities",
        "confidence >= 0 AND confidence <= 1",
    )

    op.create_foreign_key(
        "fk_memory_relations_user_source",
        "memory_relations",
        "memories",
        ["user_id", "source_memory_id"],
        ["user_id", "id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_memory_relations_user_target",
        "memory_relations",
        "memories",
        ["user_id", "target_memory_id"],
        ["user_id", "id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_entity_relations_user_source",
        "entity_relations",
        "entities",
        ["user_id", "source_entity_id"],
        ["user_id", "id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_entity_relations_user_target",
        "entity_relations",
        "entities",
        ["user_id", "target_entity_id"],
        ["user_id", "id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_memory_events_user_memory",
        "memory_events",
        "memories",
        ["user_id", "memory_id"],
        ["user_id", "id"],
    )
    op.create_foreign_key(
        "fk_memory_sources_user_memory",
        "memory_sources",
        "memories",
        ["user_id", "memory_id"],
        ["user_id", "id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_memory_entities_user_memory",
        "memory_entities",
        "memories",
        ["user_id", "memory_id"],
        ["user_id", "id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_memory_entities_user_entity",
        "memory_entities",
        "entities",
        ["user_id", "entity_id"],
        ["user_id", "id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_memory_entities_user_entity", "memory_entities", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_memory_entities_user_memory", "memory_entities", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_memory_sources_user_memory", "memory_sources", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_memory_events_user_memory", "memory_events", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_entity_relations_user_target", "entity_relations", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_entity_relations_user_source", "entity_relations", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_memory_relations_user_target", "memory_relations", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_memory_relations_user_source", "memory_relations", type_="foreignkey"
    )

    op.drop_constraint(
        "ck_memory_entities_confidence_range", "memory_entities", type_="check"
    )
    op.drop_constraint(
        "ck_entity_relations_no_self_relation", "entity_relations", type_="check"
    )
    op.drop_constraint(
        "ck_entity_relations_weight_range", "entity_relations", type_="check"
    )
    op.drop_constraint(
        "ck_memory_relations_no_self_relation", "memory_relations", type_="check"
    )
    op.drop_constraint(
        "ck_memory_relations_weight_range", "memory_relations", type_="check"
    )
    op.drop_constraint(
        "ck_memories_mention_count_nonnegative", "memories", type_="check"
    )
    op.drop_constraint(
        "ck_memories_access_count_nonnegative", "memories", type_="check"
    )
    op.drop_constraint(
        "ck_memories_emotional_weight_range", "memories", type_="check"
    )
    op.drop_constraint("ck_memories_confidence_range", "memories", type_="check")
    op.drop_constraint("ck_memories_importance_range", "memories", type_="check")
    op.drop_constraint("ck_memories_content_not_blank", "memories", type_="check")

    op.drop_constraint(
        "uq_entities_user_normalized_type", "entities", type_="unique"
    )
    op.drop_constraint("uq_entities_user_id_id", "entities", type_="unique")
    op.drop_constraint("uq_memories_user_id_id", "memories", type_="unique")
