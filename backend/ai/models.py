from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from ..models import Source


class RetrievedMemoryContext(BaseModel):
    id: str
    kind: str
    memory_type: str
    title: str | None = None
    content: str
    importance: float
    confidence: float
    source: str
    created_at: datetime
    updated_at: datetime
    relevance: float = Field(ge=0, le=1)


class RetrievedEntityContext(BaseModel):
    id: str
    name: str
    entity_type: str


class RetrievedRelationContext(BaseModel):
    id: str
    source_memory_id: str
    target_memory_id: str
    relation_type: str
    weight: float


class RecentContextItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class MemoryContext(BaseModel):
    relevant_memories: list[RetrievedMemoryContext] = Field(default_factory=list)
    relevant_entities: list[RetrievedEntityContext] = Field(default_factory=list)
    relevant_relations: list[RetrievedRelationContext] = Field(default_factory=list)
    recent_context: list[RecentContextItem] = Field(default_factory=list)
    user_preferences: list[RetrievedMemoryContext] = Field(default_factory=list)
    decisions: list[RetrievedMemoryContext] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0, le=1)
    available: bool = True
    degraded_reason: str | None = None


class UiEvent(BaseModel):
    type: Literal["FOCUS_MEMORIES"]
    ids: list[str] = Field(default_factory=list, max_length=50)


class OrchestratorResult(BaseModel):
    message: str
    sources: list[Source] = Field(default_factory=list)
    memories_used: list[str] = Field(default_factory=list)
    entities_used: list[str] = Field(default_factory=list)
    relations_used: list[str] = Field(default_factory=list)
    tools_used: list[str] = Field(default_factory=list)
    ui_events: list[UiEvent] = Field(default_factory=list)
    memory_available: bool = True
    metadata: dict[str, Any] = Field(default_factory=dict)
