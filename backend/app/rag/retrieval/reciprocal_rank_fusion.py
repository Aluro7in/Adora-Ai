"""
Adora AI — Reciprocal Rank Fusion (RRF) & Reranking
Combines multi-modal search results (dense vector + sparse lexical) using standard RRF:
score(d) = sum(1 / (k + rank_i(d)))
"""

from typing import Dict, Any, List, Optional


def reciprocal_rank_fusion(
    vector_results: List[Dict[str, Any]],
    lexical_results: List[Dict[str, Any]],
    k: int = 60,
) -> List[Dict[str, Any]]:
    """
    Fuses rankings from vector and lexical retrievers using standard Reciprocal Rank Fusion.
    """
    rrf_scores: Dict[str, float] = {}
    doc_map: Dict[str, Dict[str, Any]] = {}

    # 1. Score vector results
    for rank, item in enumerate(vector_results, start=1):
        cid = item["chunkId"]
        doc_map[cid] = item
        rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (k + rank))

    # 2. Score lexical results
    for rank, item in enumerate(lexical_results, start=1):
        cid = item["chunkId"]
        if cid not in doc_map:
            doc_map[cid] = item
        rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (k + rank))

    # Normalize scores between 0 and 1
    max_rrf = max(rrf_scores.values()) if rrf_scores else 1.0

    combined = []
    for cid, raw_score in rrf_scores.items():
        base_item = dict(doc_map[cid])
        base_item["rrfScore"] = raw_score / max_rrf
        base_item["retrievalMethod"] = "hybrid_rrf"
        combined.append(base_item)

    combined.sort(key=lambda x: x["rrfScore"], reverse=True)
    return combined


class Reranker:
    @staticmethod
    def rerank(
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Reranks fused candidates with exact phrase matching boost and positional recency.
        """
        q_lower = query.lower()
        reranked = []

        for item in candidates:
            score = item.get("rrfScore", item.get("score", 0.5))
            text = item.get("content", "").lower()

            # Exact match boost
            if q_lower in text:
                score += 0.25

            # Heading match boost
            headings = item.get("metadata", {}).get("headingPath", [])
            if any(q_lower in h.lower() for h in headings):
                score += 0.15

            item_copy = dict(item)
            item_copy["finalScore"] = min(1.0, score)
            reranked.append(item_copy)

        reranked.sort(key=lambda x: x["finalScore"], reverse=True)
        return reranked[:top_k]
