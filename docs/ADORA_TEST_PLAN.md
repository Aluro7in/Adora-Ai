# ADORA AI — MASTER TEST PLAN & VERIFICATION MATRIX

**Document Version:** 1.0.0  
**Status:** Approved Architectural Baseline  
**Verification Standard:** Non-Mocked Service Boundary Testing  

---

## 1. Testing Strategy & Principles

Adora AI enforces strict non-negotiable verification gates. No feature is marked `IMPLEMENTED` without automated compilation, and no feature is marked `TESTED` without recorded test executions against real boundaries.

```
┌────────────────────────────────────────────────────────┐
│                   VERIFICATION GATES                   │
│                                                        │
│  1. STATIC TYPE SAFETY: tsc --noEmit (Zero errors)     │
│  2. PRODUCTION BUILD: vite build (Clean bundle)        │
│  3. SCHEMA INVARIANTS: Zod payload boundary checks     │
│  4. AUTH ISOLATION: Multi-tenant boundary tests        │
│  5. LIVE INFERENCE PROOF: Real Nebius / Gemini calls   │
│  6. AGENT VERIFICATION: Independent state read-back    │
│  7. RECEIPT INTEGRITY: SHA-256 payload audit hashes    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Test Suites & Verification Criteria

### 2.1 Suite 1: Authentication & Authorization Security
- **TC-AUTH-001**: Request without `Authorization` header returns HTTP 401 with `UNAUTHENTICATED`.
- **TC-AUTH-002**: Request with forged/expired token returns HTTP 401 with `INVALID_TOKEN`.
- **TC-AUTH-003 (IDOR Isolation)**: Authenticated User A attempting to fetch `/users/{UserB}/reflections/{id}` receives HTTP 403 `PERMISSION_DENIED`.
- **TC-AUTH-004**: Authenticated user identity is extracted strictly from the verified Firebase token, ignoring any `userId` passed in request bodies.

### 2.2 Suite 2: Nebius Token Factory & NVIDIA Nemotron Inference
- **TC-NEM-001 (Connection & Auth)**: Server dispatches health check payload to Nebius OpenAI-compatible endpoint. Asserts HTTP 200 and model identity in response headers.
- **TC-NEM-002 (Structured Entity Extraction)**: Sends a complex journal entry. Asserts returned JSON contains valid arrays of `events`, `decisions`, `goals`, `obstacles`, `lessons`, `themes`, and `questions`.
- **TC-NEM-003 (Hypothesis Calibration)**: Asserts that AI extracted outputs do not claim absolute psychological or clinical diagnostic certainty.
- **TC-NEM-004 (Timeout & Retry)**: Simulates gateway lag; asserts exponential backoff and structured error envelope without app crash.

### 2.3 Suite 3: Gemini Multimodal Sensory Modalities
- **TC-GEM-001 (Audio Transcription)**: Transcribes sample audio buffer via `gemini-3.5-transcribe`. Asserts returned transcript matches spoken phrases.
- **TC-GEM-002 (Text-to-Speech)**: Synthesizes text reflection into speech via `gemini-3.8-flash-tts`. Asserts valid WAV audio payload returned.
- **TC-GEM-003 (Image Note Analysis)**: Submits image buffer of handwritten notes to `gemini-4-argon`. Asserts legible markdown text extraction.
- **TC-GEM-004 (High-Thinking Reasoning)**: Submits complex strategic prompt to `gemini-4-argon` with `thinkingLevel: HIGH`. Asserts in-depth structured output.

### 2.4 Suite 4: Memory Vault & RAG
- **TC-RAG-001 (Embedding Ingestion)**: New approved memory generates vector embedding via `gemini-embedding-2-preview` and stores array in Firestore.
- **TC-RAG-002 (Hybrid Retrieval)**: Query retrieves top-K memories with scores > threshold, correctly citing source reflection IDs.
- **TC-RAG-003 (No-Match Guard)**: Queries with no semantically relevant memories return explicit empty result message rather than hallucinated context.
- **TC-RAG-004 (Deletion Cascade)**: Deleting a reflection purges or flags linked candidate memories and graph nodes.

### 2.5 Suite 5: Agent Execution, Approval Gates & Receipts
- **TC-AGT-001 (DAG Planning)**: Goal decomposes into valid dependency-ordered task graph.
- **TC-AGT-002 (Tier 2 Gatekeeper)**: Consequential task (e.g., `gmail_send_message`) transitions to `AWAITING_APPROVAL` and blocks execution until explicit user sign-off.
- **TC-AGT-003 (Execution Rejection)**: Direct call to execute an unapproved Tier 2 task returns HTTP 403 `APPROVAL_REQUIRED`.
- **TC-AGT-004 (Independent Verification)**: Tool returns external response; verification engine independently queries target system. Only transitions to `VERIFIED` if target state is confirmed.
- **TC-AGT-005 (Cryptographic Receipt)**: Successful execution records receipt in Firestore containing SHA-256 digests of input and output payloads.

---

## 3. Test Execution Record Protocol
Every test run is logged in repository test notes with:
- Timestamp.
- Test Case ID.
- Input summary.
- Raw HTTP status and payload hash.
- Latency (ms).
- Result: `PASS` / `FAIL`.
