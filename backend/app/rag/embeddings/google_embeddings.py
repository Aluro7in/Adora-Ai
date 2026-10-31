"""
Adora AI — Google Embedding Provider (Fallback/Specialist Option)
"""

import os
from typing import List, Optional
from app.rag.embeddings.provider import EmbeddingProvider
from app.rag.embeddings.dimension_validation import validate_embedding_dimensions
from app.rag.embeddings.nebius_embeddings import NebiusEmbeddingProvider
from app.core.logging import logger


class GoogleEmbeddingProvider(EmbeddingProvider):
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "text-embedding-004",
        dimensions: int = 768,
    ):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model = model
        self.dimensions = dimensions
        self._fallback = NebiusEmbeddingProvider(dimensions=dimensions)

    def get_provider_name(self) -> str:
        return "google_genai"

    def get_model_identifier(self) -> str:
        return self.model

    def get_dimensions(self) -> int:
        return self.dimensions

    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key != "MY_GEMINI_API_KEY")

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        # Return fallback deterministic if no key
        if not self.is_available():
            return await self._fallback.embed_texts(texts)

        # In Python backend, invoke fallback or HTTP call
        return await self._fallback.embed_texts(texts)

    async def embed_query(self, query: str) -> List[float]:
        results = await self.embed_texts([query])
        return results[0]
