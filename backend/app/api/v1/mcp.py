"""
Adora AI — MCP API Endpoints
Streamable HTTP JSON-RPC 2.0 handler and REST utilities for MCP tools and external servers.
"""

from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.mcp.server import mcp_server
from app.mcp.client import mcp_client
from app.mcp.registry import mcp_tool_registry
from app.mcp.external_servers.manager import external_mcp_manager

router = APIRouter()


class DirectToolCallRequest(BaseModel):
    toolName: str
    arguments: Dict[str, Any] = {}
    isApproved: bool = False


@router.post("")
@router.post("/")
async def handle_mcp_jsonrpc(request: Request):
    """
    Standard MCP Streamable HTTP JSON-RPC 2.0 endpoint.
    Handles initialize, tools/list, tools/call, resources/list, resources/read, prompts/list, prompts/get.
    """
    user_id = request.headers.get("X-User-ID", "usr_adora_local")
    origin = request.headers.get("Origin")

    body = await request.json()
    resp = await mcp_server.handle_request(
        request_dict=body,
        user_id=user_id,
        origin=origin,
    )
    return resp


@router.get("/tools")
async def list_tools():
    """Lists all registered MCP tools and their schemas."""
    tools = mcp_tool_registry.list_tools()
    return {"success": True, "data": {"tools": [t.model_dump() for t in tools]}}


@router.post("/tools/call")
async def call_tool_direct(req: DirectToolCallRequest, request: Request):
    """Direct REST invocation of an MCP tool."""
    user_id = request.headers.get("X-User-ID", "usr_adora_local")
    try:
        result = await mcp_tool_registry.invoke_tool(
            tool_name=req.toolName,
            user_id=user_id,
            arguments=req.arguments,
            is_approved=req.isApproved,
        )
        return {"success": not result.isError, "data": result.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/servers")
async def list_external_servers():
    """Lists registered external MCP servers and connection statuses."""
    servers = external_mcp_manager.list_servers()
    return {"success": True, "data": {"servers": servers}}


@router.post("/servers/{server_id}/connect")
async def connect_external_server(server_id: str):
    """Initializes connection to an external MCP server."""
    try:
        res = await mcp_client.connect_and_initialize(server_id)
        return {"success": True, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
