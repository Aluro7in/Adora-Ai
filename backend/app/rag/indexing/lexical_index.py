"""
Adora AI — Lexical Keyword Index
Implements BM25 scoring with inverted term postings, document frequency tracking,
and per-user isolation.
"""

import math
import re
from typing import Dict, Any, List, Optional, Set
from collections import Counter


STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any",
    "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below",
    "between", "both", "but", "by", "can", "can't", "cannot", "could", "did", "do",
    "does", "doing", "don't", "down", "during", "each", "few", "for", "from", "further",
    "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him",
    "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself",
    "just", "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of",
    "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves",
    "out", "over", "own", "same", "she", "should", "so", "some", "such", "than",
    "that", "the", "their", "theirs", "them", "themselves", "then", "there", "these",
    "they", "this", "those", "through", "to", "too", "under", "until", "up", "very",
    "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom",
    "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"
}


class LexicalDoc:
    def __init__(
        self,
        doc_id: str,
        user_id: str,
        parent_doc_id: str,
        chunk_id: str,
        content: str,
        metadata: Dict[str, Any],
    ):
        self.doc_id = doc_id
        self.user_id = user_id
        self.parent_doc_id = parent_doc_id
        self.chunk_id = chunk_id
        self.content = content
        self.metadata = metadata
        self.tokens: List[str] = LexicalIndex.tokenize(content)
        self.doc_len: int = len(self.tokens)
        self.term_counts: Counter = Counter(self.tokens)


class LexicalIndex:
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        # Maps user_id -> doc_id -> LexicalDoc
        self._user_docs: Dict[str, Dict[str, LexicalDoc]] = {}
        # Maps user_id -> term -> set of doc_ids
        self._user_postings: Dict[str, Dict[str, Set[str]]] = {}

    @staticmethod
    def tokenize(text: str) -> List[str]:
        """Lowercases, extracts alphanumeric words, and filters stopwords."""
        words = re.findall(r"\b[a-zA-Z0-9_\-]{2,}\b", text.lower())
        return [w for w in words if w not in STOP_WORDS]

    def insert(
        self,
        record_id: str,
        user_id: str,
        parent_doc_id: str,
        chunk_id: str,
        content: str,
        metadata: Dict[str, Any],
    ):
        """Indexes a chunk for BM25 retrieval."""
        if user_id not in self._user_docs:
            self._user_docs[user_id] = {}
            self._user_postings[user_id] = {}

        doc = LexicalDoc(
            doc_id=record_id,
            user_id=user_id,
            parent_doc_id=parent_doc_id,
            chunk_id=chunk_id,
            content=content,
            metadata=metadata,
        )
        self._user_docs[user_id][record_id] = doc

        for term in doc.term_counts.keys():
            if term not in self._user_postings[user_id]:
                self._user_postings[user_id][term] = set()
            self._user_postings[user_id][term].add(record_id)

    def delete_by_parent_doc_id(self, user_id: str, parent_doc_id: str) -> int:
        """Removes all lexical records belonging to parent_doc_id."""
        if user_id not in self._user_docs:
            return 0

        to_remove = [
            doc_id for doc_id, doc in self._user_docs[user_id].items()
            if doc.parent_doc_id == parent_doc_id
        ]

        for doc_id in to_remove:
            doc = self._user_docs[user_id].pop(doc_id)
            for term in doc.term_counts.keys():
                if term in self._user_postings[user_id]:
                    self._user_postings[user_id][term].discard(doc_id)

        return len(to_remove)

    def search(
        self,
        user_id: str,
        query: str,
        top_k: int = 5,
        source_types: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Calculates BM25 scores for query terms against user documents.
        """
        if user_id not in self._user_docs or not self._user_docs[user_id]:
            return []

        query_tokens = self.tokenize(query)
        if not query_tokens:
            return []

        user_docs = self._user_docs[user_id]
        n_docs = len(user_docs)
        avg_dl = sum(d.doc_len for d in user_docs.values()) / max(1, n_docs)

        scores: Dict[str, float] = {}

        for term in query_tokens:
            posting_docs = self._user_postings[user_id].get(term, set())
            n_containing = len(posting_docs)
            if n_containing == 0:
                continue

            # Standard BM25 IDF
            idf = math.log(1.0 + (n_docs - n_containing + 0.5) / (n_containing + 0.5))

            for doc_id in posting_docs:
                doc = user_docs[doc_id]

                # Pre-filter source types
                if source_types and doc.metadata.get("sourceType") not in source_types:
                    continue

                tf = doc.term_counts[term]
                numerator = tf * (self.k1 + 1.0)
                denominator = tf + self.k1 * (1.0 - self.b + self.b * (doc.doc_len / avg_dl))
                term_score = idf * (numerator / denominator)

                scores[doc_id] = scores.get(doc_id, 0.0) + term_score

        if not scores:
            return []

        # Normalize BM25 scores to [0, 1] relative to maximum observed in result set
        max_score = max(scores.values()) or 1.0
        results = []

        for doc_id, score in scores.items():
            doc = user_docs[doc_id]
            norm_score = min(1.0, score / max_score)
            results.append({
                "recordId": doc.doc_id,
                "chunkId": doc.chunk_id,
                "parentDocId": doc.parent_doc_id,
                "content": doc.content,
                "score": norm_score,
                "metadata": doc.metadata,
                "retrievalMethod": "lexical",
            })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]


lexical_index = LexicalIndex()
