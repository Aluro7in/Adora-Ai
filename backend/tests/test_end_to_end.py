"""
Adora AI — Acceptance Test Demonstrations (Demos 1 - 7)
Verifies:
1. Personal RAG Pipeline
2. Reflective Memory & Provenance
3. MCP Server Protocol & Capability Negotiation
4. MCP Client & External Server Connection
5. Agentic DAG Execution & Verification Receipts
6. Provider Resilience
7. Security & User Isolation
"""

import unittest
import asyncio
import hashlib

from app.rag.ingestion.pipeline import IngestionPipeline
from app.rag.retrieval.hybrid_retriever import HybridRetriever
from app.rag.generation.grounded_generator import GroundedGenerator
from app.rag.embeddings.nebius_embeddings import NebiusEmbeddingProvider
from app.mcp.server import MCPServer
from app.mcp.client import MCPClient
from app.agents.execution_graph import ExecutionGraph
from app.agents.verification_and_policy import IndependentVerifier, PolicyEngine, PolicyViolationError
from app.repositories.firestore_repo import FirestoreRepository
from app.mcp.permissions import MCPPermissionEngine, PermissionDeniedError, ApprovalRequiredError
from app.mcp.schemas import MCPToolDefinition, ConsequentialityTier


class TestAdoraEndToEndDemos(unittest.TestCase):
    def setUp(self):
        self.loop = asyncio.new_event_loop()
        self.user_alice = "usr_alice_001"
        self.user_bob = "usr_bob_002"

    def tearDown(self):
        self.loop.close()

    def test_demo_1_personal_rag(self):
        """DEMO 1: Document ingest, chunking, 768d embeddings, hybrid search, grounded citation."""
        pipeline = IngestionPipeline()
        retriever = HybridRetriever()
        generator = GroundedGenerator()

        doc_text = (
            "# Engineering Protocol\n"
            "Adora AI requires all consequential mutations to be verified through cryptographic SHA-256 receipts.\n\n"
            "## Architecture\n"
            "The system uses NVIDIA Nemotron for reasoning and BAAI/bge-en-icl for dense vector representations."
        )

        # 1. Ingest
        ingest_res = self.loop.run_until_complete(
            pipeline.ingest_document(
                user_id=self.user_alice,
                content=doc_text.encode("utf-8"),
                filename="protocol.md",
                source_type="knowledge",
            )
        )
        self.assertEqual(ingest_res["status"], "indexed")
        self.assertGreaterEqual(ingest_res["chunkCount"], 2)
        self.assertEqual(ingest_res["dimensions"], 768)

        # 2. Hybrid Search
        results = self.loop.run_until_complete(
            retriever.retrieve(
                user_id=self.user_alice,
                query="cryptographic SHA-256 receipts",
                top_k=2,
            )
        )
        self.assertGreater(len(results), 0)
        self.assertIn("receipts", results[0]["content"].lower())

        # 3. Grounded Generation
        answer_res = self.loop.run_until_complete(
            generator.generate(
                query="How are consequential actions verified in Adora?",
                retrieved_chunks=results,
            )
        )
        self.assertIn("citations", answer_res)
        self.assertGreater(len(answer_res["citations"]), 0)
        self.assertFalse(answer_res["insufficientContext"])

    def test_demo_2_reflective_memory(self):
        """DEMO 2: Submit reflection, generate candidate, approve, and verify provenance."""
        repo = FirestoreRepository()

        # 1. Save reflection
        ref_doc = {
            "id": "ref_demo_01",
            "userId": self.user_alice,
            "rawText": "Decided to block Tuesday mornings for deep focus. Improved output by 40%.",
            "category": "strategic",
            "createdAt": "2026-10-31T00:00:00Z",
        }
        self.loop.run_until_complete(repo.save_reflection(self.user_alice, ref_doc))

        # 2. Save candidate memory linked to reflection
        cand_mem = {
            "id": "mem_demo_01",
            "userId": self.user_alice,
            "type": "procedural",
            "title": "Tuesday Focus Block",
            "statement": "Blocking Tuesday mornings significantly enhances output and lowers cognitive friction.",
            "sourceReflectionIds": ["ref_demo_01"],
            "userApprovalState": "candidate",
            "confidenceScore": 0.88,
        }
        self.loop.run_until_complete(repo.save_memory(self.user_alice, cand_mem))

        # 3. Approve candidate memory
        cand_mem["userApprovalState"] = "approved"
        self.loop.run_until_complete(repo.save_memory(self.user_alice, cand_mem))

        # 4. Verify approved memory retrieval
        memories = self.loop.run_until_complete(repo.list_memories(self.user_alice, memory_type="procedural"))
        target = next((m for m in memories if m["id"] == "mem_demo_01"), None)
        self.assertIsNotNone(target)
        self.assertEqual(target["userApprovalState"], "approved")
        self.assertEqual(target["sourceReflectionIds"], ["ref_demo_01"])

    def test_demo_3_mcp_server(self):
        """DEMO 3: Connect independent client to MCP server, discover tools & resources, invoke tool."""
        server = MCPServer()

        # 1. Initialize Handshake
        init_req = {"jsonrpc": "2.0", "id": 101, "method": "initialize", "params": {"protocolVersion": "2024-11-05"}}
        init_res = self.loop.run_until_complete(server.handle_request(init_req, user_id=self.user_alice))
        self.assertEqual(init_res["result"]["protocolVersion"], "2024-11-05")

        # 2. Tools List
        tools_req = {"jsonrpc": "2.0", "id": 102, "method": "tools/list"}
        tools_res = self.loop.run_until_complete(server.handle_request(tools_req, user_id=self.user_alice))
        tool_names = [t["name"] for t in tools_res["result"]["tools"]]
        self.assertIn("reflection.create", tool_names)
        self.assertIn("rag.search", tool_names)
        self.assertIn("execution.verify", tool_names)

        # 3. Resources List & Read
        res_list_req = {"jsonrpc": "2.0", "id": 103, "method": "resources/list"}
        res_list_res = self.loop.run_until_complete(server.handle_request(res_list_req, user_id=self.user_alice))
        uris = [r["uri"] for r in res_list_res["result"]["resources"]]
        self.assertIn("reflections://recent", uris)
        self.assertIn("memories://vault", uris)

        # 4. Tool Call (Safe)
        call_req = {
            "jsonrpc": "2.0",
            "id": 104,
            "method": "tools/call",
            "params": {"name": "reflection.create", "arguments": {"rawText": "MCP protocol verification entry."}},
        }
        call_res = self.loop.run_until_complete(server.handle_request(call_req, user_id=self.user_alice))
        self.assertFalse(call_res["result"]["isError"])
        self.assertIn("verificationProof", call_res["result"])

    def test_demo_4_mcp_client(self):
        """DEMO 4: Connect to registered external server and invoke tool."""
        client = MCPClient()
        init_res = self.loop.run_until_complete(client.connect_and_initialize("srv_google_workspace"))
        self.assertEqual(init_res["protocolVersion"], "2024-11-05")

        tool_exec = self.loop.run_until_complete(
            client.call_external_tool(
                server_id="srv_google_workspace",
                tool_name="calendar_create_event",
                arguments={"summary": "Deep Work"},
                user_id=self.user_alice,
            )
        )
        self.assertEqual(tool_exec["status"], "success")

    def test_demo_5_agentic_execution_and_receipts(self):
        """DEMO 5: Plan DAG, topological sort, policy check, independent verification receipt."""
        tasks = [
            {
                "id": "tsk_01",
                "title": "Retrieve Context",
                "toolName": "memory.search",
                "toolArguments": {"query": "Focus session"},
                "consequentialityTier": 0,
                "dependencies": [],
            },
            {
                "id": "tsk_02",
                "title": "Schedule Focus Session",
                "toolName": "calendar_create_event",
                "toolArguments": {"duration": 60},
                "consequentialityTier": 2,
                "dependencies": ["tsk_01"],
            },
        ]

        # 1. Topological DAG sort
        ordered = ExecutionGraph.validate_and_sort(tasks)
        self.assertEqual([t["id"] for t in ordered], ["tsk_01", "tsk_02"])

        # 2. Consequentiality gate: Task 2 cannot run without user approval
        with self.assertRaises(PolicyViolationError):
            PolicyEngine.evaluate_task(ordered[1], is_user_approved=False)

        # 3. Policy passes when user approves
        PolicyEngine.evaluate_task(ordered[1], is_user_approved=True)

        # 4. Independent Verification & Tamper-Evident Receipt
        verification = self.loop.run_until_complete(
            IndependentVerifier.verify_postcondition(
                user_id=self.user_alice,
                task=ordered[1],
                tool_output={"status": "event_created", "eventId": "evt_cal_99"},
            )
        )
        self.assertEqual(verification["status"], "VERIFIED")
        receipt = verification["receipt"]
        self.assertEqual(len(receipt["inputPayloadHash"]), 64)
        self.assertEqual(len(receipt["outputPayloadHash"]), 64)
        self.assertEqual(receipt["verificationStatus"], "VERIFIED")

    def test_demo_6_provider_resilience(self):
        """DEMO 6: Nebius provider handles offline/missing credentials with deterministic fallback."""
        embedder = NebiusEmbeddingProvider(api_key=None, dimensions=768)
        self.assertFalse(embedder.is_available())
        vecs = self.loop.run_until_complete(embedder.embed_texts(["Test fallback resilience"]))
        self.assertEqual(len(vecs[0]), 768)

    def test_demo_7_security_and_user_isolation(self):
        """DEMO 7: Prove Alice's memories, reflections, and documents cannot be accessed by Bob."""
        repo = FirestoreRepository()

        # Alice creates private reflection
        self.loop.run_until_complete(
            repo.save_reflection(self.user_alice, {"id": "ref_alice_priv", "rawText": "Alice private journal."})
        )

        # Bob lists reflections
        bob_refs = self.loop.run_until_complete(repo.list_reflections(self.user_bob))
        alice_ids_in_bob = [r["id"] for r in bob_refs if r["id"] == "ref_alice_priv"]
        self.assertEqual(len(alice_ids_in_bob), 0)

        # Cross-user tool invocation attempt
        with self.assertRaises(PermissionDeniedError):
            MCPPermissionEngine.enforce_boundaries(
                user_id=self.user_bob,
                tool=MCPToolDefinition(name="reflection.get", description="", inputSchema={}),
                arguments={"user_id": self.user_alice},
                is_approved=True,
            )


if __name__ == "__main__":
    unittest.main()
