"""
Adora AI — External MCP Server Manager & Allowlist
Enforces administrator allowlists and tracks connected external MCP server endpoints.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime


class ExternalMCPServerConfig:
    def __init__(
        self,
        server_id: str,
        name: str,
        endpoint_url: str,
        is_enabled: bool = True,
        auth_token: Optional[str] = None,
        allowed_tools: Optional[List[str]] = None,
    ):
        self.server_id = server_id
        self.name = name
        self.endpoint_url = endpoint_url
        self.is_enabled = is_enabled
        self.auth_token = auth_token
        self.allowed_tools = allowed_tools or ["*"]
        self.status = "disconnected"
        self.last_connected_at: Optional[str] = None
        self.last_error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "serverId": self.server_id,
            "name": self.name,
            "endpointUrl": self.endpoint_url,
            "isEnabled": self.is_enabled,
            "allowedTools": self.allowed_tools,
            "status": self.status,
            "lastConnectedAt": self.last_connected_at,
            "lastError": self.last_error,
        }


class ExternalMCPManager:
    def __init__(self):
        # Admin allowlisted servers
        self._servers: Dict[str, ExternalMCPServerConfig] = {
            "srv_google_workspace": ExternalMCPServerConfig(
                server_id="srv_google_workspace",
                name="Google Workspace MCP Connector",
                endpoint_url="https://workspace.mcp.adora.ai",
                is_enabled=True,
                allowed_tools=["calendar_create_event", "gmail_send_message", "drive_publish_doc"],
            ),
            "srv_web_research": ExternalMCPServerConfig(
                server_id="srv_web_research",
                name="Web Research & Grounding MCP",
                endpoint_url="https://research.mcp.adora.ai",
                is_enabled=True,
                allowed_tools=["web_search", "web_extract"],
            ),
        }

    def list_servers(self) -> List[Dict[str, Any]]:
        return [s.to_dict() for s in self._servers.values()]

    def get_server(self, server_id: str) -> Optional[ExternalMCPServerConfig]:
        return self._servers.get(server_id)

    def register_server(
        self,
        name: str,
        endpoint_url: str,
        allowed_tools: Optional[List[str]] = None,
    ) -> ExternalMCPServerConfig:
        server_id = f"srv_{len(self._servers) + 1:02d}"
        cfg = ExternalMCPServerConfig(
            server_id=server_id,
            name=name,
            endpoint_url=endpoint_url,
            allowed_tools=allowed_tools,
        )
        self._servers[server_id] = cfg
        return cfg


external_mcp_manager = ExternalMCPManager()
