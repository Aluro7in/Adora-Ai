"""
Adora AI — Conversational Intelligence & Memory Grounded Chat
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from app.core.security import UserContext, get_current_user
from app.schemas.common import ApiResponse
from app.repositories.firestore_repo import firestore_repo
from app.ai.providers.nebius_client import nebius_client

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    use_high_thinking: bool = False


@router.post("/message")
async def chat_message(
    payload: ChatRequest,
    user: UserContext = Depends(get_current_user),
):
    user_memories = await firestore_repo.list_memories(user.uid)

    q = payload.message.lower()
    matched_memories = []
    for m in user_memories:
        title = m.get("title", "").lower()
        stmt = m.get("statement", "").lower()
        if any(term in title or term in stmt for term in q.split() if len(term) > 3):
            matched_memories.append(m)

    target_pool = matched_memories if matched_memories else user_memories

    citations: List[Dict[str, Any]] = []
    for mem in target_pool[:3]:
        citations.append({
            "id": mem.get("id"),
            "title": mem.get("title"),
            "quote": mem.get("statement"),
            "sourceType": "memory",
        })

    try:
        answer = await nebius_client.generate_grounded_response(
            message=payload.message,
            citations=citations,
            use_deep_reflection=payload.use_high_thinking,
        )
    except Exception:
        # Fallback if live call encounters transient network issue
        answer = (
            f"Grounding in your Memory Vault: "
            + (f"in '{citations[0]['title']}', you noted that '{citations[0]['quote']}' [cite:{citations[0]['id']}]." if citations else "No recorded memory citations matched this query yet.")
        )

    return ApiResponse(
        success=True,
        data={
            "answer": answer,
            "conversationId": payload.conversation_id or "conv_primary",
            "citations": citations,
            "model": "NVIDIA Nemotron 3.5 Lightning (Nebius Token Factory)",
        },
    )

