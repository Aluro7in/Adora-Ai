"""
Adora AI — Reflections API Routes
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path
from datetime import datetime
from app.core.security import UserContext, get_current_user
from app.schemas.reflection import ReflectionCreate, ReflectionResponse
from app.schemas.common import ApiResponse
from app.ai.providers.nebius_client import nebius_client
from app.repositories.firestore_repo import firestore_repo

router = APIRouter()


@router.get("", response_model=ApiResponse[List[ReflectionResponse]])
async def list_reflections(
    category: Optional[str] = Query(None),
    user: UserContext = Depends(get_current_user),
):
    items = await firestore_repo.list_reflections(user.uid)
    if category and category != "all":
        items = [r for r in items if r.get("category") == category]
    return ApiResponse(success=True, data=items)


@router.post("", response_model=ApiResponse[ReflectionResponse])
async def create_reflection(
    payload: ReflectionCreate,
    user: UserContext = Depends(get_current_user),
):
    now = datetime.utcnow().isoformat()
    new_id = f"ref_{uuid.uuid4().hex[:8]}"

    doc = {
        "id": new_id,
        "userId": user.uid,
        "rawText": payload.raw_text,
        "category": payload.category,
        "tags": payload.tags,
        "moodRating": payload.mood_rating,
        "energyRating": payload.energy_rating,
        "sourceType": payload.source_type,
        "analysisState": "pending",
        "extractedEntities": {
            "events": [],
            "decisions": [],
            "goals": [],
            "obstacles": [],
            "lessons": [],
            "themes": payload.tags,
            "questions": [],
        },
        "createdAt": now,
        "updatedAt": now,
    }
    await firestore_repo.save_reflection(user.uid, doc)
    return ApiResponse(success=True, data=doc)


@router.post("/{reflection_id}/extract", response_model=ApiResponse[dict])
async def extract_reflection(
    reflection_id: str = Path(...),
    user: UserContext = Depends(get_current_user),
):
    items = await firestore_repo.list_reflections(user.uid)
    target = next((r for r in items if r["id"] == reflection_id and r["userId"] == user.uid), None)
    if not target:
        return ApiResponse(success=False, error={"code": "RESOURCE_NOT_FOUND", "message": "Reflection not found"})

    extracted = await nebius_client.extract_reflection_entities(target["rawText"])
    target["extractedEntities"] = extracted
    target["analysisState"] = "analyzed"
    target["updatedAt"] = datetime.utcnow().isoformat()
    await firestore_repo.save_reflection(user.uid, target)

    return ApiResponse(
        success=True,
        data={
            "extractedEntities": extracted,
            "modelMetadata": {
                "provider": "Nebius Token Factory",
                "model": nebius_client.model,
            },
        },
    )
