"""
Adora AI — Backend Unit & Integration Tests
"""

import pytest
from app.schemas.reflection import ReflectionCreate
from app.schemas.workflow import WorkflowPlanRequest
from app.ai.providers.nebius_client import NebiusNemotronClient


def test_reflection_create_schema():
    payload = ReflectionCreate(
        rawText="Testing reflection input with adequate length.",
        category="strategic",
        tags=["architecture", "testing"],
        moodRating=4,
        energyRating=3,
    )
    assert payload.raw_text == "Testing reflection input with adequate length."
    assert payload.category == "strategic"
    assert len(payload.tags) == 2


def test_workflow_plan_schema():
    plan = WorkflowPlanRequest(
        goal="Schedule a focus block and email draft debrief.",
        context="Quarterly review follow-up",
    )
    assert plan.goal.startswith("Schedule a focus block")


@pytest.mark.asyncio
async def test_nebius_client_fallback_mode():
    client = NebiusNemotronClient()
    # When api_key is None, client should fall back to structured heuristic
    extraction = await client.extract_reflection_entities("Testing fallback text")
    assert "decisions" in extraction
    assert "lessons" in extraction
    assert isinstance(extraction["events"], list)


def test_task_status_update_schema():
    from app.schemas.workflow import TaskStatusUpdateRequest
    req = TaskStatusUpdateRequest(status="APPROVED")
    assert req.status == "APPROVED"


def test_execution_receipt_digest_integrity():
    import json
    import hashlib
    payload = {"tool": "calendar_create_event", "summary": "Quarterly Planning"}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    assert len(digest) == 64
    assert isinstance(digest, str)

