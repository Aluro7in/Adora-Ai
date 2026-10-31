"""
Adora AI — RAG Lifecycle: Deletion & Reindexing
Handles cascading deletion of source documents, chunks, vectors, lexical tokens,
and reindexing when models or algorithms are upgraded.
"""

from typing import Dict, Any, List, Optional
from app.rag.indexing.index_manager import index_manager
from app.rag.ingestion.deduplication import DeduplicationService
from app.core.logging import logger


class DeletionService:
    @staticmethod
    def delete_document(user_id: str, document_id: str, content_hash: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes cascading deletion:
        1. Vector chunks
        2. Lexical inverted tokens
        3. Deduplication hash registry
        """
        del_stats = index_manager.delete_document_indices(user_id=user_id, parent_doc_id=document_id)
        if content_hash:
            dedup = DeduplicationService()
            dedup.remove_hash(user_id, content_hash)

        logger.info(
            f"Cascade deletion for doc {document_id} (user {user_id}): {del_stats['vectorChunksDeleted']} vector chunks, "
            f"{del_stats['lexicalChunksDeleted']} lexical entries removed."
        )
        return {
            "documentId": document_id,
            "status": "deleted",
            **del_stats,
        }


class ReindexService:
    @staticmethod
    async def reindex_document(user_id: str, document_id: str, raw_content: str, filename: str) -> Dict[str, Any]:
        """
        Purges existing chunks and runs fresh ingestion pipeline.
        """
        DeletionService.delete_document(user_id, document_id)
        from app.rag.ingestion.pipeline import ingestion_pipeline
        return await ingestion_pipeline.ingest_document(
            user_id=user_id,
            content=raw_content.encode("utf-8"),
            filename=filename,
        )
