"""
Adora AI — Retrieval Query Processor
Processes, normalizes, and extracts semantic search terms from retrieval queries.
"""

import re
from typing import Dict, Any, List


class QueryProcessor:
    @staticmethod
    def process(query: str) -> Dict[str, Any]:
        """
        Normalizes query, cleans special characters, and extracts search intents.
        """
        clean = query.strip()
        # Lowercase for keyword extraction
        keywords = re.findall(r"\b[a-zA-Z0-9_\-]{2,}\b", clean.lower())

        # Detect date or category mentions
        is_reflective = any(k in ["feel", "think", "decision", "reflection", "journal", "goal"] for k in keywords)

        return {
            "originalQuery": query,
            "normalizedQuery": clean,
            "keywords": keywords,
            "isReflective": is_reflective,
        }
