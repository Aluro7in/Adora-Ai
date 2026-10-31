"""
Adora AI — Comprehensive RAG, MCP, and Agentic Infrastructure Unit & Integration Tests
Runs with Python standard unittest runner.
"""

import unittest
import asyncio
import hashlib
import json

# 1. RAG Ingestion & Chunking
from app.rag.ingestion.document_parser import DocumentParser, DocumentParseResult
from app.rag.ingestion.normalizer import TextNormalizer
from app.rag.ingestion.chunker import IntelligentChunker, DocumentChunk
from app.rag.ingestion.deduplication import DeduplicationService
from app.rag.ingestion.metadata_extractor import MetadataExtractor

# 2. RAG Embeddings & Validation
from app.rag.embeddings.dimension_validation import validate_embedding_dimensions, DimensionValidationError
from app.rag.embeddings.nebius_embeddings import NebiusEmbeddingProvider

# 3. RAG Indexing & Retrieval
from app.rag.indexing.vector_index import VectorIndex, VectorRecord, cosine_similarity
from app.rag.indexing.lexical_index import LexicalIndex
from app.rag.retrieval.reciprocal_rank_fusion import reciprocal_rank_fusion, Reranker
from app.rag.generation.context_and_citations import ContextBuilder, CitationBuilder

# 4. MCP Server, Permissions & Approval
from app.mcp.schemas import ConsequentialityTier, MCPToolDefinition
from app.mcp.permissions import MCPPermissionEngine, PermissionDeniedError, ApprovalRequiredError
from app.mcp.server import MCPServer
from app.mcp.registry import MCPToolRegistry

# 5. Agent DAG & Execution Graph
from app.agents.execution_graph import ExecutionGraph, CyclicDependencyError, InvalidDependencyError
from app.agents.verification_and_policy import IndependentVerifier


class TestRAGIngestionAndChunking(unittest.TestCase):
    def test_document_parser_markdown(self):
        content = b"# Executive Summary\nAdora AI grounds reflections.\n## Architecture\nUses Nemotron."
        result = DocumentParser.parse(content, "test_doc.md", "text/markdown")
        self.assertIn("Executive Summary", result.headings)
        self.assertIn("Architecture", result.headings)
        self.assertIn("Adora AI grounds reflections", result.raw_text)

    def test_text_normalizer(self):
        dirty = "Adora \u00a0AI  \t\r\n\r\n\r\n\r\nReflections\ufeff"
        cleaned = TextNormalizer.normalize(dirty)
        self.assertEqual(cleaned, "Adora  AI\n\nReflections")

    def test_intelligent_chunker(self):
        text = (
            "# Strategic Alignment\n"
            "This is paragraph one detailing personal goals. Each decision builds momentum.\n\n"
            "## Execution\n"
            "This is paragraph two focusing on deliberate practice. Continuous review ensures fidelity."
        )
        chunker = IntelligentChunker(target_tokens=20, max_tokens=30, overlap_tokens=5)
        chunks = chunker.chunk_document(parent_doc_id="doc_test_01", text=text)
        self.assertGreaterEqual(len(chunks), 2)
        self.assertTrue(chunks[0].chunk_id.startswith("chk_doc_test_01"))
        self.assertIn("Strategic Alignment", chunks[0].heading_path)
        self.assertGreater(chunks[0].token_count, 0)
        self.assertEqual(len(chunks[0].content_hash), 64)

    def test_deduplication_service(self):
        dedup = DeduplicationService()
        h1 = hashlib.sha256(b"unique reflection text").hexdigest()
        self.assertFalse(dedup.is_duplicate("usr_01", h1))
        dedup.register_hash("usr_01", h1)
        self.assertTrue(dedup.is_duplicate("usr_01", h1))
        # Isolation: user 2 is not affected
        self.assertFalse(dedup.is_duplicate("usr_02", h1))


class TestRAGEmbeddingsAndValidation(unittest.TestCase):
    def test_dimension_validation_success(self):
        vec = [0.1] * 768
        self.assertTrue(validate_embedding_dimensions(vec, 768))

    def test_dimension_validation_mismatch(self):
        vec = [0.1] * 512
        with self.assertRaises(DimensionValidationError):
            validate_embedding_dimensions(vec, 768)

    def test_dimension_validation_degenerate_zeros(self):
        vec = [0.0] * 768
        with self.assertRaises(DimensionValidationError):
            validate_embedding_dimensions(vec, 768)

    def test_nebius_deterministic_embeddings(self):
        provider = NebiusEmbeddingProvider(dimensions=768)
        loop = asyncio.new_event_loop()
        embeddings = loop.run_until_complete(provider.embed_texts(["Reflective intelligence"]))
        loop.close()
        self.assertEqual(len(embeddings), 1)
        self.assertEqual(len(embeddings[0]), 768)
        # Verify L2 normalized: sum of squares ~= 1.0
        norm_sq = sum(x * x for x in embeddings[0])
        self.assertAlmostEqual(norm_sq, 1.0, places=4)


class TestRAGRetrievalAndFusion(unittest.TestCase):
    def test_vector_and_lexical_index_isolation(self):
        v_idx = VectorIndex()
        l_idx = LexicalIndex()

        # Insert for user 1
        v_idx.insert(VectorRecord(
            record_id="rec_1",
            user_id="usr_01",
            parent_doc_id="doc_1",
            chunk_id="chk_1",
            content="Cognitive focus and strategic goals.",
            embedding=[0.5] * 768,
            metadata={"sourceType": "document"},
        ))
        l_idx.insert(
            record_id="rec_1",
            user_id="usr_01",
            parent_doc_id="doc_1",
            chunk_id="chk_1",
            content="Cognitive focus and strategic goals.",
            metadata={"sourceType": "document"},
        )

        # User 1 searches
        v_matches_u1 = v_idx.search("usr_01", [0.5] * 768, top_k=5)
        l_matches_u1 = l_idx.search("usr_01", "cognitive focus", top_k=5)
        self.assertEqual(len(v_matches_u1), 1)
        self.assertEqual(len(l_matches_u1), 1)

        # Cross-user isolation: User 2 cannot access user 1 records
        v_matches_u2 = v_idx.search("usr_02", [0.5] * 768, top_k=5)
        l_matches_u2 = l_idx.search("usr_02", "cognitive focus", top_k=5)
        self.assertEqual(len(v_matches_u2), 0)
        self.assertEqual(len(l_matches_u2), 0)

    def test_reciprocal_rank_fusion(self):
        vec_res = [
            {"chunkId": "chk_A", "score": 0.95, "content": "Text A", "metadata": {}},
            {"chunkId": "chk_B", "score": 0.85, "content": "Text B", "metadata": {}},
        ]
        lex_res = [
            {"chunkId": "chk_B", "score": 0.99, "content": "Text B", "metadata": {}},
            {"chunkId": "chk_C", "score": 0.70, "content": "Text C", "metadata": {}},
        ]
        fused = reciprocal_rank_fusion(vec_res, lex_res, k=60)
        self.assertEqual(len(fused), 3)
        # chk_B is ranked top because it appeared high in both retrievers
        self.assertEqual(fused[0]["chunkId"], "chk_B")
        self.assertIn("rrfScore", fused[0])


class TestMCPServerAndPermissions(unittest.TestCase):
    def test_mcp_initialize_handshake(self):
        server = MCPServer()
        loop = asyncio.new_event_loop()
        res = loop.run_until_complete(
            server.handle_request({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {"protocolVersion": "2024-11-05"},
            })
        )
        loop.close()
        self.assertEqual(res["result"]["protocolVersion"], "2024-11-05")
        self.assertIn("tools", res["result"]["capabilities"])

    def test_mcp_consequential_approval_gate(self):
        tool = MCPToolDefinition(
            name="calendar_create_event",
            description="Mutation requiring approval",
            inputSchema={},
            consequentialityTier=ConsequentialityTier.TIER_2_CONSEQUENTIAL,
        )
        # Should raise ApprovalRequiredError if not approved
        with self.assertRaises(ApprovalRequiredError):
            MCPPermissionEngine.enforce_boundaries(
                user_id="usr_01",
                tool=tool,
                arguments={},
                is_approved=False,
            )
        # Passes if approved
        MCPPermissionEngine.enforce_boundaries(
            user_id="usr_01",
            tool=tool,
            arguments={},
            is_approved=True,
        )

    def test_mcp_cross_user_uid_forgery_rejection(self):
        tool = MCPToolDefinition(
            name="reflection.create",
            description="Create reflection",
            inputSchema={},
            consequentialityTier=ConsequentialityTier.TIER_1_BENIGN_MUTATION,
        )
        # Attacker tries to forge a different user_id
        with self.assertRaises(PermissionDeniedError):
            MCPPermissionEngine.enforce_boundaries(
                user_id="usr_genuine",
                tool=tool,
                arguments={"userId": "usr_victim_target"},
                is_approved=True,
            )


class TestAgentExecutionGraph(unittest.TestCase):
    def test_dag_topological_sort_success(self):
        tasks = [
            {"id": "task_3", "dependencies": ["task_2"]},
            {"id": "task_1", "dependencies": []},
            {"id": "task_2", "dependencies": ["task_1"]},
        ]
        sorted_tasks = ExecutionGraph.validate_and_sort(tasks)
        order = [t["id"] for t in sorted_tasks]
        self.assertEqual(order, ["task_1", "task_2", "task_3"])

    def test_dag_cyclic_dependency_rejection(self):
        tasks = [
            {"id": "task_1", "dependencies": ["task_2"]},
            {"id": "task_2", "dependencies": ["task_1"]},
        ]
        with self.assertRaises(CyclicDependencyError):
            ExecutionGraph.validate_and_sort(tasks)

    def test_dag_unknown_dependency_rejection(self):
        tasks = [
            {"id": "task_1", "dependencies": ["task_missing_xyz"]},
        ]
        with self.assertRaises(InvalidDependencyError):
            ExecutionGraph.validate_and_sort(tasks)


if __name__ == "__main__":
    unittest.main()
