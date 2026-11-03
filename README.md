# Adora AI — Reflective Intelligence. Adaptive Action.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%7C%207.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22_LTS-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

**Adora AI** is a reflective intelligence and agentic execution platform. It learns from your life and work experiences through user-controlled persistent memory, discovers evidence-backed patterns, and turns structured understanding into meaningful, independently verified real-world actions.

---

## Table of Contents

- [The 5-Stage Cognitive Loop](#the-5-stage-cognitive-loop)
- [Core Functional Modules](#core-functional-modules)
- [Technical Architecture](#technical-architecture)
- [AI & Reasoning Engines](#ai--reasoning-engines)
- [Security, Privacy & Epistemic Integrity](#security-privacy--epistemic-integrity)
- [Directory Structure](#directory-structure)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Testing & Quality Verification](#testing--quality-verification)
- [License](#license)

---

## The 5-Stage Cognitive Loop

Adora operates strictly through an iterative five-stage cognitive lifecycle designed to prevent unverified hallucinations and keep the user in sovereign control:

```text
┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│   CAPTURE    │ ──> │   UNDERSTAND   │ ──> │     ACT      │
└──────────────┘     └────────────────┘     └──────────────┘
       ▲                                            │
       │                                            ▼
┌──────────────┐                             ┌──────────────┐
│    LEARN     │ <────────────────────────── │    VERIFY    │
└──────────────┘                             └──────────────┘
```

1. **CAPTURE**: Record experiences via rich text, voice reflections with real-time Web Speech & audio transcription, category tagging, and mood/energy markers.
2. **UNDERSTAND**: Deconstruct reflections into structured entities (Events, Decisions, Goals, Obstacles, Lessons, Themes) using NVIDIA Nemotron and Google Gemini.
3. **ACT**: Formulate goal-directed Directed Acyclic Graphs (DAGs) with strict consequentiality tiers and mandatory user approval gates for high-stakes actions.
4. **VERIFY**: Read back actual real-world state independently before declaring success; generate tamper-evident execution receipts.
5. **LEARN**: Update relational and procedural memories to refine future recommendations and agent workflows.

---

## Core Functional Modules

| Module | Description | Key Capabilities |
| :--- | :--- | :--- |
| **Cockpit (Home)** | Executive mission control | Daily reflection cadence, streak tracking, active action queue, pending approvals, and emerging insights. |
| **Reflect** | Structured capture & journaling | Rich text entry, audio recording with live speech-to-text, dynamic tag suggester (`#focus`, `#todo`, `#discovery`), sentiment indicator, and Gemini 1-sentence core takeaway toast. |
| **Adora Chat** | Memory-grounded intelligence | Conversational interface powered by hybrid RAG. Responses feature interactive source citation chips directly referencing episodic memories. |
| **Memory Vault** | Sovereign 4-tier cognitive memory | Manages **Episodic** (chronological logs), **Semantic** (validated facts), **Relational** (connections), and **Procedural** (heuristics/habits) memory with deletion cascade. |
| **Insights** | Pattern discovery engine | Identifies recurring behavioral or operational patterns across reflections, supported by both evidence and counter-evidence citations. |
| **Reflection Grove** | Interactive knowledge graph | Force-directed memory visualizer illustrating connections between reflections, decisions, goals, and verified outcomes. |
| **Workflows** | Agentic planning engine | Goal-to-DAG decomposition with strict dependency ordering and safety tiers. |
| **Tasks** | Tactical execution board | State machine tracking tasks from `PLANNED` through `AWAITING_APPROVAL`, `APPROVED`, `RUNNING`, to `VERIFIED`. |
| **Execution Receipts** | Tamper-evident ledger | Cryptographic digests of tool calls, inputs, outputs, timestamps, and independent verification proofs. |
| **Integrations (MCP)** | Model Context Protocol tools | Real and adapter connectors for Google Calendar, Gmail, Google Drive, Google Sheets, and Web Research. |
| **Settings** | Data sovereignty & governance | Light/Dark mode switcher, complete "Download My Data" export, cryptographic purge, and live provider health monitoring. |

---

## Technical Architecture

```text
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|                            (React 19 + TypeScript)                                |
|  - UI: Tailwind CSS v4, Motion, Lucide Icons, Glassmorphic HUD                    |
|  - Navigation: Modular Shell with 11 functional domains                           |
|  - State: Theme persistence (Light/Dark), Audio recording, Toast alerts           |
|  - API: Typed Client communicating via /api/v1/*                                  |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼ HTTPS (Port 3000)
+-----------------------------------------------------------------------------------+
|                            AUTHORITATIVE BACKEND                                  |
|                          (Node.js 22 LTS + Express)                               |
|  - Correlation ID injection & Audit logging                                       |
|  - Firebase Admin SDK Token Verification & RBAC                                   |
|  - Zod Request Schema Validation & Sanitization                                   |
|  - RAG Engine: Hybrid Dense Vector + Lexical Search                               |
|  - Multi-tier Consequentiality Guardrails & Idempotency engine                    |
+-----------------------------------------------------------------------------------+
             │                                   │                    │
             ▼                                   ▼                    ▼
+-------------------------+     +------------------------+  +-----------------------+
|    AI & INFERENCE       |     |   DATA & PERSISTENCE   |  |   TOOLS & SERVICES    |
| - NVIDIA Nemotron       |     | - Cloud Firestore      |  | - MCP Tool Contracts  |
|   (Nebius Token Factory)|     | - Firebase Auth        |  | - Google Workspace    |
| - Google Gemini         |     | - In-Memory Fallback   |  | - Independent State   |
|   (Takeaways & Audio)   |     |   (for offline dev)    |  |   Verification Engine |
+-------------------------+     +------------------------+  +-----------------------+
```

---

## AI & Reasoning Engines

Adora employs a disciplined dual-model architecture:

1. **NVIDIA Nemotron (`nvidia/nemotron-4-340b-instruct` / `nvidia/nemotron-3-8b-instruct`)**:
   - Accessed server-side via the **Nebius Token Factory** OpenAI-compatible API.
   - Drives structured reflection entity extraction, deep strategic reasoning, goal decomposition, and multi-step plan formulation.
   - Fallback protection: Never silently returns ungrounded guesses if the provider fails.

2. **Google Gemini (`@google/genai`)**:
   - `gemini-3.8-flash`: Rapid generation of 1-sentence reflection core takeaways displayed immediately upon saving.
   - `gemini-3.5-transcribe`: High-fidelity audio transcription for recorded voice reflections.

---

## Security, Privacy & Epistemic Integrity

- **Zero Client Secrets**: All API keys (`NEBIUS_API_KEY`, `GEMINI_API_KEY`, Firebase Admin credentials) reside strictly on the server.
- **Tenant Isolation**: Multi-tenant data isolation strictly enforced via user-scoped Firestore paths: `/users/{userId}/*`.
- **Strict Provenance Separation**: Verbatim user input is never conflated with AI inferences, agent plans, or verified outcomes.
- **Non-Diagnostic Policy**: Adora is not a medical or psychiatric diagnostic tool. Hypotheses are presented as exploratory insights, and users retain full authority to accept, edit, or reject any inference.
- **Consequentiality Tiers**:
  - **Tier 0 (Read-Only)**: Autonomous execution (e.g., search memory, draft text).
  - **Tier 1 (Mild Mutation)**: Reversible changes (e.g., calendar block creation).
  - **Tier 2 (Consequential)**: Mandatory explicit user approval gate (e.g., emails, external updates, destructive mutations).
- **Independent Verification**: No task is marked `VERIFIED` without an out-of-band read-back confirmation.

---

## Directory Structure

```text
├── backend/                  # Python test suite & backend contracts
├── docs/                     # Authoritative architecture and product specs
│   ├── ADORA_PRODUCT_SPEC.md
│   ├── ADORA_SYSTEM_ARCHITECTURE.md
│   ├── ADORA_AI_AND_RAG_ARCHITECTURE.md
│   ├── ADORA_AGENT_AND_MCP_SPEC.md
│   ├── ADORA_API_CONTRACT.md
│   ├── ADORA_DATABASE_SCHEMA.md
│   ├── ADORA_SECURITY_AND_PRIVACY.md
│   └── ADORA_DEPLOYMENT_GUIDE.md
├── server.ts                 # Full-stack Node.js + Express server
├── src/
│   ├── app/                  # Application root & shell routing
│   ├── components/           # Shared UI components (Modal, Toast, Button, Shell)
│   ├── features/             # Feature domain screens
│   │   ├── home/             # Executive Cockpit
│   │   ├── reflect/          # Capture & Journaling
│   │   ├── chat/             # Grounded Dialogue
│   │   ├── memory/           # Memory Vault
│   │   ├── insights/         # Pattern Discovery
│   │   ├── grove/            # Interactive Knowledge Graph
│   │   ├── workflows/        # Agentic Planning
│   │   ├── tasks/            # Task Board
│   │   ├── execution/        # Receipts & Verification Ledger
│   │   ├── integrations/     # MCP Tool Catalog
│   │   └── settings/         # Privacy, Themes & Configuration
│   ├── services/             # Typed API & authentication clients
│   ├── types/                # Domain models, request/response contracts
│   └── utils/                # Sentiment analysis, tag suggester, formatters
├── firestore.rules           # Cloud Firestore multi-tenant security rules
├── package.json              # Dependencies and scripts
└── vite.config.ts            # Vite build configuration
```

---

## Quick Start

### Prerequisites

- **Node.js**: `v22.x` or higher recommended
- **npm**: `v10.x` or higher
- Optional: Python 3.10+ (for running the backend test suite)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-org/adora-ai.git
cd adora-ai
npm install
```

### 2. Configure Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

Edit `.env` with your API credentials (see [Environment Configuration](#environment-configuration)).

### 3. Start Development Server

```bash
npm run dev
```

The application will start on **`http://localhost:3000`** with Vite HMR and Express middleware enabled.

### 4. Build for Production

```bash
npm run build
npm start
```

---

## Environment Configuration

Key configuration parameters (set in `.env` or your cloud secrets manager):

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `3000` |
| `NODE_ENV` | Runtime environment | `development` |
| `GEMINI_API_KEY` | Google Gemini API Key | *(Provided via environment)* |
| `NEBIUS_API_KEY` | Nebius Token Factory API Key | `your_nebius_api_key` |
| `NEBIUS_BASE_URL` | Nebius API Endpoint | `https://api.tokenfactory.nebius.com/v1` |
| `NEBIUS_MODEL` | Nemotron Model Identifier | `nvidia/nemotron-4-340b-instruct` |
| `FIREBASE_PROJECT_ID`| Target Firebase Project | `ai-studio-adoraai-...` |
| `LOG_LEVEL` | Logging verbosity | `info` |

---

## Testing & Quality Verification

Run type checking, linting, and backend test suites:

```bash
# TypeScript compilation & typecheck
npm run lint

# Client & server build check
npm run build

# Python contract & verification unit tests
PYTHONPATH=backend python3 -m unittest discover -s backend/tests -p "test_*.py"
```

---

## License

This project is licensed under the Apache-2.0 License. See the [LICENSE](./LICENSE) file for details.
