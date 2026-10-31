"""
Adora AI — Index Manager
Coordinates atomic updates to vector and lexical indices and manages lifecycle hooks.
"""

from typing import Dict, Any, List, Optional
from app.rag.indexing.vector_index import VectorIndex, VectorRecord, vector_index
from app.rag.indexing.lexical_index import LexicalIndex, lexical_index


class IndexManager:
    def __init__(self, vec_idx: VectorIndex = vector_index, lex_idx: LexicalIndex = lexical_index):
        self.vector_index = vec_idx
        self.lexical_index = lex_idx

    def index_chunk(
        self,
        record_id: str,
        user_id: str,
        parent_doc_id: str,
        chunk_id: str,
        content: str,
        embedding: List[float],
        metadata: Dict[str, Any],
    ):
        """Indexes chunk simultaneously in Vector Index and Lexical BM25 Index."""
        # 1. Vector Index
        vec_record = VectorRecord(
            record_id=record_id,
            user_id=user_id,
            parent_doc_id=parent_doc_id,
            chunk_id=chunk_id,
            content=content,
            embedding=embedding,
            metadata=metadata,
        )
        self.vector_index.insert(vec_record)

        # 2. Lexical Index
        self.lexical_index.insert(
            record_id=record_id,
            user_id=user_id,
            parent_doc_id=parent_doc_id,
            chunk_id=chunk_id,
            content=content,
            metadata=metadata,
        )

    def delete_document_indices(self, user_id: str, parent_doc_id: str) -> Dict[str, int]:
        """Cascading deletion of all chunks from vector and lexical indexes."""
        vec_deleted = self.vector_index.delete_by_parent_doc_id(user_id, parent_doc_id)
        lex_deleted = self.lexical_index.delete_by_parent_doc_id(user_id, parent_doc_id)
        return {
            "vectorChunksDeleted": vec_deleted,
            "lexicalChunksDeleted": lex_deleted,
        }


index_manager = IndexManager()
