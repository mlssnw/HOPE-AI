from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator

MemoryType = Literal[
    "preference",
    "fact",
    "goal",
    "task",
    "relationship",
    "episode",
    "decision",
    "project",
    "person",
    "system",
    "knowledge",
    "temporal",
    "context",
]
MemoryKind = Literal["fact", "event", "inference"]
RelationType = Literal[
    "related_to",
    "semantic_related",
    "part_of",
    "created_by",
    "uses",
    "prefers",
    "works_on",
    "knows",
    "mentioned_in",
    "has_feature",
    "depends_on",
    "supports",
    "contradicts",
    "derived_from",
    "sync_with",
    "located_at",
    "owns",
]


class MemoryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(min_length=1, max_length=12000)
    memory_type: MemoryType | Literal["auto"] = "auto"
    kind: MemoryKind | Literal["auto"] = "auto"
    title: str | None = Field(default=None, max_length=240)
    summary: str | None = Field(default=None, max_length=1000)
    category: str | None = Field(default=None, max_length=80)
    tags: list[str] = Field(default_factory=list, max_length=24)
    source: str = Field(default="manual", min_length=1, max_length=80)
    source_reference: str | None = Field(default=None, max_length=500)
    source_excerpt: str | None = Field(default=None, max_length=2000)
    importance: float | None = Field(default=None, ge=0, le=1)
    confidence: float | None = Field(default=None, ge=0, le=1)
    emotional_weight: float = Field(default=0.0, ge=-1, le=1)
    extra_metadata: dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("metadata", "extra_metadata"),
        serialization_alias="metadata",
    )
    force: bool = True

    @field_validator("content", "source")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        value = value.replace("\x00", "").strip()
        if not value:
            raise ValueError("O texto não pode ficar vazio.")
        return value

    @field_validator("tags")
    @classmethod
    def normalize_tags(cls, values: list[str]) -> list[str]:
        return list(dict.fromkeys(tag.strip().casefold() for tag in values if tag.strip()))[:24]


class MemoryCandidateCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(min_length=1, max_length=12000)
    source: str = Field(default="conversation", min_length=1, max_length=80)
    source_reference: str | None = Field(default=None, max_length=500)

    @field_validator("content", "source")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        value = value.replace("\x00", "").strip()
        if not value:
            raise ValueError("O texto não pode ficar vazio.")
        return value


class MemoryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str | None = Field(default=None, min_length=1, max_length=12000)
    memory_type: MemoryType | None = None
    kind: MemoryKind | None = None
    title: str | None = Field(default=None, max_length=240)
    summary: str | None = Field(default=None, max_length=1000)
    category: str | None = Field(default=None, max_length=80)
    tags: list[str] | None = Field(default=None, max_length=24)
    importance: float | None = Field(default=None, ge=0, le=1)
    confidence: float | None = Field(default=None, ge=0, le=1)
    emotional_weight: float | None = Field(default=None, ge=-1, le=1)
    extra_metadata: dict[str, Any] | None = Field(
        default=None,
        validation_alias=AliasChoices("metadata", "extra_metadata"),
        serialization_alias="metadata",
    )

    @field_validator("content")
    @classmethod
    def normalize_content(cls, value: str | None) -> str | None:
        if value is None:
            raise ValueError("O conteúdo não pode ser nulo quando informado.")
        value = value.replace("\x00", "").strip()
        if not value:
            raise ValueError("O conteúdo não pode ficar vazio.")
        return value

    @field_validator(
        "memory_type",
        "kind",
        "tags",
        "importance",
        "confidence",
        "emotional_weight",
        "extra_metadata",
    )
    @classmethod
    def reject_null_non_nullable_fields(cls, value):  # type: ignore[no-untyped-def]
        if value is None:
            raise ValueError("O campo não pode ser nulo quando informado.")
        return value

    @field_validator("tags")
    @classmethod
    def normalize_updated_tags(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return None
        return list(dict.fromkeys(tag.strip().casefold() for tag in values if tag.strip()))[:24]


class MemoryView(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    user_id: uuid.UUID
    content: str
    memory_type: str
    kind: str
    title: str | None
    summary: str | None
    category: str | None
    tags: list[str]
    source: str
    importance: float
    confidence: float
    emotional_weight: float
    extra_metadata: dict[str, Any] = Field(
        validation_alias=AliasChoices("extra_metadata", "metadata"),
        serialization_alias="metadata",
    )
    access_count: int
    mention_count: int
    last_accessed_at: datetime | None
    last_reinforced_at: datetime | None
    created_at: datetime
    updated_at: datetime


class MemoryWriteResult(BaseModel):
    saved: bool
    consolidated: bool = False
    reason: str | None = None
    memory: MemoryView | None = None


class MemoryRelationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    target_memory_id: uuid.UUID
    relation_type: RelationType = "related_to"
    weight: float = Field(default=1.0, ge=0, le=1)


class MemoryRelationView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    source_memory_id: uuid.UUID
    target_memory_id: uuid.UUID
    relation_type: str
    weight: float
    created_at: datetime


class EntityView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    entity_type: str
    attributes: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class MemoryEntityLinkView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    memory_id: uuid.UUID
    entity_id: uuid.UUID
    role: str
    confidence: float


class MemorySourceView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    source_type: str
    source_reference: str | None
    excerpt: str | None
    created_at: datetime


class MemoryEventView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_type: str
    payload: dict[str, Any]
    created_at: datetime


class MemorySearchHit(BaseModel):
    memory: MemoryView
    score: float = Field(ge=0, le=1)
    match_kind: Literal["semantic", "text", "hybrid"]


class MemoryExplanation(BaseModel):
    memory: MemoryView
    sources: list[MemorySourceView]
    entities: list[EntityView]
    relations: list[MemoryRelationView]
    events: list[MemoryEventView]


class MemoryGraph(BaseModel):
    nodes: list[MemoryView]
    edges: list[MemoryRelationView]
    entities: list[EntityView] = Field(default_factory=list)
    entity_links: list[MemoryEntityLinkView] = Field(default_factory=list)
