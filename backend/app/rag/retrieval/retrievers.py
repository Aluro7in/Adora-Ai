"""
Adora AI — Metadata Filter & Vector/Lexical Retrievers
"""

from typing import Dict, Any, List, Optional
from app.rag.indexing.vector_index import VectorIndex, vector_index
from app.rag.indexing.lexical_index import LexicalIndex, lexical_index
from app.rag.embeddings.nebius_embeddings import NebiusEmbeddingProvider


class MetadataFilter:
    @staticmethod
    def passes_filter(
        metadata: Dict[str, Any],
        source_types: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        approval_state: Optional[str] = None,
    ) -> bool:
        if source_types and metadata.get("sourceType") not in source_types:
            return False
        if tags:
            rec_tags = metadata.get("tags", [])
            if not any(t in rec_tags for t in tags):
                return False
        if approval_state and metadata.get("approvalState") != approval_state:
            return False
        return True


class VectorRetriever:
    def __init__(self, vec_idx: VectorIndex = vector_index, embedder: Optional[NebiusEmbeddingProvider] = None):
        self.vector_index = vec_idx
        self.embedder = embedder or NebiusEmbeddingProvider()

    async def retrieve(
        self,
        user_id: str,
        query: str,
        top_k: int = 5,
        source_types: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        query_vector = await self.embedder.embed_query(query)
        return self.vector_index.search(
            user_id=user_id,
            query_vector=query_vector,
            top_k=top_k,
            source_types=source_types,
            tags=tags,
        )


class LexicalRetriever:
    def __init__(self, lex_idx: LexicalIndex = lexical_index):
        self.lexical_index = lex_idx

    def retrieve(
        self,
        user_id: str,
        query: str,
        top_k: int = 5,
        source_types: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        return self.lexical_index.search(
            user_id=user_id,
            query=query,
            top_k=top_k,
            source_types=source_types,
        )
