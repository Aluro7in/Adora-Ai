"""
Adora AI — Cloud Firestore Repository for Python Backend
Manages persistent data storage in Cloud Firestore with fallback to in-memory store.
Database ID: ai-studio-adoraai-cca6b399-4191-499a-99af-4c18cde0b8b9
"""

import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.config import settings
from app.core.logging import logger

try:
    from google.cloud import firestore
    _firestore_lib_available = True
except ImportError:
    _firestore_lib_available = False


class FirestoreRepository:
    def __init__(self):
        self.project_id = settings.FIREBASE_PROJECT_ID or os.getenv("FIREBASE_PROJECT_ID", "gen-lang-client-0651785302")
        self.database_id = os.getenv("FIREBASE_DATABASE_ID", "ai-studio-adoraai-cca6b399-4191-499a-99af-4c18cde0b8b9")
        self.client = None
        self._memory_store: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}

        if _firestore_lib_available:
            try:
                # Initialize Cloud Firestore client
                self.client = firestore.Client(project=self.project_id, database=self.database_id)
                logger.info(f"Connected to Cloud Firestore (DB: {self.database_id}, Project: {self.project_id})")
            except Exception as e:
                logger.warning(f"Could not connect to live Cloud Firestore: {e}. Falling back to memory store.")
                self.client = None

    def _get_collection(self, user_id: str, collection_name: str) -> List[Dict[str, Any]]:
        if user_id not in self._memory_store:
            self._memory_store[user_id] = {}
        if collection_name not in self._memory_store[user_id]:
            self._memory_store[user_id][collection_name] = []
        return self._memory_store[user_id][collection_name]

    async def save_reflection(self, user_id: str, reflection_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Saves original reflection under users/{user_id}/reflections/{reflection_id}"""
        if self.client:
            try:
                doc_ref = self.client.collection("users").document(user_id).collection("reflections").document(reflection_doc["id"])
                doc_ref.set(reflection_doc)
                return reflection_doc
            except Exception as e:
                logger.error(f"Firestore save_reflection error: {e}")
        
        # Memory fallback
        coll = self._get_collection(user_id, "reflections")
        coll.insert(0, reflection_doc)
        return reflection_doc

    async def list_reflections(self, user_id: str) -> List[Dict[str, Any]]:
        """Lists user reflections"""
        if self.client:
            try:
                docs = self.client.collection("users").document(user_id).collection("reflections").order_by("createdAt", direction=firestore.Query.DESCENDING).stream()
                return [d.to_dict() for d in docs]
            except Exception as e:
                logger.error(f"Firestore list_reflections error: {e}")

        return self._get_collection(user_id, "reflections")

    async def save_memory(self, user_id: str, memory_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Saves memory item under users/{user_id}/memories/{memory_id}"""
        if self.client:
            try:
                doc_ref = self.client.collection("users").document(user_id).collection("memories").document(memory_doc["id"])
                doc_ref.set(memory_doc)
                return memory_doc
            except Exception as e:
                logger.error(f"Firestore save_memory error: {e}")

        coll = self._get_collection(user_id, "memories")
        coll.insert(0, memory_doc)
        return memory_doc

    async def list_memories(self, user_id: str, memory_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists user memories with optional type filter"""
        if self.client:
            try:
                query = self.client.collection("users").document(user_id).collection("memories")
                if memory_type:
                    query = query.where("type", "==", memory_type)
                docs = query.stream()
                return [d.to_dict() for d in docs]
            except Exception as e:
                logger.error(f"Firestore list_memories error: {e}")

        items = self._get_collection(user_id, "memories")
        if memory_type:
            return [m for m in items if m.get("type") == memory_type]
        return items

    async def save_receipt(self, user_id: str, receipt_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Saves tamper-evident execution receipt (append-only)"""
        if self.client:
            try:
                doc_ref = self.client.collection("users").document(user_id).collection("execution_history").document(receipt_doc["id"])
                doc_ref.set(receipt_doc)
                return receipt_doc
            except Exception as e:
                logger.error(f"Firestore save_receipt error: {e}")

        coll = self._get_collection(user_id, "receipts")
        coll.insert(0, receipt_doc)
        return receipt_doc

    async def save_insight(self, user_id: str, insight_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Saves candidate or confirmed insight under users/{user_id}/insights/{insight_id}"""
        if self.client:
            try:
                doc_ref = self.client.collection("users").document(user_id).collection("insights").document(insight_doc["id"])
                doc_ref.set(insight_doc)
                return insight_doc
            except Exception as e:
                logger.error(f"Firestore save_insight error: {e}")

        coll = self._get_collection(user_id, "insights")
        coll.insert(0, insight_doc)
        return insight_doc

    async def list_insights(self, user_id: str) -> List[Dict[str, Any]]:
        """Lists user insights"""
        if self.client:
            try:
                docs = self.client.collection("users").document(user_id).collection("insights").order_by("createdAt", direction=firestore.Query.DESCENDING).stream()
                return [d.to_dict() for d in docs]
            except Exception as e:
                logger.error(f"Firestore list_insights error: {e}")

        return self._get_collection(user_id, "insights")

    async def update_insight_status(self, user_id: str, insight_id: str, status: str, user_notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Updates insight status and optional notes"""
        now = datetime.utcnow().isoformat()
        if self.client:
            try:
                doc_ref = self.client.collection("users").document(user_id).collection("insights").document(insight_id)
                update_data: Dict[str, Any] = {"status": status, "updatedAt": now}
                if user_notes is not None:
                    update_data["userNotes"] = user_notes
                doc_ref.update(update_data)
                snap = doc_ref.get()
                return snap.to_dict() if snap.exists else None
            except Exception as e:
                logger.error(f"Firestore update_insight_status error: {e}")

        coll = self._get_collection(user_id, "insights")
        target = next((i for i in coll if i.get("id") == insight_id), None)
        if target:
            target["status"] = status
            if user_notes is not None:
                target["userNotes"] = user_notes
            target["updatedAt"] = now
            return target
        return None


firestore_repo = FirestoreRepository()
