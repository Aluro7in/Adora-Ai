"""
Adora AI — Document Ingestion Pipeline
End-to-end ingestion pipeline for reflections, memories, and uploaded documents.
"""

import uuid
from typing import Dict, Any, List, Optional
from app.rag.ingestion.document_parser import DocumentParser, DocumentParseResult
from app.rag.ingestion.normalizer import TextNormalizer
from app.rag.ingestion.chunker import IntelligentChunker, DocumentChunk
from app.rag.ingestion.metadata_extractor import MetadataExtractor
from app.rag.ingestion.deduplication import DeduplicationService
from app.rag.ingestion.ingestion_jobs import ingestion_job_manager
from app.rag.embeddings.nebius_embeddings import NebiusEmbeddingProvider
from app.rag.indexing.index_manager import index_manager
from app.repositories.firestore_repo import firestore_repo
from app.core.logging import logger


class IngestionPipeline:
    def __init__(
        self,
        embedding_provider: Optional[NebiusEmbeddingProvider] = None,
        chunker: Optional[IntelligentChunker] = None,
    ):
        self.embedding_provider = embedding_provider or NebiusEmbeddingProvider()
        self.chunker = chunker or IntelligentChunker()
        self.dedup_service = DeduplicationService()
        # In-memory document repository for fast RAG inspection
        self._user_docs: Dict[str, Dict[str, Dict[str, Any]]] = {}

    async def ingest_document(
        self,
        user_id: str,
        content: bytes,
        filename: str,
        mime_type: Optional[str] = None,
        source_type: str = "document",
    ) -> Dict[str, Any]:
        """
        Executes full ingestion pipeline:
        Parse -> Normalize -> Extract Metadata -> Deduplicate -> Chunk -> Embed -> Index.
        """
        doc_id = f"doc_{uuid.uuid4().hex[:8]}"
        job = ingestion_job_manager.create_job(user_id=user_id, document_id=doc_id, title=filename)

        try:
            # 1. Parse document
            job.update(stage="parsing", progress=15)
            parse_res: DocumentParseResult = DocumentParser.parse(content, filename, mime_type)

            # 2. Normalize text
            job.update(stage="normalizing", progress=30)
            normalized_text = TextNormalizer.normalize(parse_res.raw_text)
            if not normalized_text:
                raise ValueError("Parsed document yielded empty text content.")

            # 3. Metadata extraction
            job.update(stage="metadata_extraction", progress=45)
            doc_metadata = MetadataExtractor.extract_metadata(
                doc_id=doc_id,
                user_id=user_id,
                title=parse_res.title,
                text=normalized_text,
                source_type=source_type,
                extra_metadata=parse_res.metadata,
            )

            # 4. Deduplication
            content_hash = doc_metadata["contentHash"]
            if self.dedup_service.is_duplicate(user_id, content_hash):
                job.update(status="completed", progress=100, stage="deduplicated")
                logger.info(f"Document '{filename}' is already indexed for user {user_id}.")
                return {
                    "documentId": doc_id,
                    "title": parse_res.title,
                    "status": "already_indexed",
                    "contentHash": content_hash,
                }

            # 5. Chunking
            job.update(stage="chunking", progress=60)
            chunks: List[DocumentChunk] = self.chunker.chunk_document(
                parent_doc_id=doc_id,
                text=normalized_text,
                detected_headings=parse_res.headings,
            )
            if not chunks:
                raise ValueError("Chunking produced zero chunks from normalized text.")

            # 6. Embedding generation
            job.update(stage="embedding_generation", progress=80)
            chunk_texts = [c.content for c in chunks]
            embeddings = await self.embedding_provider.embed_texts(chunk_texts)

            # 7. Dual Indexing (Vector + Lexical BM25)
            job.update(stage="indexing", progress=90)
            for i, chunk in enumerate(chunks):
                record_id = f"rec_{chunk.chunk_id}"
                index_manager.index_chunk(
                    record_id=record_id,
                    user_id=user_id,
                    parent_doc_id=doc_id,
                    chunk_id=chunk.chunk_id,
                    content=chunk.content,
                    embedding=embeddings[i],
                    metadata={
                        "title": parse_res.title,
                        "sourceType": source_type,
                        "headingPath": chunk.heading_path,
                        "chunkIndex": chunk.chunk_index,
                        "tokenCount": chunk.token_count,
                        "contentHash": chunk.content_hash,
                        "tags": doc_metadata["tags"],
                        "createdAt": doc_metadata["createdAt"],
                    },
                )

            # Register hash and update status
            self.dedup_service.register_hash(user_id, content_hash)
            doc_metadata["indexStatus"] = "indexed"
            doc_metadata["chunkCount"] = len(chunks)
            doc_metadata["embeddingModel"] = self.embedding_provider.get_model_identifier()
            doc_metadata["embeddingDimensions"] = self.embedding_provider.get_dimensions()

            # Store in local document register
            if user_id not in self._user_docs:
                self._user_docs[user_id] = {}
            self._user_docs[user_id][doc_id] = doc_metadata

            job.update(status="completed", progress=100, stage="finished")
            logger.info(
                f"Successfully ingested and indexed document '{filename}' ({len(chunks)} chunks, {doc_metadata['wordCount']} words)."
            )

            return {
                "documentId": doc_id,
                "title": parse_res.title,
                "status": "indexed",
                "chunkCount": len(chunks),
                "wordCount": doc_metadata["wordCount"],
                "contentHash": content_hash,
                "embeddingModel": doc_metadata["embeddingModel"],
                "dimensions": doc_metadata["embeddingDimensions"],
            }

        except Exception as e:
            logger.error(f"Ingestion failed for '{filename}': {e}")
            job.update(status="failed", stage="failed", error=str(e))
            raise e

    def list_documents(self, user_id: str) -> List[Dict[str, Any]]:
        """Lists user documents registered in RAG system."""
        if user_id not in self._user_docs:
            return []
        return sorted(
            list(self._user_docs[user_id].values()),
            key=lambda d: d.get("createdAt", ""),
            reverse=True,
        )


ingestion_pipeline = IngestionPipeline()
