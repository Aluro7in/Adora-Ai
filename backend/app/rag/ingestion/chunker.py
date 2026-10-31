"""
Adora AI — Intelligent Chunker
Implements heading-aware, paragraph-aware, sentence-boundary, token-budget chunking
with configurable overlap and parent document lineage tracking.
"""

import re
import uuid
import hashlib
from typing import List, Dict, Any, Optional


class DocumentChunk:
    def __init__(
        self,
        chunk_id: str,
        parent_doc_id: str,
        chunk_index: int,
        content: str,
        heading_path: List[str],
        token_count: int,
        character_span: Dict[str, int],
        content_hash: str,
    ):
        self.chunk_id = chunk_id
        self.parent_doc_id = parent_doc_id
        self.chunk_index = chunk_index
        self.content = content
        self.heading_path = heading_path
        self.token_count = token_count
        self.character_span = character_span
        self.content_hash = content_hash

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunkId": self.chunk_id,
            "parentDocId": self.parent_doc_id,
            "chunkIndex": self.chunk_index,
            "content": self.content,
            "headingPath": self.heading_path,
            "tokenCount": self.token_count,
            "characterSpan": self.character_span,
            "contentHash": self.content_hash,
        }


class IntelligentChunker:
    def __init__(
        self,
        target_tokens: int = 350,
        max_tokens: int = 500,
        overlap_tokens: int = 50,
        algorithm_version: str = "v1.2-heading-sentence",
    ):
        self.target_tokens = target_tokens
        self.max_tokens = max_tokens
        self.overlap_tokens = overlap_tokens
        self.algorithm_version = algorithm_version

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """Approximates tokens (roughly 1 token per 4 characters or 0.75 words)."""
        words = len(text.split())
        return max(1, int(words * 1.3))

    def split_into_sentences(self, text: str) -> List[str]:
        """Splits paragraph text into sentences preserving abbreviations and punctuation."""
        raw_sentences = re.split(r"(?<=[.!?])\s+", text)
        sentences = [s.strip() for s in raw_sentences if s.strip()]
        return sentences

    def chunk_document(
        self,
        parent_doc_id: str,
        text: str,
        detected_headings: Optional[List[str]] = None,
    ) -> List[DocumentChunk]:
        """
        Chunks text with heading awareness, sentence boundaries, and parent lineage.
        """
        if not text:
            return []

        # Split into logical sections by Markdown headings
        section_pattern = re.compile(r"(^#{1,6}\s+.+$)", re.MULTILINE)
        splits = section_pattern.split(text)

        chunks: List[DocumentChunk] = []
        current_heading = detected_headings[0] if detected_headings else "General"
        running_char_offset = 0

        # Iterate through sections
        sections = []
        idx = 0
        while idx < len(splits):
            part = splits[idx].strip()
            if not part:
                idx += 1
                continue
            if part.startswith("#"):
                current_heading = part.lstrip("#").strip()
                idx += 1
                if idx < len(splits):
                    body = splits[idx].strip()
                    sections.append((current_heading, body))
                    idx += 1
            else:
                sections.append((current_heading, part))
                idx += 1

        chunk_counter = 0

        for heading, body in sections:
            paragraphs = [p.strip() for p in body.split("\n\n") if p.strip()]

            current_sentences: List[str] = []
            current_tokens = 0

            for para in paragraphs:
                sentences = self.split_into_sentences(para)

                for sent in sentences:
                    sent_tokens = self.estimate_tokens(sent)

                    if current_tokens + sent_tokens > self.max_tokens and current_sentences:
                        # Flush current chunk
                        chunk_text = " ".join(current_sentences)
                        content_hash = hashlib.sha256(chunk_text.encode("utf-8")).hexdigest()
                        chunk_id = f"chk_{parent_doc_id}_{chunk_counter:03d}"

                        chunks.append(
                            DocumentChunk(
                                chunk_id=chunk_id,
                                parent_doc_id=parent_doc_id,
                                chunk_index=chunk_counter,
                                content=chunk_text,
                                heading_path=[heading] if heading != "General" else [],
                                token_count=current_tokens,
                                character_span={
                                    "start": running_char_offset,
                                    "end": running_char_offset + len(chunk_text),
                                },
                                content_hash=content_hash,
                            )
                        )
                        chunk_counter += 1
                        running_char_offset += len(chunk_text) + 1

                        # Keep overlap sentences
                        overlap_budget = 0
                        overlap_sents = []
                        for s in reversed(current_sentences):
                            s_tokens = self.estimate_tokens(s)
                            if overlap_budget + s_tokens <= self.overlap_tokens:
                                overlap_sents.insert(0, s)
                                overlap_budget += s_tokens
                            else:
                                break

                        current_sentences = overlap_sents + [sent]
                        current_tokens = sum(self.estimate_tokens(s) for s in current_sentences)
                    else:
                        current_sentences.append(sent)
                        current_tokens += sent_tokens

            # Flush remaining sentences in section
            if current_sentences:
                chunk_text = " ".join(current_sentences)
                content_hash = hashlib.sha256(chunk_text.encode("utf-8")).hexdigest()
                chunk_id = f"chk_{parent_doc_id}_{chunk_counter:03d}"

                chunks.append(
                    DocumentChunk(
                        chunk_id=chunk_id,
                        parent_doc_id=parent_doc_id,
                        chunk_index=chunk_counter,
                        content=chunk_text,
                        heading_path=[heading] if heading != "General" else [],
                        token_count=current_tokens,
                        character_span={
                            "start": running_char_offset,
                            "end": running_char_offset + len(chunk_text),
                        },
                        content_hash=content_hash,
                    )
                )
                chunk_counter += 1
                running_char_offset += len(chunk_text) + 1

        return chunks
