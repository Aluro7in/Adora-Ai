# ADORA AI — ARCHITECTURAL DECISION RECORDS (ADR)

**Document Version:** 1.0.0  
**Status:** Active Historical Record  

---

## ADR-001: Express on Node.js as Authoritative Full-Stack Backend
- **Context**: Google AI Studio provides a Node.js development and execution runtime running on port 3000. While future microservices may run Python on Cloud Run, introducing a Python runtime inside this applet violates platform constraints.
- **Decision**: Build the authoritative backend entirely in TypeScript using Express mounted alongside Vite dev middleware. All security, authentication, orchestration, and API handling reside in Node.js.
- **Consequences**: High development speed, unified TypeScript types across frontend and backend, single container deployment.

---

## ADR-002: Nebius Token Factory & NVIDIA Nemotron as Mandatory Reasoning Engine
- **Context**: The product specification mandates NVIDIA Nemotron via Nebius Token Factory as the core intelligence engine. Replacing Nemotron with another model or faking the integration is strictly prohibited.
- **Decision**: Integrate Nebius Token Factory over its OpenAI-compatible endpoint (`https://api.studio.nebius.ai/v1`) using server-side secret `NEBIUS_API_KEY`. Route all reflection entity extractions, pattern discoveries, memory reasoning, conversational chat, and workflow planning through NVIDIA Nemotron.
- **Consequences**: Adheres to strict architectural mandate. Ensures genuine model execution with logged token usage and latency.

---

## ADR-003: Complementary Gemini Multimodal Sensory Specialization
- **Context**: The user requirements specify advanced audio transcription (`gemini-3.5-transcribe`), high-thinking reasoning (`gemini-4-argon` with `thinkingLevel: HIGH`), photo analysis (`gemini-4-argon`), live voice (`gemini-3.8-live`), and TTS (`gemini-3.8-flash-tts`).
- **Decision**: Deploy `@google/genai` on the server as a dedicated multimodal sensory specialist. Gemini handles audio transcription, TTS, live voice, handwritten note inspection, and deep high-thinking calculations, while Nemotron drives core reflective intelligence.
- **Consequences**: Best-in-class sensory processing combined with dedicated Nemotron reasoning.

---

## ADR-004: Cloud Firestore with User Root Partitioning
- **Context**: Adora stores sensitive reflective diaries, memories, and action receipts requiring absolute multi-tenant privacy.
- **Decision**: Partition all application data under `/users/{userId}/*`. Enforce Firestore security rules verifying `request.auth.uid == userId` and validate tokens server-side via Firebase Admin SDK.
- **Consequences**: Mathematical impossibility of cross-tenant data leaks. Natural scalability and clean data export/purge workflows.

---

## ADR-005: Four-Tier Cognitive Memory Hierarchy
- **Context**: Treating all user data as flat text leads to noisy retrieval and poor agent grounding.
- **Decision**: Structure memory into 4 categories:
  1. *Episodic*: Chronological raw experiences.
  2. *Semantic*: User-approved facts and declared preferences.
  3. *Relational*: Links between entities, decisions, and goals.
  4. *Procedural*: Validated workflows and operating habits.
- **Consequences**: Clean RAG indexing, high-precision retrieval, clear user mental model.

---

## ADR-006: Zero-Hallucination Verified Execution Standard
- **Context**: LLMs frequently hallucinate tool completion ("I sent the email") even when operations fail or are skipped.
- **Decision**: Tasks cannot transition to `VERIFIED` without an independent state read-back confirming external system mutation. An immutable receipt with SHA-256 digests is minted for every verified action.
- **Consequences**: Complete auditability, user trust, prevention of phantom agent actions.

---

## ADR-007: Consequentiality Tiers & Human Approval Gates
- **Context**: Autonomous agents executing write actions on personal accounts (Gmail, Calendar, deletion) present safety risks.
- **Decision**: Classify all actions into Tier 0 (Read), Tier 1 (Benign Mutation), and Tier 2 (Consequential). Mandate explicit user UI approval for Tier 2 before execution.
- **Consequences**: Zero unauthorized external communications or destructive operations.

---

## ADR-008: Epistemic Non-Diagnostic Hypothesis Framing
- **Context**: Psychological self-reflection tools can easily stray into dangerous diagnostic territory.
- **Decision**: Explicitly classify all AI-generated patterns as hypotheses rather than medical, psychological, or clinical facts. UI clearly separates verbatim user speech from AI inferences.
- **Consequences**: High ethical alignment, user agency, reduction of cognitive bias.
