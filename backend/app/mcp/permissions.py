"""
Adora AI — MCP Permissions & Authorization Policy
Binds authenticated user UID and enforces read/write security boundaries.
"""

from typing import Dict, Any, Optional
from app.mcp.schemas import ConsequentialityTier, MCPToolDefinition


class PermissionDeniedError(Exception):
    """Raised when an MCP tool invocation violates user isolation or scope boundaries."""
    pass


class ApprovalRequiredError(Exception):
    """Raised when an action is Tier 2 Consequential and has not been approved."""
    pass


class MCPPermissionEngine:
    @staticmethod
    def enforce_boundaries(
        user_id: str,
        tool: MCPToolDefinition,
        arguments: Dict[str, Any],
        is_approved: bool = False,
    ):
        """
        Validates:
        1. User ID presence (UID cannot be overridden or forged in arguments)
        2. Tier 2 consequentiality requirement for approval
        """
        if not user_id:
            raise PermissionDeniedError("Unauthenticated request: user_id is required.")

        # Prevent prompt injection from providing a different user_id
        if "userId" in arguments and arguments["userId"] != user_id:
            raise PermissionDeniedError("Cross-user access violation: Supplied userId does not match authenticated token.")
        if "user_id" in arguments and arguments["user_id"] != user_id:
            raise PermissionDeniedError("Cross-user access violation: Supplied user_id does not match authenticated token.")

        # Consequential action gating
        if tool.consequentialityTier == ConsequentialityTier.TIER_2_CONSEQUENTIAL and not is_approved:
            raise ApprovalRequiredError(
                f"Action '{tool.name}' is Tier 2 Consequential and requires explicit user approval before execution."
            )
