"""
Adora AI — Ingestion Package
"""

from app.rag.ingestion.document_parser import DocumentParser, DocumentParseResult
from app.rag.ingestion.normalizer import TextNormalizer
from app.rag.ingestion.chunker import IntelligentChunker, DocumentChunk
from app.rag.ingestion.metadata_extractor import MetadataExtractor
from app.rag.ingestion.deduplication import DeduplicationService
from app.rag.ingestion.ingestion_jobs import IngestionJob, IngestionJobManager, ingestion_job_manager
from app.rag.ingestion.pipeline import IngestionPipeline, ingestion_pipeline

__all__ = [
    "DocumentParser",
    "DocumentParseResult",
    "TextNormalizer",
    "IntelligentChunker",
    "DocumentChunk",
    "MetadataExtractor",
    "DeduplicationService",
    "IngestionJob",
    "IngestionJobManager",
    "ingestion_job_manager",
    "IngestionPipeline",
    "ingestion_pipeline",
]
