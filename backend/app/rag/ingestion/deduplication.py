"""
Adora AI — Ingestion Deduplication Service
Prevents duplicate ingestion and redundant embedding computation based on SHA-256 hashes.
"""

from typing import Dict, Any, Optional, Set


class DeduplicationService:
    def __init__(self):
        # Maps user_id -> set of known content hashes
        self._user_hashes: Dict[str, Set[str]] = {}

    def is_duplicate(self, user_id: str, content_hash: str) -> bool:
        """Returns True if the content hash has already been registered for the user."""
        return content_hash in self._user_hashes.get(user_id, set())

    def register_hash(self, user_id: str, content_hash: str):
        """Registers a content hash as indexed."""
        if user_id not in self._user_hashes:
            self._user_hashes[user_id] = set()
        self._user_hashes[user_id].add(content_hash)

    def remove_hash(self, user_id: str, content_hash: str):
        """Removes a content hash upon document deletion."""
        if user_id in self._user_hashes and content_hash in self._user_hashes[user_id]:
            self._user_hashes[user_id].remove(content_hash)
