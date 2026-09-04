from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator


class HistoryMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=12000)

    @field_validator("content")
    @classmethod
    def normalize(cls, value: str) -> str:
        return value.replace("\x00", "").strip()


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message: str = Field(min_length=1, max_length=20000)
    history: list[HistoryMessage] = Field(default_factory=list, max_length=50)
    use_web: bool = False
    use_vault: bool = False
    memory_enabled: bool = False

    @field_validator("message")
    @classmethod
    def normalize(cls, value: str) -> str:
        value = value.replace("\x00", "").strip()
        if not value:
            raise ValueError("A mensagem não pode ficar vazia.")
        return value


class Source(BaseModel):
    kind: Literal["web", "obsidian"]
    title: str
    reference: str
    excerpt: str = ""


class MemoryDeleteConfirmation(BaseModel):
    memory_id: str
    label: str
    consequence: str = "A memória e suas relações serão removidas permanentemente."


class ChatResponse(BaseModel):
    reply: str
    sources: list[Source] = Field(default_factory=list)
    memories_used: list[str] = Field(default_factory=list)
    entities_used: list[str] = Field(default_factory=list)
    relations_used: list[str] = Field(default_factory=list)
    tools_used: list[str] = Field(default_factory=list)
    ui_events: list[dict[str, Any]] = Field(default_factory=list)
    memory_available: bool = True
    memory_enabled: bool = False
    memory_delete_confirmation: MemoryDeleteConfirmation | None = None


class TtsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    text: str = Field(min_length=1, max_length=5000)

    @field_validator("text")
    @classmethod
    def normalize(cls, value: str) -> str:
        value = value.replace("\x00", "").strip()
        if not value:
            raise ValueError("O texto não pode ficar vazio.")
        return value


class ServiceStatus(BaseModel):
    configured: bool
    available: bool | None = None


class HealthResponse(BaseModel):
    ok: bool = True
    claude: ServiceStatus
    tavily: ServiceStatus
    elevenlabs: ServiceStatus
    obsidian: ServiceStatus
    database: ServiceStatus = Field(default_factory=lambda: ServiceStatus(configured=False))
