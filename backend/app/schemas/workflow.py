"""
Adora AI — Workflow & Task Schemas
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class WorkflowPlanRequest(BaseModel):
    goal: str = Field(..., min_length=3, max_length=500)
    context: Optional[str] = None


class TaskResponse(BaseModel):
    id: str
    user_id: str = Field(..., alias="userId")
    workflow_id: str = Field(..., alias="workflowId")
    title: str
    description: str
    tool_name: str = Field(..., alias="toolName")
    tool_arguments: Dict[str, Any] = Field(default_factory=dict, alias="toolArguments")
    dependencies: List[str] = Field(default_factory=list)
    consequentiality_tier: int = Field(0, alias="consequentialityTier")
    status: str = "PLANNED"
    approved_at: Optional[str] = Field(None, alias="approvedAt")
    executed_at: Optional[str] = Field(None, alias="executedAt")
    verified_at: Optional[str] = Field(None, alias="verifiedAt")
    execution_result: Optional[Dict[str, Any]] = Field(None, alias="executionResult")
    project: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), alias="createdAt")
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), alias="updatedAt")

    class Config:
        populate_by_name = True


class TaskStatusUpdateRequest(BaseModel):
    status: str


class WorkflowResponse(BaseModel):
    id: str
    user_id: str = Field(..., alias="userId")
    goal: str
    rationale: str
    status: str = "planned"
    task_ids: List[str] = Field(default_factory=list, alias="taskIds")
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), alias="createdAt")
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), alias="updatedAt")

    class Config:
        populate_by_name = True


class ExecutionReceiptResponse(BaseModel):
    id: str
    user_id: str = Field(..., alias="userId")
    task_id: str = Field(..., alias="taskId")
    workflow_id: str = Field(..., alias="workflowId")
    tool_name: str = Field(..., alias="toolName")
    input_payload_hash: str = Field(..., alias="inputPayloadHash")
    output_payload_hash: str = Field(..., alias="outputPayloadHash")
    verification_status: str = Field("VERIFIED", alias="verificationStatus")
    verification_details: Dict[str, Any] = Field(default_factory=dict, alias="verificationDetails")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        populate_by_name = True
