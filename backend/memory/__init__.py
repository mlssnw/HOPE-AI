"""Domínio de memória persistente da HOPE."""

from .classifier import MemoryClassifier
from .embeddings import (
    EmbeddingProvider,
    EmbeddingService,
    LocalHashEmbeddingProvider,
    create_embedding_provider,
)
from .entities import EntityExtractor, RuleBasedEntityExtractor
from .manager import MemoryManager
from .repository import MemoryRepository
from .service import MemoryService

__all__ = [
    "EmbeddingProvider",
    "EmbeddingService",
    "EntityExtractor",
    "LocalHashEmbeddingProvider",
    "create_embedding_provider",
    "MemoryClassifier",
    "MemoryManager",
    "MemoryRepository",
    "MemoryService",
    "RuleBasedEntityExtractor",
]
