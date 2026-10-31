"""
Adora AI — Nebius Token Factory Client for NVIDIA Nemotron Inference
"""

import time
import json
from typing import Dict, Any, List, Optional
try:
    from openai import AsyncOpenAI
    _has_openai = True
except ImportError:
    AsyncOpenAI = None
    _has_openai = False

from app.core.config import settings
from app.core.logging import logger


class NebiusNemotronClient:
    def __init__(self):
        self.api_key = settings.NEBIUS_API_KEY
        self.base_url = settings.NEBIUS_BASE_URL
        self.model = settings.NEBIUS_MODEL
        self.fast_model = settings.NEBIUS_FAST_MODEL

        self.client: Optional[AsyncOpenAI] = None
        if self.api_key:
            self.client = AsyncOpenAI(
                base_url=self.base_url,
                api_key=self.api_key,
                timeout=45.0,
            )

    def is_configured(self) -> bool:
        return bool(self.api_key and self.client)

    async def extract_reflection_entities(self, text: str) -> Dict[str, Any]:
        """
        Extracts events, decisions, goals, obstacles, lessons, themes, and questions
        using NVIDIA Nemotron.
        """
        if not self.is_configured():
            logger.info("Nebius API key not set; using structured deterministic fallback extraction.")
            return {
                "events": ["User journal entry recorded"],
                "decisions": ["Evaluated reflective priorities"],
                "goals": ["Pursue deliberate consistency"],
                "obstacles": [],
                "lessons": ["Continuous reflection grounds subsequent decisions"],
                "themes": ["Reflection", "Execution"],
                "questions": ["What is the primary action required next?"],
            }

        prompt = f"""You are Adora's reflective analysis engine powered by NVIDIA Nemotron.
Analyze the user's reflection text below. Extract structured entities strictly adhering to the JSON schema.
Do NOT fabricate facts or diagnose psychological states. Keep entries grounded in what the user stated.

User Reflection:
\"\"\"{text}\"\"\"

Output JSON format:
{{
  "events": ["list of concrete occurrences"],
  "decisions": ["list of explicit choices or trade-offs"],
  "goals": ["list of desired future states"],
  "obstacles": ["list of friction points or blockers"],
  "lessons": ["list of insights or principles"],
  "themes": ["list of broad themes"],
  "questions": ["inquiry questions to ponder next"]
}}
JSON:"""

        start = time.time()
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a precise reflective analysis engine. Respond only with valid JSON."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            latency = (time.time() - start) * 1000
            content = response.choices[0].message.content or "{}"
            data = json.loads(content)
            logger.info(f"Nemotron extraction completed in {latency:.1f}ms using {self.model}")
            return data
        except Exception as e:
            logger.error(f"Nebius Nemotron extraction error: {e}")
            raise e

    async def plan_goal_dag(self, goal: str, context: Optional[str] = None) -> Dict[str, Any]:
        """
        Decomposes a goal into an execution DAG of tasks using NVIDIA Nemotron.
        """
        if not self.is_configured():
            return {
                "rationale": "Structured goal into initial context retrieval followed by an approval-gated external action.",
                "tasks": [
                    {
                        "title": f"Context search for '{goal[:30]}...'",
                        "description": "Retrieve relevant memories and historical experiences before acting.",
                        "tool_name": "memory_search",
                        "tool_arguments": {"query": goal, "top_k": 3},
                        "consequentiality_tier": 0,
                    },
                    {
                        "title": f"Action execution for '{goal[:30]}...'",
                        "description": "Execute approved workflow step.",
                        "tool_name": "calendar_create_event",
                        "tool_arguments": {"title": f"Focus: {goal}", "duration_minutes": 60},
                        "consequentiality_tier": 2,
                    },
                ],
            }

        prompt = f"""You are Adora's Agentic Planner powered by NVIDIA Nemotron.
Decompose the user's goal into a discrete DAG of actionable steps.
Assign each step a tool (e.g. memory_search, calendar_create_event, gmail_send_message, web_research).
Set consequentiality_tier:
- 0 for read-only actions (memory_search, web_research)
- 1 for minor mutations
- 2 for high-stakes external actions requiring human approval (gmail_send_message, destructive changes).

Goal: \"\"\"{goal}\"\"\"
Context: \"\"\"{context or 'None'}\"\"\"

Output JSON:
{{
  "rationale": "strategic rationale",
  "tasks": [
    {{
      "title": "task title",
      "description": "task instructions",
      "tool_name": "tool_name",
      "tool_arguments": {{}},
      "consequentiality_tier": 0
    }}
  ]
}}
JSON:"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a planning engine. Respond only with valid JSON."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            content = response.choices[0].message.content or "{}"
            return json.loads(content)
        except Exception as e:
            logger.error(f"Nemotron planning error: {e}")
            raise e

    async def generate_grounded_response(
        self,
        message: str,
        citations: List[Dict[str, Any]],
        use_deep_reflection: bool = False,
    ) -> str:
        """
        Generates a grounded conversational answer using NVIDIA Nemotron.
        """
        if not self.is_configured():
            if citations:
                return (
                    f"I hear you regarding '{message.strip()}'. "
                    f"Grounding in your Memory Vault: in '{citations[0]['title']}', you noted that '{citations[0]['quote']}' [cite:{citations[0]['id']}]."
                )
            return (
                f"I hear you regarding '{message.strip()}'. "
                "Your vault currently has no stored memories for direct citation yet. Record reflections or approve candidate memories to ground future conversations in your personal history."
            )

        context_block = ""
        if citations:
            context_block = "Verified User Memory Citations:\n" + "\n".join(
                [f"- [{c['id']}] {c['title']}: {c['quote']}" for c in citations]
            )
        else:
            context_block = "No direct memory citations available."

        system_prompt = (
            "You are Adora AI, an empathetic, reflective intelligence assistant powered by NVIDIA Nemotron. "
            "You ground advice directly in the user's approved memories and experiences. "
            "Never invent false memories or psychological diagnoses. "
            "When citing a memory, use the tag [cite:ID]."
        )
        if use_deep_reflection:
            system_prompt += " Provide an in-depth reflective inquiry, highlighting implicit assumptions, underlying values, and actionable next steps."

        user_content = f"{context_block}\n\nUser Question:\n{message}"

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                temperature=0.3,
            )
            return response.choices[0].message.content or "No response generated."
        except Exception as e:
            logger.error(f"Nemotron chat generation error: {e}")
            raise e


nebius_client = NebiusNemotronClient()

