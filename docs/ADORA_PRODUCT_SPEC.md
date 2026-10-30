# ADORA AI — PRODUCT SPECIFICATION

**Document Version:** 1.0.0  
**Status:** Approved Architectural Baseline  
**Product:** Adora AI  
**Tagline:** Reflective Intelligence. Adaptive Action.  
**Classification:** Authoritative Project Specification  

---

## 1. Product Vision & Operating Philosophy

Adora AI is a reflective intelligence and agentic execution platform that learns from a user's experiences through user-controlled persistent memory, helps discover evidence-backed life and operational patterns, and turns that structured understanding into meaningful, verifiable real-world actions.

### 1.1 The Central Operating Loop
Adora operates strictly through an iterative five-stage cognitive lifecycle:

```
┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│   CAPTURE    │ ──> │   UNDERSTAND   │ ──> │     ACT      │
└──────────────┐     └────────────────┘     └──────────────┘
       ▲                                            │
       │                                            ▼
┌──────────────┐                             ┌──────────────┐
│    LEARN     │ <────────────────────────── │    VERIFY    │
└──────────────┘                             └──────────────┘
```

1. **CAPTURE**: Ingest experiences via rich text, audio voice reflections with verbatim transcription, tagged metadata, and contextual attachments.
2. **UNDERSTAND**: Extract events, decisions, goals, obstacles, lessons, entities, and recurring themes. Differentiate hypothesis from fact.
3. **ACT**: Formulate structured multi-step plans with explicit user approval gates, tool execution contracts, and dry-run previews.
4. **VERIFY**: Read back actual real-world state independently from tool logs or model claims before declaring success. Produce non-repudiable execution receipts.
5. **LEARN**: Update procedural and relational memories based on verified outcomes, reinforcing habits and tuning future plans.

### 1.2 Epistemic Integrity and Non-Diagnostic Principles
- **Separation of Concerns**: Adora maintains strict provenance between:
  - What the user literally stated (`verbatim_user_input`).
  - What the AI inferred or hypothesized (`ai_inference`).
  - What the user explicitly confirmed or edited (`user_approved_fact`).
  - What an agent planned (`agent_plan`).
  - What an external tool executed (`tool_execution_log`).
  - What was independently verified (`verified_outcome`).
- **Non-Diagnostic Policy**: Adora is **not** a psychological diagnostic, medical, or clinical mental health tool. AI interpretations are presented as hypotheses to assist reflection, not clinical truths. Users retain complete rights to accept, edit, dispute, or erase any inference.

---

## 2. Core Functional Modules

### 2.1 Module 1: Home (Executive Cockpit)
- **Daily Reflection Pulse**: Status of recent entries, streak, and temporal cadence.
- **Active Plans & Action Queue**: Pending approvals, active agent executions, and verification badges.
- **Emerging Insights**: Candidate patterns awaiting confirmation or rejection.
- **Memory Snapshot**: Quick lookup of active goals, working preferences, and key relationships.

### 2.2 Module 2: Reflect (Capture & Structured Journaling)
- **Multi-Modal Capture**:
  - Structured text entry with markdown support and mood/energy tagging.
  - Audio voice recorder with real-time waveform and audio transcription powered by `gemini-3.5-transcribe`.
  - Transcript preview, audio playback, and inline correction prior to submission.
- **Context & Categorization**: Personal, Professional, Strategic, Creative, Well-being.
- **Deep Extraction Pipeline**:
  - Triggers server-side NVIDIA Nemotron inference via Nebius Token Factory.
  - Generates candidate entities: Events, Decisions, Obstacles, Lessons, Themes, Next Questions.
  - Displays extraction results in an "Analysis Drawer" for user review before committing to memory.

### 2.3 Module 3: Adora Chat (Conversational Intelligence)
- **Natural Language Dialogue**: Interactive multi-turn chat grounded in user memory.
- **RAG Provenance Cards**: Every response citing personal history includes interactive footnote chips linking directly to episodic reflections or semantic facts.
- **High-Thinking Reasoning**: Option to activate deep reasoning mode (via `gemini-4-argon` with `thinkingLevel: HIGH`) for complex strategic introspection.
- **Real-Time Voice Conversation**: Optional low-latency duplex voice mode using `gemini-3.8-live` and text-to-speech with `gemini-3.8-flash-tts`.

### 2.4 Module 4: Memory Vault (Persistent Memory Management)
- **Four-Tier Cognitive Hierarchy**:
  1. *Episodic Memory*: Immutable chronological logs of experiences, journal entries, and life events.
  2. *Semantic Memory*: User-validated facts, declared preferences, durable values, and long-term goals.
  3. *Relational Memory*: Semantic links connecting experiences to people, projects, decisions, and outcomes.
  4. *Procedural Memory*: Validated workflows, habits, heuristics, and agent instruction guidelines.
- **User Governance**: Full CRUD, search, filter, export (JSON/Markdown), and deletion cascade.

### 2.5 Module 5: Insights (Evidence-Backed Pattern Discovery)
- **Pattern Detection Engine**: Analyzes recurring clusters across reflections over time.
- **Evidence & Counter-Evidence**: Shows supporting citations and counter-examples.
- **Confidence Calibration**: Expresses pattern strength probabilistically without implying causal links.
- **Actionable Controls**: `Confirm Pattern`, `Edit Nuance`, `Reject/Dismiss`.

### 2.6 Module 6: Reflection Grove (Interactive Knowledge Graph)
- **Visual Memory Graph**:
  - Nodes: Reflections, Themes, Decisions, Goals, Tasks, Outcomes, Verified Facts.
  - Edges: Candidate (dashed, low-contrast) vs. Confirmed (solid, color-coded).
- **Interactive Force-Directed Exploration**: Filter by timeframe, node type, and cluster density.
- **Node Inspector**: Full provenance pane displaying source text and timestamp.

### 2.7 Module 7: Workflows (Agentic Planning)
- **Goal-to-DAG Decomposition**: Translates natural-language goals into structured Directed Acyclic Graphs (DAGs) of tasks with strict dependency ordering.
- **Consequentiality Tiers**:
  - *Tier 0 (Read-Only)*: Safe auto-execution (e.g., search memory, draft text).
  - *Tier 1 (Mild Mutation)*: Non-destructive external actions (e.g., create calendar event).
  - *Tier 2 (Consequential / Irreversible)*: Mandatory explicit user approval gate (e.g., send email, delete resource, external API write).

### 2.8 Module 8: Tasks (Tactical Execution Tracking)
- **Unified Task Board**: Combines personal tasks with agent-assigned sub-tasks.
- **State Machine**: `PLANNED` → `AWAITING_APPROVAL` → `APPROVED` → `RUNNING` → `EXECUTED` → `VERIFIED` (or `FAILED` / `CANCELLED` / `UNVERIFIED`).

### 2.9 Module 9: Execution History & Receipts
- **Tamper-Evident Receipts**: Detailed logs containing tool ID, input payload digest, execution timestamp, external response hash, and independent verification proof.
- **Verification Diff**: Comparison between intended output and measured reality.

### 2.10 Module 10: Integrations & MCP
- **MCP Tool Catalog**: Clean model context protocol interface for Google Calendar, Gmail, Google Drive, Google Sheets, Memory Retrieval, and Web Research.
- **Connection Health & Permissions**: Clear status indication of authorized scopes with revocation toggles.

### 2.11 Module 11: Settings & Data Sovereignty
- **Account & Security**: Google Sign-In profile, session info, token refresh state.
- **Data Export & Deletion**: Complete "Download My Data" and cryptographic purge options.
- **Inference Configuration**: Transparent provider latency, model selection status, and quota tracking.

---

## 3. User Personas & Primary Workflows

### Persona 1: The Executive Strategist
- *Need*: Unpack high-stakes decisions, identify recurring cognitive blindspots, and plan organizational execution.
- *Loop*: Dictates reflection after quarterly review -> Nemotron extracts core trade-offs -> Confirms decision node -> Triggers calendar and email preparation workflow with approval checkpoints.

### Persona 2: The Continuous Learner & Creator
- *Need*: Synthesize books, project debriefs, and creative experiments into structured reusable procedural memory.
- *Loop*: Writes reflection -> System links to existing themes in Reflection Grove -> Procedural heuristics updated -> Agent drafts weekly execution rhythm.

---

## 4. Acceptance Criteria & Quality Gates
- **Zero Hallucinated Success**: No agent task may transition to `VERIFIED` without an independent read-back query returning expected state.
- **Strict User Isolation**: Multi-tenant authorization enforced at both Firestore security rules and backend Express middleware.
- **Auditability**: Every AI inference must link to at least one valid source reflection document ID.
