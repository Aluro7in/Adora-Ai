"""
Adora AI — MCP Tool Registry
Maintains tool schemas, consequentiality classifications, and execution routing.
"""

import time
import uuid
from typing import Dict, Any, List, Optional, Callable
from app.mcp.schemas import MCPToolDefinition, ConsequentialityTier, ToolCallResult
from app.mcp.permissions import MCPPermissionEngine
from app.mcp.approval import approval_manager
from app.mcp.audit import mcp_audit_ledger
from app.mcp.handlers.tool_handlers import MCPToolHandlers
from app.core.logging import logger


class MCPToolRegistry:
    def __init__(self):
        # Maps tool_name -> MCPToolDefinition
        self._tools: Dict[str, MCPToolDefinition] = {}
        # Maps tool_name -> async execution handler
        self._handlers: Dict[str, Callable] = {}
        self._register_default_tools()

    def register_tool(
        self,
        definition: MCPToolDefinition,
        handler: Callable,
    ):
        self._tools[definition.name] = definition
        self._handlers[definition.name] = handler

    def list_tools(self) -> List[MCPToolDefinition]:
        return list(self._tools.values())

    def get_tool(self, name: str) -> Optional[MCPToolDefinition]:
        return self._tools.get(name)

    async def invoke_tool(
        self,
        tool_name: str,
        user_id: str,
        arguments: Dict[str, Any],
        is_approved: bool = False,
    ) -> ToolCallResult:
        start_time = time.time()
        tool = self.get_tool(tool_name)
        if not tool:
            raise KeyError(f"Tool '{tool_name}' is not registered on this MCP server.")

        # 1. Enforce user boundary and consequentiality approval
        MCPPermissionEngine.enforce_boundaries(
            user_id=user_id,
            tool=tool,
            arguments=arguments,
            is_approved=is_approved,
        )

        handler = self._handlers[tool_name]
        event_id = f"evt_{uuid.uuid4().hex[:8]}"

        try:
            # 2. Execute handler
            result_data = await handler(user_id, arguments)
            duration_ms = (time.time() - start_time) * 1000

            # 3. Record audit event
            mcp_audit_ledger.record_call(
                event_id=event_id,
                user_id=user_id,
                tool_name=tool_name,
                arguments=arguments,
                output=result_data,
                status="success",
                duration_ms=duration_ms,
                verification_status="VERIFIED" if not tool.requiresApproval or is_approved else "UNVERIFIED",
            )

            return ToolCallResult(
                content=[{"type": "text", "text": str(result_data), "data": result_data}],
                isError=False,
                verificationProof={
                    "auditEventId": event_id,
                    "verifiedAt": time.time(),
                    "durationMs": duration_ms,
                },
            )

        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(f"MCP Tool '{tool_name}' failed: {e}")
            mcp_audit_ledger.record_call(
                event_id=event_id,
                user_id=user_id,
                tool_name=tool_name,
                arguments=arguments,
                output=str(e),
                status="failed",
                duration_ms=duration_ms,
                verification_status="FAILED",
            )
            return ToolCallResult(
                content=[{"type": "text", "text": f"Execution error: {str(e)}"}],
                isError=True,
            )

    def _register_default_tools(self):
        # 1. reflection.create
        self.register_tool(
            MCPToolDefinition(
                name="reflection.create",
                description="Records a new raw user reflection into the immutable store.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "rawText": {"type": "string", "description": "The verbatim user reflection text."},
                        "category": {"type": "string", "description": "Category (personal, strategic, operational)."},
                        "tags": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["rawText"],
                },
                consequentialityTier=ConsequentialityTier.TIER_1_BENIGN_MUTATION,
                readOnly=False,
            ),
            MCPToolHandlers.handle_reflection_create,
        )

        # 2. reflection.get
        self.register_tool(
            MCPToolDefinition(
                name="reflection.get",
                description="Retrieves a specific reflection by ID.",
                inputSchema={"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]},
                consequentialityTier=ConsequentialityTier.TIER_0_READ_ONLY,
                readOnly=True,
            ),
            MCPToolHandlers.handle_reflection_get,
        )

        # 3. reflection.search
        self.register_tool(
            MCPToolDefinition(
                name="reflection.search",
                description="Searches user reflections by keyword and tags.",
                inputSchema={"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]},
                consequentialityTier=ConsequentialityTier.TIER_0_READ_ONLY,
                readOnly=True,
            ),
            MCPToolHandlers.handle_reflection_search,
        )

        # 4. reflection.analyze
        self.register_tool(
            MCPToolDefinition(
                name="reflection.analyze",
                description="Analyzes reflection text with NVIDIA Nemotron to extract structured entities.",
                inputSchema={"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]},
                consequentialityTier=ConsequentialityTier.TIER_1_BENIGN_MUTATION,
                readOnly=False,
            ),
            MCPToolHandlers.handle_reflection_analyze,
        )

        # 5. memory.search
        self.register_tool(
            MCPToolDefinition(
                name="memory.search",
                description="Searches the user's four-tier memory vault.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "type": {"type": "string", "enum": ["episodic", "semantic", "relational", "procedural"]},
                        "top_k": {"type": "integer", "default": 5},
                    },
                    "required": ["query"],
                },
                consequentialityTier=ConsequentialityTier.TIER_0_READ_ONLY,
                readOnly=True,
            ),
            MCPToolHandlers.handle_memory_search,
        )

        # 6. memory.create_candidate
        self.register_tool(
            MCPToolDefinition(
                name="memory.create_candidate",
                description="Creates a candidate memory requiring user review before confirmation.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "statement": {"type": "string"},
                        "type": {"type": "string", "enum": ["episodic", "semantic", "relational", "procedural"]},
                    },
                    "required": ["title", "statement"],
                },
                consequentialityTier=ConsequentialityTier.TIER_1_BENIGN_MUTATION,
                readOnly=False,
            ),
            MCPToolHandlers.handle_memory_create_candidate,
        )

        # 7. memory.approve
        self.register_tool(
            MCPToolDefinition(
                name="memory.approve",
                description="Approves a candidate memory into confirmed status.",
                inputSchema={"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]},
                consequentialityTier=ConsequentialityTier.TIER_1_BENIGN_MUTATION,
                readOnly=False,
            ),
            MCPToolHandlers.handle_memory_approve,
        )

        # 8. rag.search
        self.register_tool(
            MCPToolDefinition(
                name="rag.search",
                description="Performs hybrid semantic and BM25 lexical retrieval across user documents.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "top_k": {"type": "integer", "default": 5},
                    },
                    "required": ["query"],
                },
                consequentialityTier=ConsequentialityTier.TIER_0_READ_ONLY,
                readOnly=True,
            ),
            MCPToolHandlers.handle_rag_search,
        )

        # 9. rag.retrieve_context
        self.register_tool(
            MCPToolDefinition(
                name="rag.retrieve_context",
                description="Retrieves grounded context package and citations for a user query.",
                inputSchema={"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]},
                consequentialityTier=ConsequentialityTier.TIER_0_READ_ONLY,
                readOnly=True,
            ),
            MCPToolHandlers.handle_rag_retrieve_context,
        )

        # 10. task.create
        self.register_tool(
            MCPToolDefinition(
                name="task.create",
                description="Creates a new task in an agent workflow.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "description": {"type": "string"},
                        "toolName": {"type": "string"},
                        "consequentialityTier": {"type": "integer", "default": 0},
                    },
                    "required": ["title"],
                },
                consequentialityTier=ConsequentialityTier.TIER_1_BENIGN_MUTATION,
                readOnly=False,
            ),
            MCPToolHandlers.handle_task_create,
        )

        # 11. execution.verify
        self.register_tool(
            MCPToolDefinition(
                name="execution.verify",
                description="Independently verifies execution postcondition and produces a tamper-evident receipt.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "taskId": {"type": "string"},
                        "toolName": {"type": "string"},
                    },
                    "required": ["taskId"],
                },
                consequentialityTier=ConsequentialityTier.TIER_0_READ_ONLY,
                readOnly=True,
            ),
            MCPToolHandlers.handle_execution_verify,
        )

        # 12. web.search
        self.register_tool(
            MCPToolDefinition(
                name="web.search",
                description="Performs web search to ground user facts without external mutation.",
                inputSchema={"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]},
                consequentialityTier=ConsequentialityTier.TIER_0_READ_ONLY,
                readOnly=True,
            ),
            MCPToolHandlers.handle_web_search,
        )


mcp_tool_registry = MCPToolRegistry()
