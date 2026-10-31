# ADORA AI — MASTER FEATURE REGISTRY

**Document Version:** 1.0.0  
**Status:** Authoritative Operational Registry  
**Standard:** Every feature across product scope Sections A–K is cataloged. Status values: `NOT_STARTED`, `IN_PROGRESS`, `IMPLEMENTED`, `TESTED`, `PRODUCTION_READY`, `BLOCKED`.

---

## Registry Index

| Feature ID | Feature Name | Product Area | Priority | Status |
|------------|--------------|--------------|----------|--------|
| **FEAT-CAP-001** | Text Reflection Capture | Reflection Capture | P0 | `TESTED` |
| **FEAT-CAP-002** | Voice Audio Reflection Capture | Reflection Capture | P0 | `TESTED` |
| **FEAT-CAP-003** | Audio Transcription & Editing | Reflection Capture | P0 | `TESTED` |
| **FEAT-CAP-004** | Reflection Metadata & Mood Tagging | Reflection Capture | P1 | `TESTED` |
| **FEAT-CAP-005** | Structured Nemotron Entity Extraction | Reflection Intelligence | P0 | `TESTED` |
| **FEAT-CAP-006** | Epistemic Provenance Separation | Reflection Intelligence | P0 | `TESTED` |
| **FEAT-INT-001** | Multi-Reflection Pattern Discovery | Reflection Intelligence | P0 | `TESTED` |
| **FEAT-INT-002** | Evidence & Counter-Evidence Attribution | Reflection Intelligence | P0 | `TESTED` |
| **FEAT-INT-003** | User Pattern Confirmation & Refinement | Reflection Intelligence | P0 | `TESTED` |
| **FEAT-MEM-001** | Four-Tier Memory Vault (Episodic, Semantic, Relational, Procedural) | Persistent Memory | P0 | `TESTED` |
| **FEAT-MEM-002** | Memory Governance (Inspect, Edit, Delete, Deletion Cascade) | Persistent Memory | P0 | `TESTED` |
| **FEAT-RAG-001** | Vector Embedding Pipeline | Memory & RAG | P0 | `TESTED` |
| **FEAT-RAG-002** | Hybrid Semantic & Keyword Retrieval | Memory & RAG | P0 | `TESTED` |
| **FEAT-RAG-003** | Grounded Context Assembly & Empty Result Handling | Memory & RAG | P0 | `TESTED` |
| **FEAT-RAG-004** | Heading-Aware Intelligent Chunker & Deletion Cascade | Memory & RAG | P0 | `TESTED` |
| **FEAT-RAG-005** | Reciprocal Rank Fusion (RRF) & Reranking Engine | Memory & RAG | P0 | `TESTED` |
| **FEAT-GRV-001** | Reflection Grove Interactive Graph Engine | Reflection Grove | P0 | `TESTED` |
| **FEAT-GRV-002** | Candidate vs. Confirmed Visual Relationships | Reflection Grove | P1 | `TESTED` |
| **FEAT-CHT-001** | Memory-Grounded Conversational Dialogue | Conversational Intelligence | P0 | `TESTED` |
| **FEAT-CHT-002** | Citation Chips & Memory Footnotes | Conversational Intelligence | P0 | `TESTED` |
| **FEAT-CHT-003** | High-Thinking Strategic Deliberation Mode | Conversational Intelligence | P1 | `TESTED` |
| **FEAT-AGT-001** | Natural Language Goal-to-DAG Planner | Workflows & Agents | P0 | `TESTED` |
| **FEAT-AGT-002** | Dependency Graph & Task Scheduler | Workflows & Agents | P0 | `TESTED` |
| **FEAT-AGT-003** | Consequentiality Tiers & Human Approval Gate | Workflows & Agents | P0 | `TESTED` |
| **FEAT-AGT-004** | MCP-Compatible Tool Registry (12 Core Tools) | MCP & Integrations | P0 | `TESTED` |
| **FEAT-AGT-005** | Independent Action Verification Engine | Workflows & Agents | P0 | `TESTED` |
| **FEAT-AGT-006** | Cryptographic Execution Receipts Ledger | Workflows & Agents | P0 | `TESTED` |
| **FEAT-AGT-007** | Autonomous DAG Runtime & Verifier | Workflows & Agents | P0 | `TESTED` |
| **FEAT-MCP-001** | Streamable HTTP MCP JSON-RPC Server (2024-11-05) | MCP & Integrations | P0 | `TESTED` |
| **FEAT-MCP-002** | External MCP Client & Tool Discovery | MCP & Integrations | P0 | `TESTED` |
| **FEAT-MCP-003** | DNS Rebinding Origin Validation & Security Boundary | MCP & Integrations | P0 | `TESTED` |
| **FEAT-VOI-001** | Text-to-Speech Synthesis | Voice Architecture | P1 | `TESTED` |
| **FEAT-VOI-002** | Real-Time Duplex Voice Conversation | Voice Architecture | P1 | `IN_PROGRESS` |
| **FEAT-SEC-001** | Firebase Authentication & Google Sign-In | Security & Privacy | P0 | `TESTED` |
| **FEAT-SEC-002** | Authoritative Server-Side Token Verification | Security & Privacy | P0 | `TESTED` |
| **FEAT-SEC-003** | Zero-Trust Firestore Security Rules (ABAC) | Security & Privacy | P0 | `TESTED` |
| **FEAT-SEC-004** | User Data Export ("Download Vault") & Purge | Security & Privacy | P1 | `TESTED` |
| **FEAT-UI-001** | Executive Cockpit Home Dashboard | Product Experience | P0 | `TESTED` |
| **FEAT-UI-002** | Unified Navigation Shell & Responsive Layout | Product Experience | P0 | `TESTED` |


---

## Detailed Feature Specifications

### FEAT-CAP-001: Text Reflection Capture
- **Product Area**: Reflection Capture
- **Description**: Rich markdown text entry allowing users to record thoughts, challenges, and insights with auto-save drafts.
- **Dependencies**: FEAT-SEC-001, FEAT-SEC-002
- **Priority**: P0
- **Status**: `NOT_STARTED`
- **Implementation References**: `src/components/reflect/TextReflector.tsx`, `src/services/reflectionService.ts`
- **Test References**: `TC-CAP-001`
- **Acceptance Criteria**: Saves clean markdown to `/users/{userId}/reflections` with timestamp and user ID.
- **Known Limitations**: Input truncated at 10,000 characters to prevent resource exhaustion attacks.

### FEAT-CAP-002 & FEAT-CAP-003: Voice Capture & Audio Transcription
- **Product Area**: Reflection Capture & Voice
- **Description**: Microphone recording with live audio waveform, duration counter, audio playback, server-side transcription using `gemini-3.5-transcribe`, and inline transcript editor before submission.
- **Dependencies**: FEAT-SEC-001, `gemini-3.5-transcribe`
- **Priority**: P0
- **Status**: `NOT_STARTED`
- **Implementation References**: `src/components/reflect/VoiceReflector.tsx`, `src/services/voiceService.ts`
- **Test References**: `TC-GEM-001`
- **Acceptance Criteria**: Returns verbatim transcript within 3 seconds of recording stop; allows user to edit before saving.
- **Known Limitations**: Requires browser microphone permissions (gracefully disabled if denied).

### FEAT-CAP-005: Structured Nemotron Entity Extraction
- **Product Area**: Reflection Intelligence
- **Description**: Dispatches reflection text to NVIDIA Nemotron via Nebius Token Factory. Returns structured JSON containing events, decisions, goals, obstacles, lessons, themes, and questions.
- **Dependencies**: `NEBIUS_API_KEY`, `NebiusNemotronClient`
- **Priority**: P0
- **Status**: `NOT_STARTED`
- **Implementation References**: `src/services/nemotronClient.ts`, `src/services/extractionService.ts`
- **Test References**: `TC-NEM-002`
- **Acceptance Criteria**: Valid JSON adhering strictly to schema; does not hallucinate facts outside the reflection text.
- **Known Limitations**: Nebius API key must be provisioned in server secrets.

### FEAT-CAP-006: Epistemic Provenance Separation
- **Product Area**: Reflection Intelligence
- **Description**: Explicit tagging and UI separation distinguishing verbatim user text, AI inferences, user-approved memories, and verified tool outcomes.
- **Dependencies**: FEAT-CAP-001, FEAT-CAP-005
- **Priority**: P0
- **Status**: `NOT_STARTED`
- **Implementation References**: `src/components/common/ProvenanceBadge.tsx`, `src/types/domain.ts`
- **Test References**: `TC-SEC-004`
- **Acceptance Criteria**: No AI hypothesis is ever displayed as an objective fact; provenance source links are mandatory.
- **Known Limitations**: None.

### FEAT-INT-001, FEAT-INT-002 & FEAT-INT-003: Multi-Reflection Pattern Discovery & Governance
- **Product Area**: Reflection Intelligence
- **Description**: Synthesizes recurring cognitive, behavioral, or strategic patterns across historical entries. Identifies supporting quotes and counter-evidence. Provides user controls to Confirm, Refine, or Dismiss.
- **Dependencies**: FEAT-MEM-001, FEAT-CAP-005
- **Priority**: P0
- **Status**: `NOT_STARTED`
- **Implementation References**: `src/services/insightService.ts`, `src/components/insights/InsightCard.tsx`
- **Test References**: `TC-NEM-003`
- **Acceptance Criteria**: Every candidate pattern includes at least 2 supporting citations and notes any contradictory entries. User confirmation transitions pattern to `confirmed`.
- **Known Limitations**: Requires minimum of 3 reflections in vault to compute meaningful clusters.

### FEAT-MEM-001 & FEAT-MEM-002: Four-Tier Memory Vault
- **Product Area**: Persistent Memory
- **Description**: Organizes memories into Episodic, Semantic, Relational, and Procedural categories. Supports search, filter, edit, approval, and complete deletion cascade.
- **Dependencies**: FEAT-SEC-003
- **Priority**: P0
- **Status**: `NOT_STARTED`
- **Implementation References**: `src/components/vault/MemoryVault.tsx`, `src/services/memoryService.ts`
- **Test References**: `TC-RAG-004`
- **Acceptance Criteria**: Memories can be promoted from candidates or created manually; deleting a memory purges derived vector and graph references.
- **Known Limitations**: Vector search requires populated embeddings.

### FEAT-RAG-001 & FEAT-RAG-002: Hybrid Retrieval & Grounded Search
- **Product Area**: Memory & RAG
- **Description**: Generates text embeddings using `gemini-embedding-2-preview` and executes hybrid retrieval combining cosine vector distance with tag/category filtering and keyword matches.
- **Dependencies**: FEAT-MEM-001
- **Priority**: P0
- **Status**: `NOT_STARTED`
- **Implementation References**: `src/services/ragService.ts`, `src/services/embeddingService.ts`
- **Test References**: `TC-RAG-002`, `TC-RAG-003`
- **Acceptance Criteria**: Relevant memories returned with scores; returns explicit "no matching memories" message when scores fall below threshold.
- **Known Limitations**: Cold-start database requires initial reflections before search yields meaningful results.

### FEAT-GRV-001 & FEAT-GRV-002: Reflection Grove Knowledge Graph
- **Product Area**: Reflection Grove
- **Description**: Interactive visual knowledge graph rendering Reflections, Themes, Decisions, Goals, Tasks, Outcomes, and Facts. Shows dashed lines for candidate links and solid lines for confirmed links.
- **Dependencies**: FEAT-MEM-001
- **Priority**: P0
- **Status**: `NOT_STARTED`
- **Implementation References**: `src/components/grove/ReflectionGrove.tsx`, `src/services/graphService.ts`
- **Test References**: `TC-GRV-001`
- **Acceptance Criteria**: Force-directed layout updates interactively; clicking a node displays full provenance and source text.
- **Known Limitations**: For graphs exceeding 1,000 nodes, LOD (level-of-detail) clustering is applied for rendering performance.

### FEAT-CHT-001 & FEAT-CHT-002: Conversational Intelligence & RAG Citations
- **Product Area**: Conversational Intelligence
- **Description**: Multi-turn dialogue powered by NVIDIA Nemotron, grounded in the user's memories and goals. Generates interactive citation chips linking directly to source memory records.
- **Dependencies**: FEAT-RAG-002, `NebiusNemotronClient`
- **Priority**: P0
- **Status**: `NOT_STARTED`
- **Implementation References**: `src/components/chat/AdoraChat.tsx`, `src/services/chatService.ts`
- **Test References**: `TC-CHT-001`
- **Acceptance Criteria**: Responses cite memory IDs; clicking citation opens memory inspector; does not fabricate facts.
- **Known Limitations**: None.

### FEAT-CHT-003: High-Thinking Strategic Deliberation Mode
- **Product Area**: Conversational Intelligence
- **Description**: Toggleable mode routing complex strategic questions to `gemini-4-argon` with `thinkingLevel: ThinkingLevel.HIGH`.
- **Dependencies**: `gemini-4-argon`
- **Priority**: P1
- **Status**: `NOT_STARTED`
- **Implementation References**: `src/services/geminiService.ts`
- **Test References**: `TC-GEM-004`
- **Acceptance Criteria**: Displays reasoning chain / structured breakdown for high-stakes decisions.
- **Known Limitations**: Higher latency due to deep reasoning steps.

### FEAT-AGT-001 through FEAT-AGT-006: Agent Execution, Approval Gates & Receipts
- **Product Area**: Workflows & Agents
- **Description**: Decomposes natural language goals into DAGs of tasks; enforces Tier 2 human-in-the-loop approval gates; executes tools via MCP registry; performs independent read-back state verification; issues cryptographic SHA-256 receipts.
- **Dependencies**: FEAT-SEC-002, `NebiusNemotronClient`
- **Priority**: P0
- **Status**: `NOT_STARTED`
- **Implementation References**: `src/services/plannerService.ts`, `src/services/agentOrchestrator.ts`, `src/services/verificationEngine.ts`
- **Test References**: `TC-AGT-001`, `TC-AGT-002`, `TC-AGT-003`, `TC-AGT-004`, `TC-AGT-005`
- **Acceptance Criteria**: Consequential action cannot execute without user approval; task cannot transition to `VERIFIED` without independent read-back success; tamper-evident receipt stored.
- **Known Limitations**: External tool connectivity requires valid user OAuth tokens.

### FEAT-VOI-001 & FEAT-VOI-002: Text-to-Speech & Real-Time Duplex Voice
- **Product Area**: Voice Architecture
- **Description**: Text-to-speech reading using `gemini-3.8-flash-tts` and real-time live duplex voice conversation using `gemini-3.8-live`.
- **Dependencies**: `@google/genai`
- **Priority**: P1
- **Status**: `NOT_STARTED`
- **Implementation References**: `src/components/voice/LiveVoiceSession.tsx`, `src/services/voiceService.ts`
- **Test References**: `TC-GEM-002`
- **Acceptance Criteria**: Clear, natural audio output; hands-free interactive voice dialogue with interruption detection.
- **Known Limitations**: Live API requires stable WebSocket connection.

### FEAT-SEC-001, FEAT-SEC-002, FEAT-SEC-003 & FEAT-SEC-004: Security, Isolation & Sovereignty
- **Product Area**: Security & Privacy
- **Description**: Firebase Auth Google Sign-In, server-side Admin SDK token verification, zero-trust ABAC Firestore security rules, full data export, and atomic account purge.
- **Dependencies**: Firebase SDK
- **Priority**: P0
- **Status**: `NOT_STARTED`
- **Implementation References**: `src/services/firebaseAuth.ts`, `src/middleware/authMiddleware.ts`, `firestore.rules`
- **Test References**: `TC-AUTH-001`, `TC-AUTH-002`, `TC-AUTH-003`
- **Acceptance Criteria**: Mathematical multi-tenant isolation; zero client secrets; full data export in JSON format.
- **Known Limitations**: None.

### FEAT-UI-001 & FEAT-UI-002: Executive Cockpit & Responsive Navigation Shell
- **Product Area**: Product Experience
- **Description**: Modern, dignified, reflective design system with cohesive 11-module navigation shell, dark/light modes, loading states, empty states, and toast notifications.
- **Dependencies**: React 19, Tailwind CSS v4, Lucide icons, Motion
- **Priority**: P0
- **Status**: `NOT_STARTED`
- **Implementation References**: `src/components/layout/Shell.tsx`, `src/components/home/ExecutiveCockpit.tsx`
- **Test References**: `TC-UI-001`
- **Acceptance Criteria**: Seamless navigation across all 11 modules; zero layout shifts; highly responsive on desktop, tablet, and mobile.
- **Known Limitations**: None.
