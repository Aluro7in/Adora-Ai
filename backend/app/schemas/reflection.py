"""
Adora AI — Reflection Schemas
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class ExtractedEntities(BaseModel):
    events: List[str] = Field(default_factory=list)
    decisions: List[str] = Field(default_factory=list)
    goals: List[str] = Field(default_factory=list)
    obstacles: List[str] = Field(default_factory=list)
    lessons: List[str] = Field(default_factory=list)
    themes: List[str] = Field(default_factory=list)
    questions: List[str] = Field(default_factory=list)


class ReflectionCreate(BaseModel):
    raw_text: str = Field(..., alias="rawText", min_length=1, max_length=10000)
    category: str = "personal"
    tags: List[str] = Field(default_factory=list)
    mood_rating: Optional[int] = Field(None, alias="moodRating", ge=1, le=5)
    energy_rating: Optional[int] = Field(None, alias="energyRating", ge=1, le=5)
    source_type: str = Field("text", alias="sourceType")


class ReflectionResponse(BaseModel):
    id: str
    user_id: str = Field(..., alias="userId")
    raw_text: str = Field(..., alias="rawText")
    category: str
    tags: List[str] = Field(default_factory=list)
    mood_rating: Optional[int] = Field(None, alias="moodRating")
    energy_rating: Optional[int] = Field(None, alias="energyRating")
    source_type: str = Field("text", alias="sourceType")
    analysis_state: str = Field("pending", alias="analysisState")
    extracted_entities: ExtractedEntities = Field(default_factory=ExtractedEntities, alias="extractedEntities")
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), alias="createdAt")
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), alias="updatedAt")

    class Config:
        populate_by_name = True
