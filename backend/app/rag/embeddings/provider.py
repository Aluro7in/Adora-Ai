"""
Adora AI — Embedding Provider Interface
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import time


class EmbeddingProvider(ABC):
    """Abstract Base Class for text embedding generation providers."""

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns the name of the provider."""
        pass

    @abstractmethod
    def get_model_identifier(self) -> str:
        """Returns the model identifier used for embedding."""
        pass

    @abstractmethod
    def get_dimensions(self) -> int:
        """Returns the dimension size of generated vectors."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Returns True if the provider is properly configured and reachable."""
        pass

    @abstractmethod
    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generates embedding vectors for a batch of strings."""
        pass

    @abstractmethod
    async def embed_query(self, query: str) -> List[float]:
        """Generates an embedding vector for a retrieval query."""
        pass
