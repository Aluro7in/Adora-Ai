"""
Adora AI — Root API v1 Router Aggregator
"""

from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.reflections import router as reflections_router
from app.api.v1.memories import router as memories_router
from app.api.v1.insights import router as insights_router
from app.api.v1.workflows import router as workflows_router
from app.api.v1.chat import router as chat_router
from app.api.v1.rag import router as rag_router
from app.api.v1.mcp import router as mcp_router

api_router = APIRouter()

api_router.include_router(health_router, tags=["Health"])
api_router.include_router(reflections_router, prefix="/reflections", tags=["Reflections"])
api_router.include_router(memories_router, prefix="/memories", tags=["Memory Vault"])
api_router.include_router(insights_router, prefix="/insights", tags=["Insights"])
api_router.include_router(workflows_router, tags=["Workflows & Tasks"])
api_router.include_router(chat_router, prefix="/chat", tags=["Conversational Intelligence"])
api_router.include_router(rag_router, prefix="/rag", tags=["RAG & Knowledge"])
api_router.include_router(mcp_router, prefix="/mcp", tags=["Model Context Protocol (MCP)"])
