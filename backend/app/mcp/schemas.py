"""
Adora AI — Model Context Protocol (MCP) Schemas
Typed JSON-RPC 2.0 schemas, Tool contracts, and Consequentiality Tiers.
Gracefully supports both Pydantic and Python standard library.
"""

from typing import Dict, Any, List, Optional, Union, Literal
from enum import Enum

try:
    from pydantic import BaseModel, Field
    _has_pydantic = True
except ImportError:
    _has_pydantic = False

    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

        def model_dump(self) -> Dict[str, Any]:
            dumped = {}
            for k, v in self.__dict__.items():
                if k.startswith("_"):
                    continue
                if isinstance(v, BaseModel):
                    dumped[k] = v.model_dump()
                elif isinstance(v, list):
                    dumped[k] = [item.model_dump() if isinstance(item, BaseModel) else item for item in v]
                elif isinstance(v, Enum):
                    dumped[k] = v.value
                else:
                    dumped[k] = v
            return dumped

    def Field(default_factory=None, **kwargs):
        return default_factory() if default_factory else None


class ConsequentialityTier(int, Enum):
    TIER_0_READ_ONLY = 0        # Safe, read-only queries (e.g. memory.search, rag.search)
    TIER_1_BENIGN_MUTATION = 1   # Low-stakes reversible state changes (e.g. task.update)
    TIER_2_CONSEQUENTIAL = 2    # High-stakes external mutations requiring explicit user approval


class JSONRPCRequest(BaseModel):
    def __init__(
        self,
        jsonrpc: str = "2.0",
        id: Optional[Union[str, int]] = None,
        method: str = "",
        params: Optional[Dict[str, Any]] = None,
        **kwargs
    ):
        super().__init__(jsonrpc=jsonrpc, id=id, method=method, params=params, **kwargs)


class JSONRPCResponse(BaseModel):
    def __init__(
        self,
        jsonrpc: str = "2.0",
        id: Optional[Union[str, int]] = None,
        result: Optional[Any] = None,
        error: Optional[Dict[str, Any]] = None,
        **kwargs
    ):
        super().__init__(jsonrpc=jsonrpc, id=id, result=result, error=error, **kwargs)


class MCPToolParameter(BaseModel):
    def __init__(
        self,
        type: str = "object",
        properties: Optional[Dict[str, Any]] = None,
        required: Optional[List[str]] = None,
        **kwargs
    ):
        super().__init__(type=type, properties=properties or {}, required=required or [], **kwargs)


class MCPToolDefinition(BaseModel):
    def __init__(
        self,
        name: str,
        description: str,
        inputSchema: Dict[str, Any],
        outputSchema: Optional[Dict[str, Any]] = None,
        consequentialityTier: ConsequentialityTier = ConsequentialityTier.TIER_0_READ_ONLY,
        requiresApproval: bool = False,
        readOnly: bool = True,
        requiredScopes: Optional[List[str]] = None,
        **kwargs
    ):
        super().__init__(
            name=name,
            description=description,
            inputSchema=inputSchema,
            outputSchema=outputSchema,
            consequentialityTier=consequentialityTier,
            requiresApproval=requiresApproval,
            readOnly=readOnly,
            requiredScopes=requiredScopes or [],
            **kwargs
        )


class MCPResourceDefinition(BaseModel):
    def __init__(
        self,
        uri: str,
        name: str,
        description: Optional[str] = None,
        mimeType: str = "application/json",
        **kwargs
    ):
        super().__init__(uri=uri, name=name, description=description, mimeType=mimeType, **kwargs)


class MCPPromptArgument(BaseModel):
    def __init__(
        self,
        name: str,
        description: Optional[str] = None,
        required: bool = False,
        **kwargs
    ):
        super().__init__(name=name, description=description, required=required, **kwargs)


class MCPPromptDefinition(BaseModel):
    def __init__(
        self,
        name: str,
        description: str,
        arguments: Optional[List[MCPPromptArgument]] = None,
        **kwargs
    ):
        super().__init__(name=name, description=description, arguments=arguments or [], **kwargs)


class ToolCallResult(BaseModel):
    def __init__(
        self,
        content: List[Dict[str, Any]],
        isError: bool = False,
        verificationProof: Optional[Dict[str, Any]] = None,
        **kwargs
    ):
        super().__init__(
            content=content,
            isError=isError,
            verificationProof=verificationProof,
            **kwargs
        )
