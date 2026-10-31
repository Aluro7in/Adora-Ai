"""
Adora AI — Embedding Dimension Validation
Validates vector dimensions against supported Firestore and model constraints.
"""

from typing import List, Optional

SUPPORTED_DIMENSIONS = {
    "nebius": [768, 1024, 1536, 4096],
    "google": [768, 1536],
    "firestore_max": 2048,
}


class DimensionValidationError(ValueError):
    """Raised when vector embedding dimensions do not match the expected index specification."""
    pass


def validate_embedding_dimensions(
    embedding: List[float],
    expected_dim: int,
    provider: str = "nebius"
) -> bool:
    """
    Validates that the provided embedding vector matches expected dimension length
    and does not contain NaNs, infinities, or all-zero vectors.
    """
    if not isinstance(embedding, list) or len(embedding) == 0:
        raise DimensionValidationError("Embedding must be a non-empty list of floats.")

    actual_dim = len(embedding)
    if actual_dim != expected_dim:
        raise DimensionValidationError(
            f"Embedding dimension mismatch: expected {expected_dim}, got {actual_dim} from provider '{provider}'."
        )

    # Check for all-zeros (invalid fake vector)
    if all(v == 0.0 for v in embedding):
        raise DimensionValidationError("Degenerate vector: All embedding elements are 0.0.")

    # Check for non-finite values
    for val in embedding:
        if val != val or abs(val) == float("inf"):
            raise DimensionValidationError("Vector contains invalid NaN or Infinity values.")

    return True
