"""
Adora AI — Document Metadata Extractor
Extracts document attributes, word count, cryptographic hashes, tags, and source types.
"""

import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional


class MetadataExtractor:
    @staticmethod
    def extract_metadata(
        doc_id: str,
        user_id: str,
        title: str,
        text: str,
        source_type: str = "document",
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Extracts structured source provenance metadata.
        """
        now = datetime.utcnow().isoformat()
        content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
        words = text.split()
        word_count = len(words)
        char_count = len(text)

        # Heuristic auto-tagging based on frequent words/keywords
        tags = set()
        if source_type in ["reflection", "journal"]:
            tags.add("personal")
        elif source_type in ["workflow", "plan"]:
            tags.add("strategic")
        elif source_type in ["document", "pdf", "docx"]:
            tags.add("knowledge")

        meta = {
            "documentId": doc_id,
            "userId": user_id,
            "title": title,
            "sourceType": source_type,
            "contentHash": content_hash,
            "wordCount": word_count,
            "charCount": char_count,
            "tags": list(tags),
            "createdAt": now,
            "updatedAt": now,
            "indexStatus": "pending",
        }

        if extra_metadata:
            meta.update(extra_metadata)

        return meta
