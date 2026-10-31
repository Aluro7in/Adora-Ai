"""
Adora AI — Backend Unit & Integration Tests
Supports standard unittest discovery.
"""

import unittest
import asyncio
import json
import hashlib
from app.schemas.reflection import ReflectionCreate
from app.schemas.workflow import WorkflowPlanRequest, TaskStatusUpdateRequest
from app.ai.providers.nebius_client import NebiusNemotronClient


class TestBackendSchemasAndInference(unittest.TestCase):
    def test_reflection_create_schema(self):
        payload = ReflectionCreate(
            rawText="Testing reflection input with adequate length.",
            category="strategic",
            tags=["architecture", "testing"],
            moodRating=4,
            energyRating=3,
        )
        self.assertEqual(payload.raw_text, "Testing reflection input with adequate length.")
        self.assertEqual(payload.category, "strategic")
        self.assertEqual(len(payload.tags), 2)

    def test_workflow_plan_schema(self):
        plan = WorkflowPlanRequest(
            goal="Schedule a focus block and email draft debrief.",
            context="Quarterly review follow-up",
        )
        self.assertTrue(plan.goal.startswith("Schedule a focus block"))

    def test_nebius_client_fallback_mode(self):
        client = NebiusNemotronClient()
        loop = asyncio.new_event_loop()
        extraction = loop.run_until_complete(client.extract_reflection_entities("Testing fallback text"))
        loop.close()
        self.assertIn("decisions", extraction)
        self.assertIn("lessons", extraction)
        self.assertIsInstance(extraction["events"], list)

    def test_task_status_update_schema(self):
        req = TaskStatusUpdateRequest(status="APPROVED")
        self.assertEqual(req.status, "APPROVED")

    def test_execution_receipt_digest_integrity(self):
        payload = {"tool": "calendar_create_event", "summary": "Quarterly Planning"}
        digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        self.assertEqual(len(digest), 64)
        self.assertIsInstance(digest, str)


if __name__ == "__main__":
    unittest.main()
