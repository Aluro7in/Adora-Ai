"""
Adora AI — Agent Context Manager & Task Decomposer
Retrieves user memories, active reflections, and approved context prior to planning.
"""

from typing import Dict, Any, List, Optional
from app.repositories.firestore_repo import firestore_repo
from app.rag.retrieval.hybrid_retriever import hybrid_retriever


class AgentContextManager:
    @staticmethod
    async def assemble_context_for_goal(user_id: str, goal: str) -> str:
        """
        Retrieves relevant episodic and procedural memories to ground goal planning.
        """
        memories = await firestore_repo.list_memories(user_id)
        relevant_memories = [
            m for m in memories
            if m.get("userApprovalState") == "approved" and (
                any(w in m.get("title", "").lower() for w in goal.lower().split() if len(w) > 3) or
                m.get("type") == "procedural"
            )
        ]

        if not relevant_memories:
            return "No previous approved procedural memories found for this goal."

        context_lines = ["Relevant Approved Memories & Principles:"]
        for m in relevant_memories[:3]:
            context_lines.append(f"- [{m.get('type')}] {m.get('title')}: {m.get('statement')}")

        return "\n".join(context_lines)


class TaskDecomposer:
    @staticmethod
    def create_task_definition(
        user_id: str,
        workflow_id: str,
        title: str,
        description: str,
        tool_name: str,
        tool_arguments: Dict[str, Any],
        dependencies: Optional[List[str]] = None,
        consequentiality_tier: int = 0,
    ) -> Dict[str, Any]:
        import uuid
        from datetime import datetime

        now = datetime.utcnow().isoformat()
        return {
            "id": f"tsk_{uuid.uuid4().hex[:8]}",
            "userId": user_id,
            "workflowId": workflow_id,
            "title": title,
            "description": description,
            "toolName": tool_name,
            "toolArguments": tool_arguments,
            "dependencies": dependencies or [],
            "consequentialityTier": consequentiality_tier,
            "status": "AWAITING_APPROVAL" if consequentiality_tier == 2 else "PLANNED",
            "createdAt": now,
            "updatedAt": now,
        }
