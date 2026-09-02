from __future__ import annotations

import hashlib
import math
import re
from abc import ABC, abstractmethod


class EmbeddingProvider(ABC):
    """Contrato independente de fornecedor para vetorização de texto."""

    dimensions: int

    @abstractmethod
    async def embed(self, text: str) -> list[float]:
        raise NotImplementedError


class LocalHashEmbeddingProvider(EmbeddingProvider):
    """Embedding local, determinístico e sem rede para desenvolvimento.

    É deliberadamente simples. Em produção, troque a implementação pelo
    provedor de embeddings escolhido sem alterar o domínio de memória.
    """

    def __init__(self, dimensions: int = 1536) -> None:
        self.dimensions = dimensions

    async def embed(self, text: str) -> list[float]:
        vector = [0.0] * self.dimensions
        tokens = re.findall(r"[\wÀ-ÿ]+", text.casefold())
        for token in tokens:
            digest = hashlib.blake2b(token.encode("utf-8"), digest_size=16).digest()
            index = int.from_bytes(digest[:8], "big") % self.dimensions
            sign = 1.0 if digest[8] & 1 else -1.0
            vector[index] += sign
        norm = math.sqrt(sum(value * value for value in vector))
        return [value / norm for value in vector] if norm else vector


class EmbeddingService:
    """Valida o contrato para impedir vetores incompatíveis com o schema."""

    def __init__(self, provider: EmbeddingProvider) -> None:
        self.provider = provider
        self.dimensions = provider.dimensions

    async def embed(self, text: str) -> list[float]:
        vector = await self.provider.embed(text)
        if len(vector) != self.dimensions:
            raise ValueError(
                f"O provedor retornou {len(vector)} dimensões; esperado: {self.dimensions}."
            )
        if not all(math.isfinite(value) for value in vector):
            raise ValueError("O provedor retornou um embedding inválido.")
        return vector
