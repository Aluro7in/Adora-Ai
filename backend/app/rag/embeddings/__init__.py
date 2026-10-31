"""
Adora AI — Embeddings Package
"""

from app.rag.embeddings.provider import EmbeddingProvider
from app.rag.embeddings.nebius_embeddings import NebiusEmbeddingProvider
from app.rag.embeddings.google_embeddings import GoogleEmbeddingProvider
from app.rag.embeddings.dimension_validation import validate_embedding_dimensions, DimensionValidationError

__all__ = [
    "EmbeddingProvider",
    "NebiusEmbeddingProvider",
    "GoogleEmbeddingProvider",
    "validate_embedding_dimensions",
    "DimensionValidationError",
]
