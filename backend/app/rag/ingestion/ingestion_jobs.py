"""
Adora AI — Ingestion Jobs Manager
Tracks background ingestion pipelines, state transitions, progress, and failure retries.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List


class IngestionJob:
    def __init__(
        self,
        job_id: str,
        user_id: str,
        document_id: str,
        title: str,
        status: str = "pending",
        progress: int = 0,
        stage: str = "initialized",
        error: Optional[str] = None,
    ):
        self.job_id = job_id
        self.user_id = user_id
        self.document_id = document_id
        self.title = title
        self.status = status
        self.progress = progress
        self.stage = stage
        self.error = error
        self.created_at = datetime.utcnow().isoformat()
        self.updated_at = self.created_at

    def update(
        self,
        status: Optional[str] = None,
        progress: Optional[int] = None,
        stage: Optional[str] = None,
        error: Optional[str] = None,
    ):
        if status:
            self.status = status
        if progress is not None:
            self.progress = progress
        if stage:
            self.stage = stage
        if error is not None:
            self.error = error
        self.updated_at = datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "jobId": self.job_id,
            "userId": self.user_id,
            "documentId": self.document_id,
            "title": self.title,
            "status": self.status,
            "progress": self.progress,
            "stage": self.stage,
            "error": self.error,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }


class IngestionJobManager:
    def __init__(self):
        self._jobs: Dict[str, IngestionJob] = {}

    def create_job(self, user_id: str, document_id: str, title: str) -> IngestionJob:
        job_id = f"job_ing_{uuid.uuid4().hex[:8]}"
        job = IngestionJob(
            job_id=job_id,
            user_id=user_id,
            document_id=document_id,
            title=title,
        )
        self._jobs[job_id] = job
        return job

    def get_job(self, job_id: str) -> Optional[IngestionJob]:
        return self._jobs.get(job_id)

    def list_jobs(self, user_id: str) -> List[Dict[str, Any]]:
        return [
            j.to_dict()
            for j in sorted(self._jobs.values(), key=lambda x: x.created_at, reverse=True)
            if j.user_id == user_id
        ]


ingestion_job_manager = IngestionJobManager()
