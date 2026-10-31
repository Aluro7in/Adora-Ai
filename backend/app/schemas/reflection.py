"""
Adora AI — Reflection Schemas
Supports Pydantic with standard library fallback.
"""

from typing import List, Optional
from datetime import datetime

try:
    from pydantic import BaseModel, Field
    _has_pydantic = True
except ImportError:
    _has_pydantic = False

    class BaseModel:
        def __init__(self, **kwargs):
            # Support alias assignment
            aliases = {
                "rawText": "raw_text",
                "moodRating": "mood_rating",
                "energyRating": "energy_rating",
                "sourceType": "source_type",
                "analysisState": "analysis_state",
                "extractedEntities": "extracted_entities",
                "createdAt": "created_at",
                "updatedAt": "updated_at",
                "userId": "user_id",
            }
            for k, v in kwargs.items():
                target_key = aliases.get(k, k)
                setattr(self, target_key, v)

        def model_dump(self):
            return {k: v for k, v in self.__dict__.items() if not k.startswith("_")}

    def Field(default=None, default_factory=None, **kwargs):
        if default_factory:
            return default_factory()
        return default


class ExtractedEntities(BaseModel):
    events: List[str] = Field(default_factory=list)
    decisions: List[str] = Field(default_factory=list)
    goals: List[str] = Field(default_factory=list)
    obstacles: List[str] = Field(default_factory=list)
    lessons: List[str] = Field(default_factory=list)
    themes: List[str] = Field(default_factory=list)
    questions: List[str] = Field(default_factory=list)


class ReflectionCreate(BaseModel):
    raw_text: str = Field(..., alias="rawText")
    category: str = "personal"
    tags: List[str] = Field(default_factory=list)
    mood_rating: Optional[int] = Field(None, alias="moodRating")
    energy_rating: Optional[int] = Field(None, alias="energyRating")
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
