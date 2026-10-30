"""
Adora AI — Conversational Intelligence & Memory Grounded Chat
"""

from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from app.core.security import UserContext, get_current_user
from app.schemas.common import ApiResponse
from app.api.v1.memories import _memories_db

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
    user_memories = [m for m in _memories_db if m["userId"] == user.uid]

    citations = []
    if user_memories:
        top = user_memories[0]
        citations.append({
            "id": top["id"],
            "title": top["title"],
            "quote": top["statement"],
            "sourceType": "memory",
        })

    answer = f"I hear you regarding '{payload.message.strip()}'. "
    if citations:
        answer += f"Grounding in your Memory Vault: in '{citations[0]['title']}', you noted that '{citations[0]['quote']}' [cite:{citations[0]['id']}]."
    else:
        answer += "Your vault currently has no stored memories for direct citation yet. Record reflections or approve candidate memories to ground future conversations in your personal history."

    return ApiResponse(
        success=True,
        data={
            "answer": answer,
            "conversationId": payload.conversation_id or "conv_primary",
            "citations": citations,
            "model": "NVIDIA Nemotron 3.5 Lightning (Nebius Token Factory)",
        },
    )
