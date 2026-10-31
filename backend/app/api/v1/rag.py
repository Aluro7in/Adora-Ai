"""
Adora AI — RAG API Endpoints
Document ingestion, hybrid search, grounded question answering, and cascading deletion.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.rag.ingestion.pipeline import ingestion_pipeline
from app.rag.retrieval.hybrid_retriever import hybrid_retriever
from app.rag.generation.grounded_generator import grounded_generator
from app.rag.lifecycle.lifecycle_services import DeletionService
from app.core.logging import logger

router = APIRouter()


class RAGSearchRequest(BaseModel):
    query: str
    top_k: int = 5
    source_types: Optional[List[str]] = None
    tags: Optional[List[str]] = None


class RAGAskRequest(BaseModel):
    question: str
    top_k: int = 5
    system_instructions: Optional[str] = None


class IngestTextRequest(BaseModel):
    title: str
    text: str
    source_type: str = "document"


@router.post("/ingest")
async def ingest_file(
    request: Request,
    file: Optional[UploadFile] = File(None),
    title: Optional[str] = Form(None),
    text_content: Optional[str] = Form(None),
    source_type: str = Form("document"),
):
    """
    Ingests a document (uploaded file or raw text) into the RAG engine.
    Runs parsing, normalization, metadata extraction, chunking, embedding, and indexing.
    """
    user_id = request.headers.get("X-User-ID", "usr_adora_local")

    try:
        if file:
            content = await file.read()
            filename = file.filename or "uploaded_doc.txt"
            mime_type = file.content_type
        elif text_content:
            content = text_content.encode("utf-8")
            filename = f"{title or 'document'}.txt"
            mime_type = "text/plain"
        else:
            raise HTTPException(status_code=400, detail="Either file or text_content must be provided.")

        result = await ingestion_pipeline.ingest_document(
            user_id=user_id,
            content=content,
            filename=filename,
            mime_type=mime_type,
            source_type=source_type,
        )
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Ingestion API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ingest/text")
async def ingest_plain_text(req: IngestTextRequest, request: Request):
    """Ingests plain text directly from JSON body."""
    user_id = request.headers.get("X-User-ID", "usr_adora_local")
    try:
        result = await ingestion_pipeline.ingest_document(
            user_id=user_id,
            content=req.text.encode("utf-8"),
            filename=f"{req.title}.txt",
            mime_type="text/plain",
            source_type=req.source_type,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents")
async def list_documents(request: Request):
    """Lists all user documents indexed in the RAG repository."""
    user_id = request.headers.get("X-User-ID", "usr_adora_local")
    docs = ingestion_pipeline.list_documents(user_id)
    return {"success": True, "data": {"items": docs}}


@router.post("/search")
async def search_rag(req: RAGSearchRequest, request: Request):
    """Executes hybrid vector + lexical BM25 retrieval."""
    user_id = request.headers.get("X-User-ID", "usr_adora_local")
    results = await hybrid_retriever.retrieve(
        user_id=user_id,
        query=req.query,
        top_k=req.top_k,
        source_types=req.source_types,
        tags=req.tags,
    )
    return {"success": True, "data": {"results": results, "total": len(results)}}


@router.post("/ask")
async def ask_grounded(req: RAGAskRequest, request: Request):
    """Retrieves relevant context and generates a grounded response with citations."""
    user_id = request.headers.get("X-User-ID", "usr_adora_local")
    retrieved = await hybrid_retriever.retrieve(
        user_id=user_id,
        query=req.question,
        top_k=req.top_k,
    )
    gen = await grounded_generator.generate(
        query=req.question,
        retrieved_chunks=retrieved,
        system_instructions=req.system_instructions,
    )
    return {"success": True, "data": gen}


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, request: Request):
    """Cascading deletion of a document and its vector/lexical indexes."""
    user_id = request.headers.get("X-User-ID", "usr_adora_local")
    res = DeletionService.delete_document(user_id=user_id, document_id=doc_id)
    return {"success": True, "data": res}
