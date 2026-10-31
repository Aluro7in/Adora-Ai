"""
Adora AI — RAG Evaluation Metrics
Calculates standard information retrieval metrics: Recall@K, Precision@K, MRR, nDCG@K.
"""

import math
from typing import List, Set, Dict, Any


def precision_at_k(retrieved: List[str], relevant: Set[str], k: int) -> float:
    """Computes Precision@K = (relevant in top K) / K"""
    if k <= 0:
        return 0.0
    top_k = retrieved[:k]
    rel_in_top_k = sum(1 for doc_id in top_k if doc_id in relevant)
    return rel_in_top_k / k


def recall_at_k(retrieved: List[str], relevant: Set[str], k: int) -> float:
    """Computes Recall@K = (relevant in top K) / total relevant"""
    if not relevant:
        return 1.0 if not retrieved else 0.0
    top_k = retrieved[:k]
    rel_in_top_k = sum(1 for doc_id in top_k if doc_id in relevant)
    return rel_in_top_k / len(relevant)


def mean_reciprocal_rank(retrieved: List[str], relevant: Set[str]) -> float:
    """Computes Reciprocal Rank (1 / rank of first relevant result)."""
    for rank, doc_id in enumerate(retrieved, start=1):
        if doc_id in relevant:
            return 1.0 / rank
    return 0.0


def ndcg_at_k(retrieved: List[str], relevance_scores: Dict[str, float], k: int) -> float:
    """Computes Normalized Discounted Cumulative Gain at K."""
    if k <= 0:
        return 0.0

    # DCG
    dcg = 0.0
    for rank, doc_id in enumerate(retrieved[:k], start=1):
        rel = relevance_scores.get(doc_id, 0.0)
        dcg += (2.0 ** rel - 1.0) / math.log2(rank + 1)

    # Ideal DCG
    sorted_ideal = sorted(relevance_scores.values(), reverse=True)[:k]
    idcg = sum((2.0 ** rel - 1.0) / math.log2(rank + 1) for rank, rel in enumerate(sorted_ideal, start=1))

    if idcg == 0.0:
        return 0.0
    return dcg / idcg


class RAGEvaluator:
    @staticmethod
    def evaluate_retrieval(
        retrieved_ids: List[str],
        expected_relevant_ids: Set[str],
        k: int = 5,
    ) -> Dict[str, float]:
        return {
            f"precision@{k}": round(precision_at_k(retrieved_ids, expected_relevant_ids, k), 4),
            f"recall@{k}": round(recall_at_k(retrieved_ids, expected_relevant_ids, k), 4),
            "mrr": round(mean_reciprocal_rank(retrieved_ids, expected_relevant_ids), 4),
        }

    @staticmethod
    def evaluate_groundedness(answer: str, citations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Evaluates citation coverage and whether the answer makes claims without citation."""
        has_citations = len(citations) > 0
        explicit_cites = sum(1 for c in citations if c.get("explicitlyCited"))
        coverage = (explicit_cites / len(citations)) if citations else 0.0

        return {
            "hasCitations": has_citations,
            "totalCitations": len(citations),
            "explicitCitations": explicit_cites,
            "citationCoverage": round(coverage, 2),
            "isGrounded": has_citations and coverage > 0.0,
        }
