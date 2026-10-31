"""
Adora AI — Vector Index
Stores normalized dense embeddings and provides cosine similarity search with metadata filtering.
"""

import math
from typing import Dict, Any, List, Optional
from datetime import datetime


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Computes cosine similarity between two float vectors."""
    if len(v1) != len(v2) or len(v1) == 0:
        return 0.0

    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    sim = dot / (norm_a * norm_b)
    # Clamp between -1.0 and 1.0 to guard against precision float errors
    return max(-1.0, min(1.0, sim))


class VectorRecord:
    def __init__(
        self,
        record_id: str,
        user_id: str,
        parent_doc_id: str,
        chunk_id: str,
        content: str,
        embedding: List[float],
        metadata: Dict[str, Any],
    ):
        self.record_id = record_id
        self.user_id = user_id
        self.parent_doc_id = parent_doc_id
        self.chunk_id = chunk_id
        self.content = content
        self.embedding = embedding
        self.metadata = metadata
        self.indexed_at = datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "recordId": self.record_id,
            "userId": self.user_id,
            "parentDocId": self.parent_doc_id,
            "chunkId": self.chunk_id,
            "content": self.content,
            "metadata": self.metadata,
            "indexedAt": self.indexed_at,
        }


class VectorIndex:
    def __init__(self):
        # Maps record_id -> VectorRecord
        self._records: Dict[str, VectorRecord] = {}

    def insert(self, record: VectorRecord):
        """Inserts or updates a vector record."""
        self._records[record.record_id] = record

    def insert_batch(self, records: List[VectorRecord]):
        for r in records:
            self.insert(r)

    def delete_by_parent_doc_id(self, user_id: str, parent_doc_id: str) -> int:
        """Deletes all vector chunks belonging to a parent document."""
        to_remove = [
            rid for rid, r in self._records.items()
            if r.user_id == user_id and r.parent_doc_id == parent_doc_id
        ]
        for rid in to_remove:
            del self._records[rid]
        return len(to_remove)

    def search(
        self,
        user_id: str,
        query_vector: List[float],
        top_k: int = 5,
        min_score: float = 0.2,
        source_types: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Performs cosine similarity search against user-owned vectors with metadata filtering.
        """
        candidates = []

        for record in self._records.values():
            # Strict per-user isolation boundary
            if record.user_id != user_id:
                continue

            # Metadata pre-filters
            if source_types and record.metadata.get("sourceType") not in source_types:
                continue

            if tags:
                rec_tags = record.metadata.get("tags", [])
                if not any(t in rec_tags for t in tags):
                    continue

            # Similarity computation
            sim = cosine_similarity(query_vector, record.embedding)
            # Map [-1, 1] to [0, 1]
            normalized_score = (sim + 1.0) / 2.0

            if normalized_score >= min_score:
                candidates.append({
                    "recordId": record.record_id,
                    "chunkId": record.chunk_id,
                    "parentDocId": record.parent_doc_id,
                    "content": record.content,
                    "score": normalized_score,
                    "metadata": record.metadata,
                    "retrievalMethod": "vector",
                })

        # Sort descending by score
        candidates.sort(key=lambda x: x["score"], reverse=True)
        return candidates[:top_k]


vector_index = VectorIndex()
