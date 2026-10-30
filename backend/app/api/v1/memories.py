"""
Adora AI — Memory Vault API Routes
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from datetime import datetime
from app.core.security import UserContext, get_current_user
from app.schemas.memory import MemoryCreate, MemoryResponse, MemorySearchRequest
from app.schemas.common import ApiResponse
from app.repositories.firestore_repo import firestore_repo

router = APIRouter()


@router.get("", response_model=ApiResponse[List[MemoryResponse]])
async def list_memories(
    type: Optional[str] = Query(None),
    approval_state: Optional[str] = Query(None, alias="approvalState"),
    user: UserContext = Depends(get_current_user),
):
    items = await firestore_repo.list_memories(user.uid, memory_type=type if type != "all" else None)
    if approval_state and approval_state != "all":
        items = [m for m in items if m.get("userApprovalState") == approval_state]
    return ApiResponse(success=True, data=items)


@router.post("", response_model=ApiResponse[MemoryResponse])
async def create_memory(
    payload: MemoryCreate,
    user: UserContext = Depends(get_current_user),
):
    now = datetime.utcnow().isoformat()
    new_id = f"mem_{uuid.uuid4().hex[:8]}"

    doc = {
        "id": new_id,
        "userId": user.uid,
        "type": payload.type,
        "title": payload.title,
        "statement": payload.statement,
        "detailedContext": payload.detailed_context,
        "sourceReflectionIds": payload.source_reflection_ids,
        "userApprovalState": payload.user_approval_state,
        "confidenceScore": 0.9,
        "tags": payload.tags,
        "createdAt": now,
        "updatedAt": now,
    }
    await firestore_repo.save_memory(user.uid, doc)
    return ApiResponse(success=True, data=doc)


@router.post("/search")
async def search_memories(
    payload: MemorySearchRequest,
    user: UserContext = Depends(get_current_user),
):
    q = payload.query.lower()
    pool = await firestore_repo.list_memories(user.uid)
    if payload.types:
        pool = [m for m in pool if m.get("type") in payload.types]

    matches = []
    for mem in pool:
        score = 0.0
        if q in mem["title"].lower():
            score += 0.6
        if q in mem["statement"].lower():
            score += 0.4
        if any(q in t.lower() for t in mem.get("tags", [])):
            score += 0.3
        if score > 0:
            matches.append({
                "memory": mem,
                "score": min(1.0, score),
                "matchedBy": "keyword",
            })

    matches.sort(key=lambda x: x["score"], reverse=True)
    return ApiResponse(success=True, data={"matches": matches[:payload.top_k]})
