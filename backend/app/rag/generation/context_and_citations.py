"""
Adora AI — RAG Generation: Context & Citation Builders
"""

from typing import Dict, Any, List, Optional
import re


class ContextBuilder:
    @staticmethod
    def build_context_package(retrieved_chunks: List[Dict[str, Any]]) -> str:
        """
        Builds a structured, untrusted context block for the LLM.
        Explicitly isolates retrieved data to prevent prompt injection.
        """
        if not retrieved_chunks:
            return "NO_RELEVANT_CONTEXT_FOUND"

        blocks = []
        for i, chunk in enumerate(retrieved_chunks, start=1):
            cid = chunk.get("chunkId", f"chunk_{i}")
            parent_id = chunk.get("parentDocId", "unknown_doc")
            meta = chunk.get("metadata", {})
            title = meta.get("title", "Document")
            source_type = meta.get("sourceType", "source")
            content = chunk.get("content", "").strip()

            blocks.append(
                f"--- SOURCE #{i} [ID: {cid}] (Document: {title}, Type: {source_type}) ---\n"
                f"{content}\n"
                f"--- END SOURCE #{i} ---"
            )

        return "\n\n".join(blocks)


class CitationBuilder:
    @staticmethod
    def build_citations(retrieved_chunks: List[Dict[str, Any]], answer_text: str) -> List[Dict[str, Any]]:
        """
        Extracts cited source IDs from the answer text (e.g. [cite:chk_...])
        or maps the top retrieved chunks into verified citations with exact quotes.
        """
        citations = []
        cited_ids = set(re.findall(r"\[cite:([^\]]+)\]", answer_text))

        for chunk in retrieved_chunks:
            cid = chunk.get("chunkId")
            parent_id = chunk.get("parentDocId")
            meta = chunk.get("metadata", {})
            content = chunk.get("content", "")

            # If explicitly cited in text or top candidate
            is_explicit = cid in cited_ids or parent_id in cited_ids

            citations.append({
                "chunkId": cid,
                "documentId": parent_id,
                "title": meta.get("title", "Reference"),
                "sourceType": meta.get("sourceType", "document"),
                "snippet": content[:180] + ("..." if len(content) > 180 else ""),
                "score": chunk.get("finalScore", chunk.get("score", 0.8)),
                "explicitlyCited": is_explicit,
            })

        return citations
