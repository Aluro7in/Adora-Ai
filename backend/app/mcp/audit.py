"""
Adora AI — MCP Execution Audit Ledger
Cryptographic SHA-256 hash digests of tool inputs and outputs.
"""

import json
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional


class MCPAuditEvent:
    def __init__(
        self,
        event_id: str,
        user_id: str,
        tool_name: str,
        input_payload_hash: str,
        output_payload_hash: str,
        status: str,
        duration_ms: float,
        verification_status: str = "VERIFIED",
    ):
        self.event_id = event_id
        self.user_id = user_id
        self.tool_name = tool_name
        self.input_payload_hash = input_payload_hash
        self.output_payload_hash = output_payload_hash
        self.status = status
        self.duration_ms = duration_ms
        self.verification_status = verification_status
        self.timestamp = datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "eventId": self.event_id,
            "userId": self.user_id,
            "toolName": self.tool_name,
            "inputPayloadHash": self.input_payload_hash,
            "outputPayloadHash": self.output_payload_hash,
            "status": self.status,
            "durationMs": self.duration_ms,
            "verificationStatus": self.verification_status,
            "timestamp": self.timestamp,
        }


class MCPAuditLedger:
    def __init__(self):
        self._events: List[MCPAuditEvent] = []

    def record_call(
        self,
        event_id: str,
        user_id: str,
        tool_name: str,
        arguments: Dict[str, Any],
        output: Any,
        status: str,
        duration_ms: float,
        verification_status: str = "VERIFIED",
    ) -> MCPAuditEvent:
        input_hash = hashlib.sha256(json.dumps(arguments, sort_keys=True).encode("utf-8")).hexdigest()
        output_hash = hashlib.sha256(json.dumps(output, sort_keys=True, default=str).encode("utf-8")).hexdigest()

        event = MCPAuditEvent(
            event_id=event_id,
            user_id=user_id,
            tool_name=tool_name,
            input_payload_hash=input_hash,
            output_payload_hash=output_hash,
            status=status,
            duration_ms=duration_ms,
            verification_status=verification_status,
        )
        self._events.insert(0, event)
        return event

    def list_events(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        return [e.to_dict() for e in self._events if e.user_id == user_id][:limit]


mcp_audit_ledger = MCPAuditLedger()
