# ADORA AI — AI & RAG ARCHITECTURE SPECIFICATION

**Document Version:** 1.0.0  
**Status:** Approved Architectural Baseline  
**Inference Providers:** Nebius Token Factory (NVIDIA Nemotron) + Google GenAI Multimodal SDK  

---

## 1. Dual AI Engine Paradigm

Adora AI implements a dual-engine architecture separating cognitive reasoning and semantic analysis from specialized multimodal sensory pipelines.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              ADORA AI ENGINE                               │
│                                                                            │
│  ┌──────────────────────────────────────┐  ┌────────────────────────────┐  │
│  │     NEBIUS TOKEN FACTORY             │  │       GOOGLE GENAI         │  │
│  │   (Authoritative Reasoning Engine)   │  │   (Multimodal Specialist)  │  │
│  │                                      │  │                            │  │
│  │ • Model: NVIDIA Nemotron             │  │ • gemini-3.5-transcribe    │  │
│  │   (nemotron-4-340b / 3-8b / 3.5)     │  │   (Audio Speech-to-Text)   │  │
│  │ • Reflection Entity Extraction       │  │ • gemini-3.8-flash-tts     │  │
│  │ • Hypothesis & Pattern Synthesis     │  │   (Text-to-Speech)         │  │
│  │ • Grounded Conversational RAG        │  │ • gemini-3.8-live          │  │
│  │ • Goal-to-DAG Workflow Planning      │  │   (Duplex Voice Streaming) │  │
│  │ • Tool Selection & Heuristics        │  │ • gemini-4-argon           │  │
│  │ • OpenAI-Compatible REST Protocol    │  │   (High-Thinking & Vision) │  │
│  │ • Server Secret: NEBIUS_API_KEY      │  │ • gemini-embedding-2-prev  │  │
│  └──────────────────────────────────────┘  └────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Nebius Token Factory & NVIDIA Nemotron Architecture

### 2.1 Provider Configuration
- **Base Endpoint**: `https://api.studio.nebius.ai/v1`
- **Authentication**: `Bearer ${process.env.NEBIUS_API_KEY}`
- **Default Reasoning Model**: `nvidia/nemotron-4-340b-instruct` or `nvidia/nemotron-3-8b-instruct` (fallback / low-latency: `nvidia/nemotron-3.5-lightning`).
- **Telemetry & Logging**:
  - Request Correlation ID (`X-Correlation-ID`).
  - Total tokens (prompt + completion).
  - Round-trip latency (ms).
  - Model ID used.
  - Zero logging of sensitive user journal content.

### 2.2 Provider Abstraction Layer (`NebiusNemotronClient`)
The application defines an interface `ILLMProvider` so that runtime models can be adapted through server environment variables without code modification:

```typescript
export interface LLMRequestOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface LLMResponse {
  text: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  latencyMs: number;
  model: string;
}
```

### 2.3 Core Nemotron Prompting Blueprints
1. **Reflection Entity Extraction**: Structured JSON extraction isolating:
   - `events`: concrete occurrences.
   - `decisions`: explicit trade-offs and choices.
   - `goals`: desired future states.
   - `obstacles`: blockers or friction points.
   - `lessons`: learned insights.
   - `themes`: recurring topics.
   - `questions`: open inquiries.
2. **Pattern Synthesis**: Scans multiple episodic records and generates hypothetical patterns with supporting quotes and counter-evidence.
3. **Task Decomposition**: Converts goals into discrete, dependency-ordered tasks with assigned MCP tools and consequentiality levels.

---

## 3. Gemini Multimodal Capabilities

### 3.1 Audio Transcription (`gemini-3.5-transcribe`)
- Used for high-fidelity transcription of user voice reflections.
- Processes audio recorded directly from the client microphone (WAV/WebM).
- Server converts audio payload to inline base64 and invokes `ai.models.generateContent({ model: 'gemini-3.5-transcribe', contents: ... })`.

### 3.2 High-Thinking Deliberation (`gemini-4-argon`)
- Used when users request deep introspective reasoning or strategic evaluations.
- Configured with `thinkingLevel: ThinkingLevel.HIGH`.
- `maxOutputTokens` is intentionally omitted per system guidelines to allow full reasoning budget.

### 3.3 Visual Understanding (`gemini-4-argon`)
- Enables users to attach photos of written journal entries, whiteboard sketches, or receipts to reflections.
- Extracts legible handwritten notes and summarizes diagram structures into markdown.

### 3.4 Text-to-Speech (`gemini-3.8-flash-tts`)
- Converts Adora's reflective insights and summaries into clear audio responses for hands-free listening.

### 3.5 Real-Time Duplex Conversation (`gemini-3.8-live`)
- WebSocket-bridged live audio interaction for conversational reflection on mobile or desktop.

---

## 4. Retrieval-Augmented Generation (RAG) & Vector Search

### 4.1 Embedding Generation
- Text from approved memories and reflection summaries is embedded using `gemini-embedding-2-preview` (768 or 1536 dimensions).
- Embeddings are stored natively within Firestore document arrays (`embedding: number[]`).

### 4.2 Hybrid Retrieval Pipeline
```
                    ┌────────────────────────────┐
                    │      User Search/Chat      │
                    └─────────────┬──────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
┌──────────────────┐                              ┌──────────────────┐
│  Vector Nearest  │                              │ Keyword & Tag    │
│  Neighbor Search │                              │ Metadata Filter  │
└────────┬─────────┘                              └────────┬─────────┘
         │                                                 │
         └────────────────────────┬────────────────────────┘
                                  ▼
                   ┌─────────────────────────────┐
                   │   Reciprocal Rank Fusion    │
                   │      & Deduplication        │
                   └──────────────┬──────────────┘
                                  ▼
                   ┌─────────────────────────────┐
                   │    Top-K Context Assemble   │
                   │ (Memory IDs & Source Dates) │
                   └──────────────┬──────────────┘
                                  ▼
                   ┌─────────────────────────────┐
                   │     Grounded Ingestion      │
                   │  (Nemotron Reasoner Prompt) │
                   └─────────────────────────────┘
```

### 4.3 Grounded Citations & No-Match Safeguard
- If semantic similarity scores fall below threshold (`score < 0.65`), the engine explicitly responds: *"No matching memories were found in your vault on this topic."*
- Responses include structured citation markers `[cite:memoryId]` rendered on the frontend as interactive citation cards.
