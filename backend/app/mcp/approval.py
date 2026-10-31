"""
Adora AI — MCP Human-in-the-Loop Approval Manager
Tracks pending, approved, and rejected approvals for consequential tool actions.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List


class ApprovalRecord:
    def __init__(
        self,
        approval_id: str,
        user_id: str,
        tool_name: str,
        arguments: Dict[str, Any],
        rationale: str,
        status: str = "AWAITING_APPROVAL",  # AWAITING_APPROVAL, APPROVED, REJECTED
    ):
        self.approval_id = approval_id
        self.user_id = user_id
        self.tool_name = tool_name
        self.arguments = arguments
        self.rationale = rationale
        self.status = status
        self.created_at = datetime.utcnow().isoformat()
        self.decided_at: Optional[str] = None
        self.decision_reason: Optional[str] = None

    def approve(self, reason: Optional[str] = None):
        self.status = "APPROVED"
        self.decided_at = datetime.utcnow().isoformat()
        self.decision_reason = reason or "User confirmed execution."

    def reject(self, reason: Optional[str] = None):
        self.status = "REJECTED"
        self.decided_at = datetime.utcnow().isoformat()
        self.decision_reason = reason or "User rejected execution."

    def to_dict(self) -> Dict[str, Any]:
        return {
            "approvalId": self.approval_id,
            "userId": self.user_id,
            "toolName": self.tool_name,
            "arguments": self.arguments,
            "rationale": self.rationale,
            "status": self.status,
            "createdAt": self.created_at,
            "decidedAt": self.decided_at,
            "decisionReason": self.decision_reason,
        }


class ApprovalManager:
    def __init__(self):
        # Maps approval_id -> ApprovalRecord
        self._records: Dict[str, ApprovalRecord] = {}

    def request_approval(
        self,
        user_id: str,
        tool_name: str,
        arguments: Dict[str, Any],
        rationale: str,
    ) -> ApprovalRecord:
        approval_id = f"appr_{uuid.uuid4().hex[:8]}"
        rec = ApprovalRecord(
            approval_id=approval_id,
            user_id=user_id,
            tool_name=tool_name,
            arguments=arguments,
            rationale=rationale,
        )
        self._records[approval_id] = rec
        return rec

    def get_approval(self, approval_id: str) -> Optional[ApprovalRecord]:
        return self._records.get(approval_id)

    def is_approved(self, approval_id: str) -> bool:
        rec = self._records.get(approval_id)
        return bool(rec and rec.status == "APPROVED")

    def list_pending(self, user_id: str) -> List[Dict[str, Any]]:
        return [
            r.to_dict() for r in self._records.values()
            if r.user_id == user_id and r.status == "AWAITING_APPROVAL"
        ]


approval_manager = ApprovalManager()
