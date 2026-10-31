"""
Adora AI — MCP Package Initialization
"""

from app.mcp.schemas import (
    JSONRPCRequest,
    JSONRPCResponse,
    MCPToolDefinition,
    MCPResourceDefinition,
    MCPPromptDefinition,
    ConsequentialityTier,
    ToolCallResult,
)
from app.mcp.permissions import MCPPermissionEngine, PermissionDeniedError, ApprovalRequiredError
from app.mcp.approval import approval_manager, ApprovalManager, ApprovalRecord
from app.mcp.audit import mcp_audit_ledger, MCPAuditLedger, MCPAuditEvent
from app.mcp.registry import mcp_tool_registry, MCPToolRegistry
from app.mcp.server import mcp_server, MCPServer
from app.mcp.client import mcp_client, MCPClient

__all__ = [
    "JSONRPCRequest",
    "JSONRPCResponse",
    "MCPToolDefinition",
    "MCPResourceDefinition",
    "MCPPromptDefinition",
    "ConsequentialityTier",
    "ToolCallResult",
    "MCPPermissionEngine",
    "PermissionDeniedError",
    "ApprovalRequiredError",
    "approval_manager",
    "ApprovalManager",
    "ApprovalRecord",
    "mcp_audit_ledger",
    "MCPAuditLedger",
    "MCPAuditEvent",
    "mcp_tool_registry",
    "MCPToolRegistry",
    "mcp_server",
    "MCPServer",
    "mcp_client",
    "MCPClient",
]
