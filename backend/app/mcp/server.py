"""
Adora AI — Official Model Context Protocol (MCP) Server
Streamable HTTP JSON-RPC 2.0 implementation adhering to MCP Specification 2024-11-05.
"""

from typing import Dict, Any, Optional
from app.mcp.schemas import JSONRPCRequest, JSONRPCResponse
from app.mcp.registry import mcp_tool_registry
from app.mcp.handlers.resources_and_prompts import MCPResourceHandlers, MCPPromptHandlers
from app.mcp.permissions import PermissionDeniedError, ApprovalRequiredError
from app.core.logging import logger

PROTOCOL_VERSION = "2024-11-05"


class MCPServer:
    def __init__(self, name: str = "Adora AI MCP Server", version: str = "1.0.0"):
        self.name = name
        self.version = version
        self.registry = mcp_tool_registry

    async def handle_request(
        self,
        request_dict: Dict[str, Any],
        user_id: str = "usr_adora_local",
        origin: Optional[str] = None,
        is_approved: bool = False,
    ) -> Dict[str, Any]:
        """
        Dispatches JSON-RPC 2.0 MCP requests.
        """
        req_id = request_dict.get("id")
        method = request_dict.get("method")
        params = request_dict.get("params") or {}

        # 1. DNS Rebinding origin validation
        if origin and not self._is_permitted_origin(origin):
            return JSONRPCResponse(
                id=req_id,
                error={"code": -32600, "message": f"Forbidden HTTP Origin: {origin}"},
            ).model_dump()

        try:
            # 2. Method routing
            if method == "initialize":
                client_version = params.get("protocolVersion", PROTOCOL_VERSION)
                result = {
                    "protocolVersion": PROTOCOL_VERSION,
                    "capabilities": {
                        "tools": {"listChanged": False},
                        "resources": {"subscribe": False, "listChanged": False},
                        "prompts": {"listChanged": False},
                    },
                    "serverInfo": {
                        "name": self.name,
                        "version": self.version,
                    },
                }
                return JSONRPCResponse(id=req_id, result=result).model_dump()

            elif method == "tools/list":
                tools = self.registry.list_tools()
                result = {"tools": [t.model_dump() for t in tools]}
                return JSONRPCResponse(id=req_id, result=result).model_dump()

            elif method == "tools/call":
                tool_name = params.get("name")
                arguments = params.get("arguments") or {}
                call_res = await self.registry.invoke_tool(
                    tool_name=tool_name,
                    user_id=user_id,
                    arguments=arguments,
                    is_approved=is_approved,
                )
                return JSONRPCResponse(id=req_id, result=call_res.model_dump()).model_dump()

            elif method == "resources/list":
                resources = MCPResourceHandlers.list_resources()
                result = {"resources": [r.model_dump() for r in resources]}
                return JSONRPCResponse(id=req_id, result=result).model_dump()

            elif method == "resources/read":
                uri = params.get("uri")
                read_res = await MCPResourceHandlers.read_resource(user_id=user_id, uri=uri)
                return JSONRPCResponse(id=req_id, result=read_res).model_dump()

            elif method == "prompts/list":
                prompts = MCPPromptHandlers.list_prompts()
                result = {"prompts": [p.model_dump() for p in prompts]}
                return JSONRPCResponse(id=req_id, result=result).model_dump()

            elif method == "prompts/get":
                name = params.get("name")
                args = params.get("arguments") or {}
                prompt_res = await MCPPromptHandlers.get_prompt(user_id=user_id, name=name, arguments=args)
                return JSONRPCResponse(id=req_id, result=prompt_res).model_dump()

            elif method == "ping":
                return JSONRPCResponse(id=req_id, result={}).model_dump()

            else:
                return JSONRPCResponse(
                    id=req_id,
                    error={"code": -32601, "message": f"Method '{method}' not found on this MCP server."},
                ).model_dump()

        except PermissionDeniedError as pe:
            return JSONRPCResponse(
                id=req_id,
                error={"code": -32001, "message": f"Permission Denied: {str(pe)}"},
            ).model_dump()
        except ApprovalRequiredError as ae:
            return JSONRPCResponse(
                id=req_id,
                error={"code": -32002, "message": f"Approval Required: {str(ae)}"},
            ).model_dump()
        except Exception as e:
            logger.error(f"MCP Server JSON-RPC Error: {e}")
            return JSONRPCResponse(
                id=req_id,
                error={"code": -32603, "message": f"Internal RPC Error: {str(e)}"},
            ).model_dump()

    def _is_permitted_origin(self, origin: str) -> bool:
        """Protects against DNS rebinding attacks."""
        origin_clean = origin.lower()
        allowed = ["localhost", "127.0.0.1", "0.0.0.0", "run.app", "google.com"]
        return any(domain in origin_clean for domain in allowed)


mcp_server = MCPServer()
