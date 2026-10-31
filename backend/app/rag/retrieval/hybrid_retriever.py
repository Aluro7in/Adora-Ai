"""
Adora AI — Hybrid Retriever
Coordinates vector search, BM25 lexical search, RRF fusion, and reranking under a token budget.
"""

from typing import Dict, Any, List, Optional
from app.rag.retrieval.retrievers import VectorRetriever, LexicalRetriever, MetadataFilter
from app.rag.retrieval.reciprocal_rank_fusion import reciprocal_rank_fusion, Reranker
from app.rag.retrieval.query_processor import QueryProcessor
from app.core.logging import logger


class HybridRetriever:
    def __init__(
        self,
        vector_retriever: Optional[VectorRetriever] = None,
        lexical_retriever: Optional[LexicalRetriever] = None,
    ):
        self.vector_retriever = vector_retriever or VectorRetriever()
        self.lexical_retriever = lexical_retriever or LexicalRetriever()
        self.reranker = Reranker()

    async def retrieve(
        self,
        user_id: str,
        query: str,
        top_k: int = 5,
        source_types: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        token_budget: int = 1500,
    ) -> List[Dict[str, Any]]:
        """
        Executes hybrid retrieval:
        1. Query normalization
        2. Vector semantic search
        3. Lexical BM25 search
        4. Reciprocal Rank Fusion (RRF)
        5. Reranking
        6. Token budget slicing
        """
        proc = QueryProcessor.process(query)
        clean_q = proc["normalizedQuery"]

        # 1. Parallel retrieval
        try:
            vec_candidates = await self.vector_retriever.retrieve(
                user_id=user_id,
                query=clean_q,
                top_k=top_k * 2,
                source_types=source_types,
                tags=tags,
            )
        except Exception as e:
            logger.warning(f"Vector retrieval failed: {e}. Falling back to lexical.")
            vec_candidates = []

        lex_candidates = self.lexical_retriever.retrieve(
            user_id=user_id,
            query=clean_q,
            top_k=top_k * 2,
            source_types=source_types,
        )

        # 2. RRF Fusion
        fused = reciprocal_rank_fusion(vec_candidates, lex_candidates, k=60)

        # 3. Rerank
        reranked = self.reranker.rerank(clean_q, fused, top_k=top_k * 2)

        # 4. Token budget filter
        selected = []
        accumulated_tokens = 0

        for item in reranked:
            content = item.get("content", "")
            est_tokens = len(content.split()) * 1.3
            if accumulated_tokens + est_tokens <= token_budget or not selected:
                selected.append(item)
                accumulated_tokens += est_tokens
            if len(selected) >= top_k:
                break

        return selected


hybrid_retriever = HybridRetriever()
