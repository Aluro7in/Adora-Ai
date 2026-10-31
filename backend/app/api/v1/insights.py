"""
Adora AI — Insights & Pattern Routes
"""

import uuid
from typing import List
from fastapi import APIRouter, Depends, Path
from datetime import datetime
from app.core.security import UserContext, get_current_user
from app.schemas.insight import InsightResponse, InsightStatusUpdate
from app.schemas.common import ApiResponse
from app.repositories.firestore_repo import firestore_repo

router = APIRouter()


@router.get("", response_model=ApiResponse[List[InsightResponse]])
async def list_insights(user: UserContext = Depends(get_current_user)):
    items = await firestore_repo.list_insights(user.uid)
    return ApiResponse(success=True, data=items)


@router.post("/discover")
async def discover_insights(user: UserContext = Depends(get_current_user)):
    user_refs = await firestore_repo.list_reflections(user.uid)
    if not user_refs:
        return ApiResponse(
            success=True,
            data={"candidateInsights": [], "message": "No reflections found yet. Record entries first."},
        )

    now = datetime.utcnow().isoformat()
    candidate = {
        "id": f"ins_{uuid.uuid4().hex[:8]}",
        "userId": user.uid,
        "title": "Focused Strategic Cadence",
        "hypothesis": "Consistent reflection correlates with reduced friction during goal execution.",
        "description": "Multi-reflection cluster synthesis indicates improved operational momentum.",
        "supportingEvidence": [
            {
                "reflectionId": user_refs[0]["id"],
                "quote": user_refs[0].get("rawText", "")[:80] + "...",
                "timestamp": user_refs[0].get("createdAt", now),
            }
        ],
        "counterEvidence": [],
        "confidenceScore": 0.85,
        "status": "candidate",
        "userNotes": None,
        "createdAt": now,
        "updatedAt": now,
    }
    await firestore_repo.save_insight(user.uid, candidate)
    return ApiResponse(success=True, data={"candidateInsights": [candidate]})


@router.patch("/{insight_id}/status", response_model=ApiResponse[InsightResponse])
async def update_insight_status(
    payload: InsightStatusUpdate,
    insight_id: str = Path(...),
    user: UserContext = Depends(get_current_user),
):
    target = await firestore_repo.update_insight_status(user.uid, insight_id, payload.status, payload.user_notes)
    if not target:
        return ApiResponse(success=False, error={"code": "RESOURCE_NOT_FOUND", "message": "Insight not found"})

    return ApiResponse(success=True, data=target)

