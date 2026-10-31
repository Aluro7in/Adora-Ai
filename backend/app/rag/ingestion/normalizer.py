"""
Adora AI — Text Normalizer
Normalizes unicode, strips invisible and control characters, and standardizes whitespaces.
"""

import re
import unicodedata


class TextNormalizer:
    @staticmethod
    def normalize(text: str) -> str:
        """
        Normalizes input text:
        - Unicode normalization (NFKC)
        - Replaces non-standard whitespace and tabs
        - Removes unprintable control characters except newlines
        - Normalizes multiple consecutive line breaks
        """
        if not text:
            return ""

        # NFKC Unicode normalization
        normalized = unicodedata.normalize("NFKC", text)

        # Replace non-breaking spaces and zero-width spaces
        normalized = normalized.replace("\u00a0", " ").replace("\u200b", "").replace("\ufeff", "")

        # Remove control characters except standard whitespace (\n, \r, \t)
        normalized = "".join(ch for ch in normalized if unicodedata.category(ch)[0] != "C" or ch in "\n\r\t")

        # Standardize horizontal whitespace and remove tabs
        normalized = normalized.replace("\t", " ")

        # Standardize carriage returns to standard newlines
        normalized = normalized.replace("\r\n", "\n").replace("\r", "\n")

        # Strip trailing horizontal whitespace on each line
        normalized = re.sub(r"[ ]+\n", "\n", normalized)

        # Collapse excess empty lines (max 2 consecutive newlines)
        normalized = re.sub(r"\n{3,}", "\n\n", normalized)

        # Strip trailing and leading whitespace
        return normalized.strip()
