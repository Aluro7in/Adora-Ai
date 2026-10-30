# ADORA AI — AGENT & MCP SPECIFICATION

**Document Version:** 1.0.0  
**Status:** Approved Architectural Baseline  
**Protocol:** Model Context Protocol (MCP) Compatible Tool Specification  
**Execution Standard:** Zero-Hallucination Verified Execution  

---

## 1. Agent Architecture & Execution Philosophy

Adora AI's agent engine translates high-level strategic goals into actionable Directed Acyclic Graphs (DAGs) of tasks. The system is governed by a strict invariant: **An action is never marked complete simply because an LLM claims it succeeded.**

### 1.1 Task State Machine
Every task in an Adora workflow undergoes a deterministic state progression:

```
┌─────────┐     ┌───────────────────┐     ┌──────────┐     ┌─────────┐
│ PLANNED │ ──> │ AWAITING_APPROVAL │ ──> │ APPROVED │ ──> │ RUNNING │
└─────────┘     └───────────────────┘     └──────────┘     └────┬────┘
                                                                │
                                                                ▼
┌──────────┐     ┌────────────┐     ┌──────────┐          ┌──────────┐
│ FAILED   │ <── │ UNVERIFIED │ <── │ VERIFIED │ <─────── │ EXECUTED │
└──────────┘     └────────────┘     └──────────┘          └──────────┘
```

- `PLANNED`: Task structured with tool, parameters, and dependency tree.
- `AWAITING_APPROVAL`: Task requires explicit human authorization (Tier 2).
- `APPROVED`: Authorized by authenticated user.
- `RUNNING`: Tool execution actively dispatched.
- `EXECUTED`: Tool returned a raw external response.
- `VERIFIED`: Independent verification engine confirmed state change in external system.
- `UNVERIFIED`: Tool executed but post-execution state verification failed or timed out.
- `FAILED`: Execution threw an error or encountered external rejection.
- `CANCELLED`: Aborted by user before execution.

---

## 2. Consequentiality Tiers & Human-in-the-Loop Gates

| Tier | Classification | Description | Execution Policy | Example Tools |
|------|----------------|-------------|------------------|---------------|
| **Tier 0** | Read-Only | Queries data without mutations. Zero external side effects. | Auto-executable by agent. | `memory_search`, `calendar_list_events`, `web_research` |
| **Tier 1** | Benign Mutation | Reversible, low-stakes local or sandbox updates. | Configurable auto-approval or notify. | `reflection_create`, `task_create`, `calendar_create_tentative_hold` |
| **Tier 2** | Consequential Mutation | Irreversible, external communications, or data deletion. | **Mandatory explicit user approval gate.** Cannot be bypassed. | `gmail_send_message`, `calendar_send_invites`, `sheets_overwrite_data`, `memory_delete` |

---

## 3. MCP-Compatible Tool Registry

Every tool registered in Adora adheres to the standard Model Context Protocol schema.

### 3.1 Core Tool Definitions

#### Tool 1: `memory_search`
- **Tier**: Tier 0
- **Input Schema**:
  ```json
  {
    "query": { "type": "string", "description": "Semantic search query" },
    "types": { "type": "array", "items": { "type": "string", "enum": ["episodic", "semantic", "relational", "procedural"] } },
    "limit": { "type": "integer", "default": 5 }
  }
  ```
- **Verification Strategy**: Read-only query; response validated against schema.

#### Tool 2: `reflection_create`
- **Tier**: Tier 1
- **Input Schema**:
  ```json
  {
    "rawText": { "type": "string", "minLength": 10 },
    "category": { "type": "string", "enum": ["personal", "professional", "strategic", "creative", "wellbeing"] },
    "tags": { "type": "array", "items": { "type": "string" }, "maxItems": 10 }
  }
  ```
- **Verification Strategy**: Independent `getDoc` read-back from Firestore asserting document existence and payload integrity.

#### Tool 3: `calendar_create_event`
- **Tier**: Tier 1
- **Input Schema**:
  ```json
  {
    "title": { "type": "string" },
    "startTime": { "type": "string", "format": "date-time" },
    "endTime": { "type": "string", "format": "date-time" },
    "description": { "type": "string" }
  }
  ```
- **Verification Strategy**: Post-creation `calendar.events.get` API call asserting event ID, start time, and status `confirmed`.

#### Tool 4: `gmail_send_message`
- **Tier**: Tier 2 (Mandatory Human Approval)
- **Input Schema**:
  ```json
  {
    "recipientEmail": { "type": "string", "format": "email" },
    "subject": { "type": "string" },
    "bodyText": { "type": "string" }
  }
  ```
- **Verification Strategy**: Read-back via `gmail.users.messages.get` querying message ID and asserting `SENT` label.

#### Tool 5: `web_research`
- **Tier**: Tier 0
- **Input Schema**:
  ```json
  {
    "query": { "type": "string" },
    "maxResults": { "type": "integer", "default": 3 }
  }
  ```
- **Verification Strategy**: Content verification and URL connectivity check.

---

## 4. Independent Verification Engine & Receipts

### 4.1 Verification Engine Workflow
```
[Agent Executes Tool]
        │
        ▼ (Raw result returned)
[Verification Dispatcher]
        │
        ├──> Queries target system directly using fresh read-only API call
        │
        ▼ (Target state returned)
[State Assertion Evaluator]
        │
        ├── Match? ──> Status: VERIFIED
        │
        └── Mismatch? ──> Status: UNVERIFIED / FAILED
```

### 4.2 Cryptographic Execution Receipts
Upon successful verification, the engine constructs a receipt stored in `/users/{userId}/receipts`:
- `inputPayloadHash`: SHA-256 hash of normalized input parameters.
- `outputPayloadHash`: SHA-256 hash of external response.
- `verificationProof`: Independent read-back document snapshot and query metadata.
- `timestamp`: Server timestamp of verification.
