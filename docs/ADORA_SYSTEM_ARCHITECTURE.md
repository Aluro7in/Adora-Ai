# ADORA AI — SYSTEM ARCHITECTURE SPECIFICATION

**Document Version:** 1.1.0  
**Status:** Approved Master Architecture  
**Product:** Adora AI (Reflective Intelligence. Adaptive Action.)  
**Runtime:** Node.js 22 LTS (Express Full-Stack Server) & React 19 SPA (Client)  
**Deployment Target:** Google Cloud Run (Containerized, Port 3000)  

---

## 1. Architectural Vision & Principles

Adora AI connects five core capabilities into a continuous cognitive loop:
```
┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│   CAPTURE    │ ──> │   UNDERSTAND   │ ──> │     ACT      │
└──────────────┘     └────────────────┘     └──────────────┘
       ▲                                            │
       │                                            ▼
┌──────────────┐                             ┌──────────────┐
│    LEARN     │ <────────────────────────── │    VERIFY    │
└──────────────┘                             └──────────────┘
```

The system strictly adheres to five architectural laws:
1. **One Authoritative Backend**: All business logic, AI reasoning calls, tool executions, and database writes flow through the Node.js Express backend.
2. **Strict Epistemic Provenance**: The system distinguishes between verbatim user statements, AI inferences/hypotheses, user-confirmed facts, agent execution plans, and independently verified outcomes.
3. **Zero Client Secrets**: No privileged credentials (`NEBIUS_API_KEY`, `GEMINI_API_KEY`, Firebase Admin keys) are ever bundled or transmitted to the client.
4. **Zero-Trust Multi-Tenancy**: Data isolation is enforced at both the application repository layer and Firestore security rules using the user-scoped path structure `/users/{userId}/*`.
5. **Verified Action Execution**: An agent action is never marked successful based merely on an LLM's claim; it requires independent read-back state verification and emits an immutable cryptographic receipt.

---

## 2. High-Level Architectural Topology

```
+---------------------------------------------------------------------------------------------------------+
|                                              CLIENT TIER                                                |
|                                       (React 19 + TypeScript)                                           |
|                                                                                                         |
|  +---------------------------------------------------------------------------------------------------+  |
|  | Modules: Home | Reflect | Chat | Memory Vault | Insights | Grove | Workflows | Tasks | Receipts   |  |
|  +---------------------------------------------------------------------------------------------------+  |
|  | UI Stack: Tailwind CSS v4, Motion, Lucide Icons                                                    |  |
|  | Clients: Firebase Auth Client (Google Sign-In Popup), Typed API Client (/api/v1/*)                |  |
+---------------------------------------------------------------------------------------------------------+
                                                     │ HTTPS (Bearer <Firebase_ID_Token>)
                                                     ▼
+---------------------------------------------------------------------------------------------------------+
|                                         AUTHORITATIVE BACKEND                                           |
|                                     (Node.js 22 + Express 4.x)                                          |
|                                                                                                         |
|  +---------------------------------------------------------------------------------------------------+  |
|  | Middleware Pipeline                                                                               |  |
|  | - Security Headers & CORS                                                                          |  |
|  | - Request Correlation ID (X-Correlation-ID)                                                       |  |
|  | - Firebase Admin Token Verification (extracts and validates auth.uid)                             |  |
|  | - Zod Input Validation & Sanitization                                                              |  |
|  | - Audit & Latency Telemetry Middleware                                                            |  |
|  +---------------------------------------------------------------------------------------------------+  |
|                                                     │                                                    |
|                                                     ▼                                                    |
|  +---------------------------------------------------------------------------------------------------+  |
|  | Domain Services Layer                                                                             |  |
|  | - ReflectionService: Ingests reflections, manages drafts, coordinates analysis                     |  |
|  | - MemoryService: 4-tier memory manager (Episodic, Semantic, Relational, Procedural)              |  |
|  | - InsightEngine: Cross-reflection pattern detection, counter-evidence analysis                    |  |
|  | - ConversationalService: Grounded RAG chat, context assembly, citation injection                  |  |
|  | - GroveService: Knowledge graph nodes & edges calculation and status management                   |  |
|  | - PlannerService: High-level goal decomposition into DAG of discrete tasks                       |  |
|  | - AgentOrchestrator: 8-state machine manager, Tier 2 approval gatekeeper, tool dispatch          |  |
|  | - MCPToolRegistry: Standardized Model Context Protocol tool executor                              |  |
|  | - VerificationEngine: Independent external read-back assertions & state delta checking           |  |
|  | - ReceiptLedger: SHA-256 canonical digest builder & tamper-evident audit writer                    |  |
|  +---------------------------------------------------------------------------------------------------+  |
|                                                     │                                                    |
|                                                     ▼                                                    |
|  +---------------------------------------------------------------------------------------------------+  |
|  | Data Repositories Layer                                                                           |  |
|  | - UsersRepo | ReflectionsRepo | MemoriesRepo | InsightsRepo | PlansRepo | TasksRepo | ReceiptsRepo |  |
|  +---------------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------------+
        │                                             │                                           │
        ▼                                             ▼                                           ▼
+───────────────────────────+    +─────────────────────────────────────────+    +─────────────────────────+
|     CLOUD FIRESTORE       |    |           AI INFERENCE TIER             |    |  INTEGRATIONS & MCP     |
|   (Document & Vectors)    |    |                                         |    |                         |
|                           |    |  1. Nebius Token Factory                |    |  Google Workspace:      |
|  - Root: /users/{userId}/ |    |     - NVIDIA Nemotron Models            |    |  - Google Calendar      |
|  - Reflections, Memories  |    |     - Structured Extraction             |    |  - Gmail                |
|  - Insights, Graph Data   |    |     - Pattern Synthesis & Reasoning     |    |  - Google Drive         |
|  - Plans, Tasks, Receipts |    |     - Goal-to-DAG Planning              |    |  - Google Sheets        |
|  - Cosine Vector Indexing |    |  2. Google GenAI SDK                    |    |                         |
|  - Zero-Trust ABAC Rules  |    |     - gemini-3.5-transcribe (Audio STT) |    |  External Tools:        |
|                           |    |     - gemini-3.8-flash-tts (TTS Audio)  |    |  - Web Research Tools   |
|                           |    |     - gemini-3.8-live (Duplex Voice)    |    |  - System Health APIs   |
|                           |    |     - gemini-4-argon (Thinking & Vision)|    |                         |
+───────────────────────────+    +─────────────────────────────────────────+    +─────────────────────────+
```

---

## 3. End-to-End Service Communication & Data Flow

### 3.1 Flow A: Reflection Capture, Audio Transcription & Nemotron Extraction
```
User (Browser)               Node.js Backend           Gemini Speech API        Nebius (Nemotron)       Cloud Firestore
     │                             │                          │                         │                      │
     │ 1. Record voice / text      │                          │                         │                      │
     ├────────────────────────────>│                          │                         │                      │
     │    POST /audio/transcribe   │ 2. Forward audio buffer  │                         │                      │
     │                             ├─────────────────────────>│                         │                      │
     │                             │ 3. Verbatim transcript   │                         │                      │
     │                             │<─────────────────────────┤                         │                      │
     │ 4. Return transcript        │                          │                         │                      │
     │<────────────────────────────┤                          │                         │                      │
     │                             │                          │                         │                      │
     │ 5. Review & Confirm Input   │                          │                         │                      │
     ├────────────────────────────>│                          │                         │                      │
     │    POST /reflections        │ 6. Persist original reflection (immutable)         │                      │
     │                             ├────────────────────────────────────────────────────┼─────────────────────>│
     │                             │ 7. Dispatch to Nemotron  │                         │                      │
     │                             ├──────────────────────────┼────────────────────────>│                      │
     │                             │                          │  Structured extraction: │                      │
     │                             │                          │  events, decisions,     │                      │
     │                             │                          │  goals, obstacles, etc. │                      │
     │                             │ 8. Return JSON payload   │                         │                      │
     │                             │<─────────────────────────┼─────────────────────────┤                      │
     │                             │ 9. Save candidate entities & graph links           │                      │
     │                             ├────────────────────────────────────────────────────┼─────────────────────>│
     │ 10. Display Analysis Drawer │                          │                         │                      │
     │<────────────────────────────┤                          │                         │                      │
```

### 3.2 Flow B: Memory Vault Grounded RAG Chat
```
User (Browser)               Node.js Backend          Gemini Embedding        Cloud Firestore          Nebius (Nemotron)
     │                             │                         │                       │                         │
     │ 1. "What did I decide..."   │                         │                       │                         │
     ├────────────────────────────>│                         │                       │                         │
     │    POST /chat/message       │ 2. Embed user query     │                       │                         │
     │                             ├────────────────────────>│                       │                         │
     │                             │ 3. Vector array (768d)  │                       │                         │
     │                             │<────────────────────────┤                       │                         │
     │                             │ 4. Nearest-neighbor vector query (COSINE)       │                         │
     │                             ├────────────────────────────────────────────────>│                         │
     │                             │ 5. Top-K relevant approved memories             │                         │
     │                             │<────────────────────────────────────────────────┤                         │
     │                             │ 6. Assemble context package with source IDs & timestamps                  │
     │                             │ 7. Grounded reasoning prompt with citation markers │                      │
     │                             ├─────────────────────────────────────────────────┼────────────────────────>│
     │                             │ 8. Synthesized response with [cite:memoryId]    │                         │
     │                             │<────────────────────────────────────────────────┼─────────────────────────┤
     │ 9. Response + Citations     │                         │                       │                         │
     │<────────────────────────────┤                         │                       │                         │
```

### 3.3 Flow C: Agent Planning, Consequential Approval & Verified Execution
```
User (Browser)            Node.js Backend           Nebius (Nemotron)       External Tool (MCP)       Cloud Firestore
     │                          │                          │                         │                       │
     │ 1. Submit high-level goal│                          │                         │                       │
     ├─────────────────────────>│                          │                         │                       │
     │   POST /workflows/plan   │ 2. Plan goal into DAG    │                         │                       │
     │                          ├─────────────────────────>│                         │                       │
     │                          │ 3. Structured tasks      │                         │                       │
     │                          │<─────────────────────────┤                         │                       │
     │                          │ 4. Save workflow & tasks in PLANNED state          │                       │
     │                          ├────────────────────────────────────────────────────┼──────────────────────>│
     │ 5. Display Workflow DAG  │                          │                         │                       │
     │<─────────────────────────┤                          │                         │                       │
     │                          │                          │                         │                       │
     │ 6. Approve Tier 2 Action │                          │                         │                       │
     ├─────────────────────────>│                          │                         │                       │
     │   POST /tasks/:id/approve│ 7. Update status: APPROVED                         │                       │
     │                          ├────────────────────────────────────────────────────┼──────────────────────>│
     │                          │ 8. Execute Tool          │                         │                       │
     │                          ├──────────────────────────┼────────────────────────>│                       │
     │                          │ 9. Raw Result            │                         │                       │
     │                          │<─────────────────────────┼─────────────────────────┤                       │
     │                          │ 10. Independent Verification Query                 │                       │
     │                          ├──────────────────────────┼────────────────────────>│                       │
     │                          │ 11. Read-back confirmation (state verified)        │                       │
     │                          │<─────────────────────────┼─────────────────────────┤                       │
     │                          │ 12. Write Cryptographic Receipt (SHA-256 hashes)   │                       │
     │                          │     Update task status to VERIFIED                 │                       │
     │                          ├────────────────────────────────────────────────────┼──────────────────────>│
     │ 13. Verified Status +    │                          │                         │                       │
     │     Receipt Badge        │                          │                         │                       │
     │<─────────────────────────┤                          │                         │                       │
```

---

## 4. Component Interactions & Protocol Specifications

### 4.1 Client-to-Backend Protocol
- **Transport**: HTTPS 1.1 / 2.0 with JSON payloads.
- **Streaming**: Server-Sent Events (SSE) for token streaming on `/api/v1/chat/stream`.
- **Headers**:
  - `Authorization: Bearer <FIREBASE_ID_TOKEN>` (Mandatory on all private routes).
  - `X-Correlation-ID: <UUID_V4>` (Generated per request for tracing).
  - `Content-Type: application/json`.

### 4.2 Backend-to-Nebius Token Factory Protocol
- **Transport**: HTTPS REST client using the standard OpenAI client SDK configured with:
  - `baseURL: process.env.NEBIUS_BASE_URL || "https://api.studio.nebius.ai/v1"`
  - `apiKey: process.env.NEBIUS_API_KEY`
- **Model Target**: Defaults to `nvidia/nemotron-4-340b-instruct` or `nvidia/nemotron-3-8b-instruct`.
- **Fail-Safe Policy**: If Nebius encounters a network error or rate limit, the service returns a structured 502/504 error to the client. It **never** silently falls back to an unapproved model family.

### 4.3 Backend-to-Firebase Protocol
- **Client Side**: Uses `firebase/auth` for user authentication via Google popup.
- **Server Side**: Uses `firebase-admin` for ID token verification (`admin.auth().verifyIdToken()`) and administrative Firestore reads/writes.
- **Security Invariant**: The backend derives the effective user identity strictly from the verified token claim (`decodedToken.uid`) and never accepts client-provided user IDs.

---

## 5. Security & Isolation Architecture

1. **Path-Based User Partitioning**: Every user-owned document resides within `/users/{uid}/{collectionName}/{docId}`.
2. **Zero-Trust ABAC Firestore Rules**:
   - Explicit check: `request.auth != null && request.auth.uid == userId`.
   - String size, timestamp validity (`request.time`), and entity attribute bounds enforced on every write.
   - Blanket reads and client-side query delegation strictly forbidden.
3. **Secret Isolation**: All inference credentials and service-account configurations exist solely as server-side environment variables (`process.env.*`).
