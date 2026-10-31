"""
Adora AI — MCP Resource and Prompt Handlers
Exposes MCP resources (read-only contexts) and MCP prompt templates.
"""

from typing import Dict, Any, List, Optional
from app.mcp.schemas import MCPResourceDefinition, MCPPromptDefinition, MCPPromptArgument
from app.repositories.firestore_repo import firestore_repo


class MCPResourceHandlers:
    RESOURCES = [
        MCPResourceDefinition(
            uri="reflections://recent",
            name="Recent Reflections",
            description="User's recent personal reflections and journal entries.",
            mimeType="application/json",
        ),
        MCPResourceDefinition(
            uri="memories://vault",
            name="Memory Vault",
            description="User's approved four-tier memories (episodic, semantic, relational, procedural).",
            mimeType="application/json",
        ),
        MCPResourceDefinition(
            uri="insights://confirmed",
            name="Confirmed Insights",
            description="Synthesized behavioral and cognitive patterns validated by the user.",
            mimeType="application/json",
        ),
        MCPResourceDefinition(
            uri="graph://nodes",
            name="Reflection Grove Graph",
            description="Knowledge graph nodes linking reflections, memories, and actions.",
            mimeType="application/json",
        ),
    ]

    @classmethod
    def list_resources(cls) -> List[MCPResourceDefinition]:
        return cls.RESOURCES

    @classmethod
    async def read_resource(cls, user_id: str, uri: str) -> Dict[str, Any]:
        if uri == "reflections://recent":
            items = await firestore_repo.list_reflections(user_id)
            return {"uri": uri, "mimeType": "application/json", "data": items[:10]}
        elif uri == "memories://vault":
            items = await firestore_repo.list_memories(user_id)
            return {"uri": uri, "mimeType": "application/json", "data": items}
        elif uri == "insights://confirmed":
            items = await firestore_repo.list_insights(user_id)
            return {"uri": uri, "mimeType": "application/json", "data": [i for i in items if i.get("status") == "confirmed"]}
        elif uri == "graph://nodes":
            return {"uri": uri, "mimeType": "application/json", "data": []}
        else:
            raise KeyError(f"Unknown resource URI: {uri}")


class MCPPromptHandlers:
    PROMPTS = [
        MCPPromptDefinition(
            name="deep_reflection_inquiry",
            description="Generates an in-depth Socratic inquiry prompt grounded in the user's latest reflections.",
            arguments=[MCPPromptArgument(name="topic", description="Specific topic to focus on", required=False)],
        ),
        MCPPromptDefinition(
            name="goal_dag_planner",
            description="Decomposes a user strategic goal into a DAG of approval-gated MCP tool calls.",
            arguments=[MCPPromptArgument(name="goal", description="The strategic goal to plan", required=True)],
        ),
        MCPPromptDefinition(
            name="weekly_strategic_review",
            description="Analyzes past weekly reflections and confirmed insights to generate an executive briefing.",
            arguments=[],
        ),
    ]

    @classmethod
    def list_prompts(cls) -> List[MCPPromptDefinition]:
        return cls.PROMPTS

    @classmethod
    async def get_prompt(cls, user_id: str, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        if name == "deep_reflection_inquiry":
            topic = arguments.get("topic", "recent decisions")
            return {
                "description": f"Deep Reflection Inquiry on {topic}",
                "messages": [
                    {
                        "role": "user",
                        "content": {
                            "type": "text",
                            "text": f"Review my historical entries regarding '{topic}'. What underlying cognitive assumptions and trade-offs emerge from my decisions?",
                        },
                    }
                ],
            }
        elif name == "goal_dag_planner":
            goal = arguments.get("goal", "Reflective Goal")
            return {
                "description": f"Goal Planning for '{goal}'",
                "messages": [
                    {
                        "role": "user",
                        "content": {
                            "type": "text",
                            "text": f"Decompose the goal '{goal}' into discrete sequential tasks. Categorize consequential external mutations into Tier 2 requiring my approval.",
                        },
                    }
                ],
            }
        elif name == "weekly_strategic_review":
            return {
                "description": "Weekly Strategic Review",
                "messages": [
                    {
                        "role": "user",
                        "content": {
                            "type": "text",
                            "text": "Synthesize my entries from the past 7 days into: 1. Core Decisions, 2. Recurring Obstacles, 3. Proposed Commitments for next week.",
                        },
                    }
                ],
            }
        else:
            raise KeyError(f"Unknown prompt name: {name}")
