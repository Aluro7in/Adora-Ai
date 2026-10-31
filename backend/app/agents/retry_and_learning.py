"""
Adora AI — Agent Retry Manager & Outcome Learner
Handles bounded retries with exponential backoff and updates cognitive patterns based on execution results.
"""

import asyncio
import random
from typing import Callable, Any, Dict
from app.repositories.firestore_repo import firestore_repo
from app.core.logging import logger


class RetryManager:
    @staticmethod
    async def execute_with_retry(
        func: Callable,
        max_retries: int = 3,
        base_delay_seconds: float = 0.5,
    ) -> Any:
        """
        Executes an async function with bounded exponential backoff and jitter.
        """
        attempt = 0
        last_error = None

        while attempt < max_retries:
            try:
                return await func()
            except Exception as e:
                attempt += 1
                last_error = e
                if attempt >= max_retries:
                    break
                jitter = random.uniform(0.1, 0.3)
                delay = (base_delay_seconds * (2 ** (attempt - 1))) + jitter
                logger.warning(f"Execution failed (attempt {attempt}/{max_retries}): {e}. Retrying in {delay:.2f}s...")
                await asyncio.sleep(delay)

        raise last_error


class OutcomeLearner:
    @staticmethod
    async def learn_from_execution(
        user_id: str,
        goal: str,
        workflow_id: str,
        success: bool,
        notes: str,
    ):
        """
        Synthesizes execution outcomes into procedural memory candidate or insight evidence.
        """
        if success:
            logger.info(f"Workflow '{workflow_id}' succeeded. Recording procedural feedback.")
            # Record procedural candidate memory
            from datetime import datetime
            now = datetime.utcnow().isoformat()
            candidate_mem = {
                "id": f"mem_proc_{workflow_id[-6:]}",
                "userId": user_id,
                "type": "procedural",
                "title": f"Verified workflow for: {goal[:32]}",
                "statement": f"Successfully completed workflow with verified execution. Details: {notes}",
                "detailedContext": f"Workflow ID {workflow_id} executed successfully.",
                "userApprovalState": "approved",
                "confidenceScore": 0.95,
                "tags": ["workflow", "action", "procedural"],
                "createdAt": now,
                "updatedAt": now,
            }
            await firestore_repo.save_memory(user_id, candidate_mem)
