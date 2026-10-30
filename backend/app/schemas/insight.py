"""
Adora AI — Insight & Pattern Schemas
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class EvidenceRef(BaseModel):
    reflection_id: str = Field(..., alias="reflectionId")
    quote: str
    timestamp: str


class InsightResponse(BaseModel):
    id: str
    user_id: str = Field(..., alias="userId")
    title: str
    hypothesis: str
    description: str
    supporting_evidence: List[EvidenceRef] = Field(default_factory=list, alias="supportingEvidence")
    counter_evidence: List[EvidenceRef] = Field(default_factory=list, alias="counterEvidence")
    confidence_score: float = Field(0.8, alias="confidenceScore")
    status: str = "candidate"  # candidate, confirmed, dismissed, refined
    user_notes: Optional[str] = Field(None, alias="userNotes")
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), alias="createdAt")
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), alias="updatedAt")

    class Config:
        populate_by_name = True


class InsightStatusUpdate(BaseModel):
    status: str
    user_notes: Optional[str] = Field(None, alias="userNotes")
