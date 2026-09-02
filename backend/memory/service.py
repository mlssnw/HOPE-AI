from __future__ import annotations

import uuid

from .manager import MemoryManager
from .schemas import MemoryCreate, MemoryWriteResult


class MemoryService:
    """Entrada de alto nível para captura automática por chat e integrações."""

    def __init__(self, manager: MemoryManager) -> None:
        self.manager = manager

    async def capture_candidate(
        self,
        user_id: uuid.UUID,
        content: str,
        *,
        source: str = "conversation",
        source_reference: str | None = None,
    ) -> MemoryWriteResult:
        return await self.manager.create(
            user_id,
            MemoryCreate(
                content=content,
                source=source,
                source_reference=source_reference,
                force=False,
            ),
        )
