from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class MemoryClassification:
    memory_type: str
    kind: str
    importance: float
    confidence: float
    category: str
    tags: list[str]
    title: str
    summary: str


class MemoryClassifier:
    """Classificação determinística e substituível por um classificador de IA."""

    TYPE_PATTERNS = (
        ("decision", r"\b(decidi|decidimos|decisão|fica definido|vamos usar)\b"),
        ("preference", r"\b(prefiro|gosto|não gosto|favorit[oa]|minha preferência)\b"),
        ("goal", r"\b(meta|objetivo|quero alcançar|pretendo|planejo)\b"),
        ("task", r"\b(preciso|devo|tarefa|prazo|lembre[- ]?me|até \w+-feira)\b"),
        ("relationship", r"\b(mãe|pai|irmã|irmão|amig[oa]|colega|cliente|equipe)\b"),
        ("episode", r"\b(ontem|hoje|aconteceu|viajei|reunião|encontrei|conversei)\b"),
    )
    INFERENCE_PATTERN = re.compile(
        r"\b(acho que|talvez|parece que|provavelmente|possivelmente|deduzo|suponho)\b"
    )
    EVENT_PATTERN = re.compile(
        r"\b(ontem|hoje|amanhã|aconteceu|viajei|reunião|encontrei|conversei|em \d{1,2}/\d{1,2})\b"
    )
    IMPORTANT_PATTERN = re.compile(
        r"\b(importante|sempre|nunca|urgente|prioridade|lembre[- ]?me|decidi|decisão)\b"
    )

    def classify(self, content: str) -> MemoryClassification:
        text = content.casefold()
        memory_type = "knowledge"
        for candidate, pattern in self.TYPE_PATTERNS:
            if re.search(pattern, text):
                memory_type = candidate
                break

        if self.INFERENCE_PATTERN.search(text):
            kind, confidence = "inference", 0.65
        elif memory_type == "episode" or self.EVENT_PATTERN.search(text):
            kind, confidence = "event", 0.9
        else:
            kind, confidence = "fact", 1.0

        importance = {
            "preference": 0.65,
            "goal": 0.78,
            "task": 0.74,
            "relationship": 0.7,
            "episode": 0.55,
            "decision": 0.82,
            "knowledge": 0.42,
        }[memory_type]
        if self.IMPORTANT_PATTERN.search(text):
            importance += 0.14
        if re.search(r"\b\d{1,2}([:/-]\d{1,2})?\b", text):
            importance += 0.05
        if len(content) >= 80:
            importance += 0.04

        category = {
            "preference": "identity",
            "relationship": "identity",
            "goal": "context",
            "task": "temporal",
            "episode": "temporal",
            "decision": "context",
            "knowledge": "knowledge",
        }[memory_type]
        tags = self._tags(content, memory_type, kind)
        summary = self._truncate(content, 280)
        title = self._truncate(content.rstrip(".?!"), 80)
        return MemoryClassification(
            memory_type=memory_type,
            kind=kind,
            importance=min(1.0, importance),
            confidence=confidence,
            category=category,
            tags=tags,
            title=title,
            summary=summary,
        )

    @staticmethod
    def _tags(content: str, memory_type: str, kind: str) -> list[str]:
        hashtags = re.findall(r"#([\wÀ-ÿ-]+)", content.casefold())
        return list(dict.fromkeys([memory_type, kind, *hashtags]))[:12]

    @staticmethod
    def _truncate(value: str, limit: int) -> str:
        normalized = " ".join(value.split())
        return normalized if len(normalized) <= limit else normalized[: limit - 1].rstrip() + "…"
