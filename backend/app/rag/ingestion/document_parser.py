"""
Adora AI — Document Parser
Extracts clean text and structural headers from TXT, Markdown, JSON, PDF, and DOCX documents.
"""

import re
import json
from typing import Dict, Any, List, Optional


class DocumentParseResult:
    def __init__(
        self,
        raw_text: str,
        title: Optional[str] = None,
        headings: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.raw_text = raw_text
        self.title = title or "Untitled Document"
        self.headings = headings or []
        self.metadata = metadata or {}


class DocumentParser:
    SUPPORTED_EXTENSIONS = [".txt", ".md", ".markdown", ".json", ".pdf", ".docx"]
    MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB limit

    @classmethod
    def parse(
        cls,
        content: bytes,
        filename: str,
        mime_type: Optional[str] = None
    ) -> DocumentParseResult:
        """
        Parses uploaded byte content into DocumentParseResult based on file extension and mime type.
        """
        if len(content) > cls.MAX_FILE_BYTES:
            raise ValueError(
                f"File size ({len(content)} bytes) exceeds maximum permitted limit ({cls.MAX_FILE_BYTES} bytes)."
            )

        lower_name = filename.lower()
        extracted_text = ""
        headings = []
        doc_title = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

        if lower_name.endswith((".txt", ".text")):
            extracted_text = content.decode("utf-8", errors="replace")

        elif lower_name.endswith((".md", ".markdown")):
            extracted_text = content.decode("utf-8", errors="replace")
            # Extract markdown headings (# Heading)
            found_headings = re.findall(r"^#{1,6}\s+(.+)$", extracted_text, flags=re.MULTILINE)
            if found_headings:
                headings = found_headings
                doc_title = found_headings[0]

        elif lower_name.endswith(".json"):
            try:
                parsed_json = json.loads(content.decode("utf-8", errors="replace"))
                if isinstance(parsed_json, dict):
                    doc_title = parsed_json.get("title", doc_title)
                    extracted_text = json.dumps(parsed_json, indent=2)
                elif isinstance(parsed_json, list):
                    extracted_text = json.dumps(parsed_json, indent=2)
                else:
                    extracted_text = str(parsed_json)
            except Exception as e:
                extracted_text = content.decode("utf-8", errors="replace")

        elif lower_name.endswith(".pdf"):
            # Text extraction: decode stream and extract readable strings and formatting
            decoded = content.decode("latin1", errors="ignore")
            # Extract plain text chunks from PDF streams
            stream_matches = re.findall(r"\((.*?)\)\s*Tj", decoded)
            if stream_matches:
                extracted_text = " ".join(stream_matches)
            else:
                # Clean readable ASCII/UTF-8 character extraction
                extracted_text = re.sub(r"[^\x20-\x7E\n\r\t]", " ", decoded)
                extracted_text = re.sub(r"\s+", " ", extracted_text).strip()

        elif lower_name.endswith(".docx"):
            # Clean readable text from zip/xml contents
            decoded = content.decode("latin1", errors="ignore")
            xml_text = re.findall(r"<w:t[^>]*>(.*?)</w:t>", decoded)
            if xml_text:
                extracted_text = " ".join(xml_text)
            else:
                extracted_text = re.sub(r"<[^>]+>", " ", decoded)
                extracted_text = re.sub(r"\s+", " ", extracted_text).strip()

        else:
            # Fallback to UTF-8 decoding
            extracted_text = content.decode("utf-8", errors="replace")

        return DocumentParseResult(
            raw_text=extracted_text,
            title=doc_title,
            headings=headings,
            metadata={"filename": filename, "mime_type": mime_type, "byte_size": len(content)},
        )
