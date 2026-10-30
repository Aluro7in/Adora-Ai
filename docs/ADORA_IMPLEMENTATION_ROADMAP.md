# ADORA AI — PHASED IMPLEMENTATION ROADMAP

**Document Version:** 1.0.0  
**Status:** Approved Master Roadmap  
**Methodology:** Controlled Phase-Gated Engineering  

---

## Roadmap Overview

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  Phase 0  │ ──> │  Phase 1  │ ──> │  Phase 2  │ ──> │  Phase 3  │
│ Specs &   │     │ Project   │     │ Firebase  │     │ Nemotron  │
│ Arch      │     │ Shell     │     │ & Auth    │     │ & Models  │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
                                                            │
                                                            ▼
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  Phase 8  │ <── │  Phase 7  │ <── │  Phase 6  │ <── │  Phase 4/5│
│ Hardening │     │ Voice &   │     │ Agent &   │     │ Memory &  │
│ & Deploy  │     │ Workspace │     │ Receipts  │     │ Grove     │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
```

---

## Phase Details

### Phase 0: Requirements & System Architecture (Current Phase)
- **Goal**: Full environment discovery, architectural baseline, threat modeling, and permanent repository documentation.
- **Deliverables**:
  - Full project specifications in `/docs/`.
  - Initialized `metadata.json` and synchronized `index.html`.
  - Comprehensive feature registry.
  - Phase 0 comprehensive assessment report.
- **Exit Gate**: All 13 core specification documents in place; platform constraints resolved.

### Phase 1: Project Foundation & Core Shell
- **Goal**: Implement authoritative full-stack Node.js server (`server.ts`), modular Express API routing, responsive modern navigation shell, design system, and shared TypeScript contracts.
- **Deliverables**:
  - Express server running with Vite middleware in development and static bundle in production.
  - Standardized API router `/api/v1` and error handling envelope.
  - Responsive multi-module navigation shell (Home, Reflect, Chat, Vault, Insights, Grove, Workflows, Tasks, Receipts, Integrations, Settings).
  - Modern design tokens (Tailwind CSS v4, Lucide icons, Motion transitions).
- **Exit Gate**: Clean TypeScript compilation (`tsc --noEmit`), app boots smoothly on port 3000.

### Phase 2: Firebase Foundation & Security
- **Goal**: Provision Firestore and Firebase Auth, implement security rules, and build server-side Admin SDK verification.
- **Deliverables**:
  - `firebase-blueprint.json` modeling all entities.
  - Production-grade `firestore.rules` adhering to the Eight Pillars of Hardened Rules.
  - Firebase client provider with Google Sign-In popup support.
  - Server-side `requireAuth` middleware validating Firebase ID tokens.
  - Data repository layer for user-isolated data access.
- **Exit Gate**: Successful sign-in, user token verified by server, zero rule bypasses.

### Phase 3: Nebius Token Factory & Multimodal Foundation
- **Goal**: Implement server-side client for NVIDIA Nemotron via Nebius Token Factory, alongside Gemini multimodal endpoints.
- **Deliverables**:
  - `NebiusNemotronClient` calling `https://api.studio.nebius.ai/v1` with `NEBIUS_API_KEY`.
  - Provider health check and token/latency logging.
  - `gemini-3.5-transcribe` audio speech-to-text service.
  - `gemini-3.8-flash-tts` text-to-speech service.
  - `gemini-4-argon` high-thinking and visual note inspection service.
- **Exit Gate**: Successful roundtrip inference to Nemotron with token metrics recorded; audio transcribed cleanly via Gemini.

### Phase 4: Reflection Capture & Memory Vault
- **Goal**: Build multi-modal reflection capture, structured entity extraction, 4-tier memory persistence, and hybrid RAG search.
- **Deliverables**:
  - Reflection capture UI (rich text + audio recorder with waveform and transcript preview).
  - Server-side Nemotron extraction pipeline (events, decisions, obstacles, lessons, themes, questions).
  - Memory Vault UI (Episodic, Semantic, Relational, Procedural).
  - Vector embedding pipeline (`gemini-embedding-2-preview`) and hybrid search.
- **Exit Gate**: User captures a voice reflection, transcript is edited, Nemotron extracts entities, user approves memories into the Vault, and semantic search accurately retrieves them.

### Phase 5: Insights Discovery & Reflection Grove
- **Goal**: Implement candidate pattern synthesis and interactive knowledge graph visualization.
- **Deliverables**:
  - Pattern detection service querying historical reflections and generating hypotheses with supporting/counter evidence.
  - User controls to confirm, refine, or dismiss candidate patterns.
  - Reflection Grove interactive force-directed graph rendering nodes and candidate/confirmed edges.
- **Exit Gate**: Graph displays connected memories and reflections with distinct visual treatments for candidate vs. confirmed links.

### Phase 6: Agent Planning, MCP Tools & Verified Execution
- **Goal**: Implement goal-to-DAG planner, MCP tool registry, consequentiality approval gates, independent verifier, and receipt ledger.
- **Deliverables**:
  - Planner decomposing goals into structured tasks with dependency management.
  - Human-in-the-loop approval gate for Tier 2 operations.
  - Tool execution engine (`memory_search`, `reflection_create`, `calendar_create_event`, `gmail_send_message`, `web_research`).
  - Independent verification engine performing real read-backs.
  - Immutable cryptographic receipt generation with SHA-256 payload hashes.
- **Exit Gate**: Agent plans a workflow; Tier 2 task halts for approval; on approval, tool executes; verifier confirms state; receipt is recorded.

### Phase 7: Real-Time Voice Duplex & Workspace Integrations
- **Goal**: Connect live duplex conversation and real Google Workspace OAuth integrations.
- **Deliverables**:
  - `gemini-3.8-live` duplex voice dialogue.
  - Real Google Calendar and Gmail OAuth integration connectors.
  - Integration health and scope revocation controls.
- **Exit Gate**: Live voice reflection stream functions with interruption handling; calendar event creates and syncs.

### Phase 8: Hardening, Observability & Cloud Run Deployment
- **Goal**: Run end-to-end test matrix, conduct security audit, optimize performance, and prepare Cloud Run container.
- **Deliverables**:
  - Complete execution of test cases in `ADORA_TEST_PLAN.md`.
  - Rate limiting, audit logs, and performance profiling.
  - Production build verification (`npm run build`).
- **Exit Gate**: Zero build errors, 100% test pass rate, verified deployment readiness.
