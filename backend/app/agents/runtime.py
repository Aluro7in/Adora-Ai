"""
Adora AI — Autonomous Agent Runtime Orchestrator
Orchestrates the entire lifecycle:
USER INTENT -> CONTEXT RETRIEVAL -> NEMOTRON PLANNING -> STRUCTURED PLAN ->
VALIDATION -> POLICY CHECK -> HUMAN APPROVAL -> MCP TOOL EXECUTION ->
INDEPENDENT VERIFICATION -> EXECUTION RECEIPT -> OUTCOME LEARNING.
"""

from typing import Dict, Any, List, Optional
from app.agents.planner_and_executor import AgentPlanner, AgentExecutor
from app.agents.retry_and_learning import OutcomeLearner
from app.core.logging import logger


class AgentRuntime:
    def __init__(self):
        self.planner = AgentPlanner()
        self.executor = AgentExecutor()

    async def plan_goal(self, user_id: str, goal: str) -> Dict[str, Any]:
        """
        Ingests user intent, retrieves approved context, generates Nemotron plan,
        validates DAG dependencies, and assigns consequentiality tiers.
        """
        logger.info(f"AgentRuntime: Planning goal for user {user_id}: '{goal}'")
        return await self.planner.plan_workflow(user_id=user_id, goal=goal)

    async def execute_workflow_step(
        self,
        user_id: str,
        task: Dict[str, Any],
        is_user_approved: bool = False,
    ) -> Dict[str, Any]:
        """
        Executes a workflow step through the MCP tool ecosystem,
        evaluates policies, verifies postconditions, produces receipts, and learns outcomes.
        """
        logger.info(f"AgentRuntime: Executing task {task.get('id')} ({task.get('toolName')})")
        res = await self.executor.execute_task(
            user_id=user_id,
            task=task,
            is_user_approved=is_user_approved,
        )

        # Record outcome learning
        await OutcomeLearner.learn_from_execution(
            user_id=user_id,
            goal=task.get("title", ""),
            workflow_id=task.get("workflowId", ""),
            success=True,
            notes=f"Tool {task.get('toolName')} verified successfully.",
        )

        return res


agent_runtime = AgentRuntime()
