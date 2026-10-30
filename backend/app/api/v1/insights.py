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
from app.api.v1.reflections import _reflections_db

router = APIRouter()
_insights_db = []


@router.get("", response_model=ApiResponse[List[InsightResponse]])
async def list_insights(user: UserContext = Depends(get_current_user)):
    items = [i for i in _insights_db if i["userId"] == user.uid]
    return ApiResponse(success=True, data=items)


@router.post("/discover")
async def discover_insights(user: UserContext = Depends(get_current_user)):
    user_refs = [r for r in _reflections_db if r["userId"] == user.uid]
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
                "quote": user_refs[0]["rawText"][:80] + "...",
                "timestamp": user_refs[0]["createdAt"],
            }
        ],
        "counterEvidence": [],
        "confidenceScore": 0.85,
        "status": "candidate",
        "userNotes": None,
        "createdAt": now,
        "updatedAt": now,
    }
    _insights_db.insert(0, candidate)
    return ApiResponse(success=True, data={"candidateInsights": [candidate]})


@router.patch("/{insight_id}/status", response_model=ApiResponse[InsightResponse])
async def update_insight_status(
    payload: InsightStatusUpdate,
    insight_id: str = Path(...),
    user: UserContext = Depends(get_current_user),
):
    target = next((i for i in _insights_db if i["id"] == insight_id and i["userId"] == user.uid), None)
    if not target:
        return ApiResponse(success=False, error={"code": "RESOURCE_NOT_FOUND", "message": "Insight not found"})

    target["status"] = payload.status
    if payload.user_notes is not None:
        target["userNotes"] = payload.user_notes
    target["updatedAt"] = datetime.utcnow().isoformat()

    return ApiResponse(success=True, data=target)
