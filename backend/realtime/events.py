from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class EventType(StrEnum):
    MEMORY_CREATED = "MEMORY_CREATED"
    MEMORY_UPDATED = "MEMORY_UPDATED"
    MEMORY_DELETED = "MEMORY_DELETED"
    MEMORY_RELATION_CREATED = "MEMORY_RELATION_CREATED"
    MEMORY_RELATION_DELETED = "MEMORY_RELATION_DELETED"
    AI_STATE_CHANGED = "AI_STATE_CHANGED"


class HopeEvent(BaseModel):
    event_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    type: EventType
    user_id: uuid.UUID
    payload: dict[str, Any] = Field(default_factory=dict)
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def as_message(self) -> dict[str, Any]:
        return self.model_dump(mode="json")
