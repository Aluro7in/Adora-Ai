"""
Adora AI — Memory Vault Schemas
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class MemoryCreate(BaseModel):
    type: str = "semantic"  # episodic, semantic, relational, procedural
    title: str = Field(..., min_length=2, max_length=150)
    statement: str = Field(..., min_length=5, max_length=3000)
    detailed_context: Optional[str] = Field(None, alias="detailedContext")
    source_reflection_ids: List[str] = Field(default_factory=list, alias="sourceReflectionIds")
    user_approval_state: str = Field("approved", alias="userApprovalState")
    tags: List[str] = Field(default_factory=list)


class MemoryResponse(BaseModel):
    id: str
    user_id: str = Field(..., alias="userId")
    type: str
    title: str
    statement: str
    detailed_context: Optional[str] = Field(None, alias="detailedContext")
    source_reflection_ids: List[str] = Field(default_factory=list, alias="sourceReflectionIds")
    user_approval_state: str = Field("approved", alias="userApprovalState")
    confidence_score: float = Field(0.9, alias="confidenceScore")
    tags: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), alias="createdAt")
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), alias="updatedAt")

    class Config:
        populate_by_name = True


class MemorySearchRequest(BaseModel):
    query: str
    types: Optional[List[str]] = None
    top_k: int = Field(5, alias="topK")
