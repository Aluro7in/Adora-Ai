"""
Adora AI — Common Response Schemas
"""

from typing import Generic, Optional, TypeVar, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar("T")


class ApiErrorDetail(BaseModel):
    code: str
    message: str
    correlation_id: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    details: Optional[Dict[str, Any]] = None


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    error: Optional[ApiErrorDetail] = None
