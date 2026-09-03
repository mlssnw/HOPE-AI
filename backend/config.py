from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_env_file(path: Path | None = None) -> None:
    """Carrega um .env simples sem substituir o ambiente do processo."""
    env_path = path or PROJECT_ROOT / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key.replace("_", "").isalnum():
            os.environ.setdefault(key, value)


def _as_bool(value: str | None, default: bool) -> bool:
    return default if value is None else value.lower() in {"1", "true", "yes", "on", "sim"}


def _as_int(name: str, default: int, minimum: int, maximum: int) -> int:
    try:
        value = int(os.getenv(name, str(default)))
    except ValueError:
        return default
    return max(minimum, min(maximum, value))


def _as_float(name: str, default: float, minimum: float, maximum: float) -> float:
    try:
        value = float(os.getenv(name, str(default)))
    except ValueError:
        return default
    return max(minimum, min(maximum, value))


def _embedding_dimensions() -> int:
    dimensions = _as_int("EMBEDDING_DIMENSIONS", 1536, 64, 4096)
    if dimensions != 1536:
        raise ValueError(
            "EMBEDDING_DIMENSIONS deve ser 1536 nesta migração; outras dimensões exigem nova migração."
        )
    return dimensions


@dataclass(frozen=True)
class Settings:
    database_url: str
    database_echo: bool
    embedding_dimensions: int
    memory_min_importance: float
    memory_duplicate_similarity: float
    anthropic_api_key: str
    anthropic_workspace_id: str
    anthropic_model: str
    tavily_api_key: str
    elevenlabs_api_key: str
    elevenlabs_voice_id: str
    obsidian_api_key: str
    obsidian_base_url: str
    obsidian_verify_tls: bool
    request_timeout_seconds: int
    max_prompt_chars: int
    max_history_messages: int
    max_rag_results: int
    max_rag_chars: int

    @classmethod
    def from_env(cls) -> "Settings":
        load_env_file()
        return cls(
            database_url=os.getenv("DATABASE_URL", "").strip(),
            database_echo=_as_bool(os.getenv("DATABASE_ECHO"), False),
            embedding_dimensions=_embedding_dimensions(),
            memory_min_importance=_as_float("MEMORY_MIN_IMPORTANCE", 0.45, 0.0, 1.0),
            memory_duplicate_similarity=_as_float(
                "MEMORY_DUPLICATE_SIMILARITY", 0.92, 0.5, 1.0
            ),
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", "").strip(),
            anthropic_workspace_id=os.getenv("ANTHROPIC_WORKSPACE_ID", "").strip(),
            anthropic_model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6").strip(),
            tavily_api_key=os.getenv("TAVILY_API_KEY", "").strip(),
            elevenlabs_api_key=os.getenv("ELEVENLABS_API_KEY", "").strip(),
            elevenlabs_voice_id=os.getenv("ELEVENLABS_VOICE_ID", "OYTbF65OHHFELVut7v2H").strip(),
            obsidian_api_key=os.getenv("OBSIDIAN_API_KEY", "").strip(),
            obsidian_base_url=os.getenv("OBSIDIAN_BASE_URL", "http://127.0.0.1:27123").strip().rstrip("/"),
            obsidian_verify_tls=_as_bool(os.getenv("OBSIDIAN_VERIFY_TLS"), True),
            request_timeout_seconds=_as_int("REQUEST_TIMEOUT_SECONDS", 25, 5, 120),
            max_prompt_chars=_as_int("MAX_PROMPT_CHARS", 8000, 500, 20000),
            max_history_messages=_as_int("MAX_HISTORY_MESSAGES", 20, 0, 50),
            max_rag_results=_as_int("MAX_RAG_RESULTS", 3, 0, 8),
            max_rag_chars=_as_int("MAX_RAG_CHARS", 6000, 500, 16000),
        )

    @classmethod
    def for_tests(cls, **overrides: object) -> "Settings":
        values: dict[str, object] = dict(
            database_url="", database_echo=False, embedding_dimensions=1536,
            memory_min_importance=0.45, memory_duplicate_similarity=0.92,
            anthropic_api_key="test-anthropic", anthropic_workspace_id="",
            anthropic_model="test-model",
            tavily_api_key="test-tavily", elevenlabs_api_key="test-elevenlabs",
            elevenlabs_voice_id="test-voice", obsidian_api_key="test-obsidian",
            obsidian_base_url="http://127.0.0.1:27123", obsidian_verify_tls=True,
            request_timeout_seconds=5, max_prompt_chars=8000,
            max_history_messages=20, max_rag_results=3, max_rag_chars=6000,
        )
        values.update(overrides)
        return cls(**values)  # type: ignore[arg-type]
