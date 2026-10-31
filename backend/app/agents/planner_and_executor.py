"""
Adora AI — Agent Planner & Executor
Plans DAG of tasks using NVIDIA Nemotron, evaluates tools from MCP registry, and executes with verifiers.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.ai.providers.nebius_client import nebius_client
from app.agents.context_and_tasks import AgentContextManager, TaskDecomposer
from app.agents.execution_graph import ExecutionGraph
from app.agents.verification_and_policy import PolicyEngine, IndependentVerifier
from app.agents.retry_and_learning import RetryManager, OutcomeLearner
from app.mcp.registry import mcp_tool_registry
from app.core.logging import logger


class AgentPlanner:
    @staticmethod
    async def plan_workflow(user_id: str, goal: str) -> Dict[str, Any]:
        """
        Plans a goal DAG:
        1. Assembles approved context from memory
        2. Calls NVIDIA Nemotron for task breakdown
        3. Validates DAG structure
        """
        context = await AgentContextManager.assemble_context_for_goal(user_id, goal)
        wf_id = f"wf_{uuid.uuid4().hex[:8]}"

        # Invoke Nemotron planner
        raw_plan = await nebius_client.plan_goal_dag(goal, context)
        plan_tasks = raw_plan.get("tasks", [])
        rationale = raw_plan.get("rationale", "Structured into context retrieval and action steps.")

        tasks = []
        for i, pt in enumerate(plan_tasks):
            t_def = TaskDecomposer.create_task_definition(
                user_id=user_id,
                workflow_id=wf_id,
                title=pt.get("title", f"Step {i + 1}"),
                description=pt.get("description", ""),
                tool_name=pt.get("tool_name", "generic_step"),
                tool_arguments=pt.get("tool_arguments", {}),
                dependencies=pt.get("dependencies", []),
                consequentiality_tier=pt.get("consequentiality_tier", 0),
            )
            tasks.append(t_def)

        # Validate DAG
        validated_tasks = ExecutionGraph.validate_and_sort(tasks)

        workflow = {
            "id": wf_id,
            "userId": user_id,
            "goal": goal,
            "rationale": rationale,
            "status": "PLANNED",
            "taskIds": [t["id"] for t in validated_tasks],
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat(),
        }

        return {
            "workflow": workflow,
            "tasks": validated_tasks,
        }


class AgentExecutor:
    @staticmethod
    async def execute_task(
        user_id: str,
        task: Dict[str, Any],
        is_user_approved: bool = False,
    ) -> Dict[str, Any]:
        """
        Executes a single task in a workflow:
        1. Policy check (approvals)
        2. MCP Tool execution
        3. Independent verification
        4. Execution receipt generation
        """
        # 1. Policy check
        PolicyEngine.evaluate_task(task, is_user_approved=is_user_approved)

        tool_name = task.get("toolName", "web.search")
        tool_args = task.get("toolArguments", {})

        # 2. Execute via MCP registry with retry
        async def _run_tool():
            return await mcp_tool_registry.invoke_tool(
                tool_name=tool_name,
                user_id=user_id,
                arguments=tool_args,
                is_approved=is_user_approved,
            )

        tool_result = await RetryManager.execute_with_retry(_run_tool, max_retries=2)

        if tool_result.isError:
            task["status"] = "FAILED"
            raise RuntimeError(f"Tool execution failed: {tool_result.content}")

        # 3. Independent verification
        verification = await IndependentVerifier.verify_postcondition(
            user_id=user_id,
            task=task,
            tool_output=tool_result.content,
        )

        task["status"] = "VERIFIED"
        task["verifiedAt"] = datetime.utcnow().isoformat()
        task["executionReceiptId"] = verification["receipt"]["id"]

        return {
            "task": task,
            "verification": verification,
            "toolResult": tool_result.model_dump(),
        }
