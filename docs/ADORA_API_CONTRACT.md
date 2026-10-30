# ADORA AI — AUTHORITATIVE API CONTRACT SPECIFICATION

**Document Version:** 1.1.0  
**Status:** Approved Master Contract  
**Standard:** OpenAPI 3.1 & JSON Schema  
**Base URL:** `/api/v1`  
**Transport:** HTTPS / JSON & Server-Sent Events (SSE)  

---

## 1. Global Specifications & Authentication

All API endpoints (except `/api/v1/health`) require authentication via Firebase ID Token:

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
X-Correlation-ID: <UUID_V4>
Content-Type: application/json
```

### 1.1 Standard Error Envelope
All error responses adhere to the following schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["success", "error"],
  "properties": {
    "success": { "type": "boolean", "const": false },
    "error": {
      "type": "object",
      "required": ["code", "message", "correlationId", "timestamp"],
      "properties": {
        "code": {
          "type": "string",
          "enum": [
            "UNAUTHENTICATED",
            "PERMISSION_DENIED",
            "INVALID_ARGUMENT",
            "RESOURCE_NOT_FOUND",
            "CONFLICT",
            "APPROVAL_REQUIRED",
            "UNVERIFIED_OUTCOME",
            "INFERENCE_PROVIDER_ERROR",
            "RATE_LIMITED",
            "INTERNAL_SERVER_ERROR"
          ]
        },
        "message": { "type": "string" },
        "correlationId": { "type": "string", "format": "uuid" },
        "timestamp": { "type": "string", "format": "date-time" },
        "details": { "type": "object", "additionalProperties": true }
      }
    }
  }
}
```

---

## 2. API Endpoint Specifications

### 2.1 User & Identity (`/api/v1/auth`)

#### `GET /api/v1/auth/me`
- **Description**: Returns current authenticated user profile, preferences, and aggregate metrics.
- **Request Headers**: `Authorization: Bearer <TOKEN>`
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "displayName": "Alex Mercer",
      "photoUrl": "https://lh3.googleusercontent.com/...",
      "createdAt": "2026-10-30T10:00:00.000Z",
      "settings": {
        "theme": "dark",
        "highThinkingDefault": false,
        "voiceFeedbackEnabled": true,
        "retentionDays": 0,
        "vectorSearchTopK": 5
      },
      "stats": {
        "totalReflections": 42,
        "totalMemories": 118,
        "totalInsightsConfirmed": 15,
        "totalActionsVerified": 29
      }
    }
  }
  ```
- **Error Codes**: `401 UNAUTHENTICATED`, `404 RESOURCE_NOT_FOUND`

#### `POST /api/v1/auth/sync`
- **Description**: Syncs client Firebase Auth user with Firestore user document.
- **Request Body**:
  ```json
  {
    "displayName": "Alex Mercer",
    "photoUrl": "https://lh3.googleusercontent.com/..."
  }
  ```
- **Response 200 OK**: `{ "success": true, "synced": true }`

#### `DELETE /api/v1/auth/purge`
- **Description**: Permanently and atomically purges all reflections, memories, graph nodes, workflows, and receipts for the authenticated user.
- **Request Headers**: `Authorization: Bearer <TOKEN>`
- **Response 200 OK**: `{ "success": true, "purgedCollectionsCount": 8, "timestamp": "2026-10-30T12:00:00.000Z" }`

---

### 2.2 Reflections (`/api/v1/reflections`)

#### `POST /api/v1/reflections`
- **Description**: Ingests a new raw reflection entry.
- **Request Body**:
  ```json
  {
    "rawText": "Today we launched the v1 API. We faced friction on error handling contracts, but aligned on explicit correlation IDs.",
    "sourceType": "text",
    "category": "professional",
    "tags": ["api", "launch", "architecture"],
    "moodRating": 4,
    "energyRating": 3,
    "audioDurationSeconds": null
  }
  ```
- **Response 201 Created**:
  ```json
  {
    "success": true,
    "reflection": {
      "id": "ref_987xyz",
      "userId": "usr_abc123",
      "rawText": "Today we launched the v1 API...",
      "sourceType": "text",
      "category": "professional",
      "tags": ["api", "launch", "architecture"],
      "moodRating": 4,
      "energyRating": 3,
      "analysisState": "pending",
      "extractedEntities": {
        "events": [],
        "decisions": [],
        "goals": [],
        "obstacles": [],
        "lessons": [],
        "themes": [],
        "questions": []
      },
      "createdAt": "2026-10-30T10:15:00.000Z",
      "updatedAt": "2026-10-30T10:15:00.000Z"
    }
  }
  ```

#### `GET /api/v1/reflections`
- **Query Parameters**:
  - `category` (optional, string)
  - `limit` (optional, integer, default: 20)
  - `startAfter` (optional, string)
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "items": [ /* ReflectionDocument[] */ ],
    "nextCursor": "ref_987xyz"
  }
  ```

#### `POST /api/v1/reflections/:id/extract`
- **Description**: Triggers server-side structured entity extraction via NVIDIA Nemotron (Nebius Token Factory).
- **Path Parameters**: `id` (reflection ID)
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "extractedEntities": {
      "events": ["Launched the v1 API specification"],
      "decisions": ["Aligned on explicit correlation IDs for all error envelopes"],
      "goals": ["Achieve deterministic client error handling"],
      "obstacles": ["Initial friction around error contract formats"],
      "lessons": ["Early alignment on schemas reduces downstream integration disputes"],
      "themes": ["Software Architecture", "Team Alignment"],
      "questions": ["How will we measure contract adherence in end-to-end integration tests?"]
    },
    "modelMetadata": {
      "model": "nvidia/nemotron-4-340b-instruct",
      "latencyMs": 842,
      "promptTokens": 380,
      "completionTokens": 142
    }
  }
  ```

---

### 2.3 Audio & Multimodal (`/api/v1/audio` & `/api/v1/multimodal`)

#### `POST /api/v1/audio/transcribe`
- **Description**: Transcribes an audio recording using `gemini-3.5-transcribe` on the authoritative backend.
- **Request Body**:
  ```json
  {
    "audioBase64": "UklGRi...",
    "mimeType": "audio/webm"
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "transcript": "I felt overwhelmed this morning until I blocked 90 minutes for deep work.",
    "durationSeconds": 14.8
  }
  ```

#### `POST /api/v1/audio/tts`
- **Description**: Synthesizes text into high-fidelity speech audio via `gemini-3.8-flash-tts`.
- **Request Body**:
  ```json
  {
    "text": "You noted feeling overwhelmed until you blocked 90 minutes for deep work.",
    "voicePersona": "reflective"
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "audioBase64": "UklGRi...",
    "mimeType": "audio/wav"
  }
  ```

#### `POST /api/v1/multimodal/analyze-image`
- **Description**: Inspects journal photos or whiteboard diagrams using `gemini-4-argon`.
- **Request Body**:
  ```json
  {
    "imageBase64": "data:image/jpeg;base64,...",
    "mimeType": "image/jpeg",
    "prompt": "Extract handwritten bullet points verbatim."
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "markdownText": "- Priority 1: Finalize API contract\n- Priority 2: Firestore security rules\n- Action: Schedule team review"
  }
  ```

---

### 2.4 Memory Vault (`/api/v1/memories`)

#### `POST /api/v1/memories`
- **Description**: Creates an approved or candidate memory item with vector embeddings.
- **Request Body**:
  ```json
  {
    "type": "procedural",
    "title": "90-Minute Focus Blocks",
    "statement": "Scheduling 90 uninterrupted minutes in the morning reliably prevents cognitive fatigue.",
    "detailedContext": "Observed during sprint planning and high-demand weeks.",
    "sourceReflectionIds": ["ref_987xyz"],
    "userApprovalState": "approved",
    "tags": ["productivity", "energy", "habits"]
  }
  ```
- **Response 201 Created**:
  ```json
  {
    "success": true,
    "memory": {
      "id": "mem_123abc",
      "userId": "usr_abc123",
      "type": "procedural",
      "title": "90-Minute Focus Blocks",
      "statement": "Scheduling 90 uninterrupted minutes...",
      "userApprovalState": "approved",
      "embeddingDimensions": 768,
      "createdAt": "2026-10-30T10:30:00.000Z"
    }
  }
  ```

#### `POST /api/v1/memories/search`
- **Description**: Performs hybrid semantic vector and keyword retrieval across the memory vault.
- **Request Body**:
  ```json
  {
    "query": "How do I best manage morning fatigue?",
    "types": ["procedural", "semantic"],
    "topK": 3,
    "minScore": 0.65
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "matches": [
      {
        "memory": {
          "id": "mem_123abc",
          "title": "90-Minute Focus Blocks",
          "statement": "Scheduling 90 uninterrupted minutes in the morning reliably prevents cognitive fatigue."
        },
        "score": 0.89,
        "matchedBy": "hybrid"
      }
    ]
  }
  ```

---

### 2.5 Insights & Reflection Grove (`/api/v1/insights` & `/api/v1/grove`)

#### `POST /api/v1/insights/discover`
- **Description**: Triggers pattern analysis across reflections to generate hypotheses with counter-evidence.
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "candidateInsights": [
      {
        "id": "ins_555",
        "title": "Context Switching Friction",
        "hypothesis": "Meetings scheduled between 10am and 2pm appear to correlate with reported afternoon frustration.",
        "supportingEvidence": [
          { "reflectionId": "ref_101", "quote": "Midday sync completely disrupted my focus.", "timestamp": "2026-10-25T14:00:00.000Z" }
        ],
        "counterEvidence": [
          { "reflectionId": "ref_105", "quote": "Had lunch check-in and still felt energetic.", "timestamp": "2026-10-28T16:00:00.000Z" }
        ],
        "confidenceScore": 0.76,
        "status": "candidate"
      }
    ]
  }
  ```

#### `GET /api/v1/grove/graph`
- **Description**: Returns all nodes and edges for the Reflection Grove force-directed graph.
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "nodes": [
      {
        "id": "node_1",
        "type": "theme",
        "label": "Focus Management",
        "approvalState": "confirmed"
      }
    ],
    "edges": [
      {
        "id": "edge_1",
        "source": "node_1",
        "target": "mem_123abc",
        "relationType": "reinforces",
        "approvalState": "confirmed"
      }
    ]
  }
  ```

---

### 2.6 Conversational Intelligence (`/api/v1/chat`)

#### `POST /api/v1/chat/message`
- **Description**: Grounded conversational turn using NVIDIA Nemotron, citing memory context.
- **Request Body**:
  ```json
  {
    "message": "What habit has helped me most with morning focus?",
    "history": [],
    "useHighThinking": false
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "answer": "Based on your procedural memory, scheduling 90 uninterrupted minutes in the morning has been your most effective habit [cite:mem_123abc]. You established this after experiencing fatigue during sprint launches.",
    "citedMemories": [
      {
        "id": "mem_123abc",
        "title": "90-Minute Focus Blocks",
        "statement": "Scheduling 90 uninterrupted minutes in the morning reliably prevents cognitive fatigue."
      }
    ]
  }
  ```

---

### 2.7 Workflows, Tasks & Verified Execution (`/api/v1/workflows` & `/api/v1/tasks`)

#### `POST /api/v1/workflows/plan`
- **Description**: Decomposes a user's natural language goal into a structured DAG of tasks.
- **Request Body**:
  ```json
  {
    "goal": "Prepare a 90-minute focus block on my calendar and email a project debrief draft to the team."
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "workflow": {
      "id": "wf_777",
      "goal": "Prepare a 90-minute focus block and draft debrief",
      "status": "planned",
      "taskIds": ["tsk_001", "tsk_002"]
    },
    "tasks": [
      {
        "id": "tsk_001",
        "title": "Schedule 90-minute calendar block",
        "toolName": "calendar_create_event",
        "toolArguments": { "title": "Deep Focus", "durationMinutes": 90 },
        "dependencies": [],
        "consequentialityTier": 1,
        "status": "PLANNED"
      },
      {
        "id": "tsk_002",
        "title": "Send project debrief email",
        "toolName": "gmail_send_message",
        "toolArguments": { "subject": "Sprint Launch Debrief" },
        "dependencies": ["tsk_001"],
        "consequentialityTier": 2,
        "status": "AWAITING_APPROVAL"
      }
    ]
  }
  ```

#### `POST /api/v1/tasks/:id/approve`
- **Description**: Explicit user approval gate for Tier 2 consequential actions.
- **Path Parameters**: `id` (task ID)
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "taskId": "tsk_002",
    "status": "APPROVED",
    "approvedAt": "2026-10-30T11:00:00.000Z"
  }
  ```

#### `POST /api/v1/tasks/:id/execute`
- **Description**: Dispatches task to MCP tool, invokes independent verification, and records cryptographic receipt.
- **Path Parameters**: `id` (task ID)
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "task": {
      "id": "tsk_002",
      "status": "VERIFIED",
      "verifiedAt": "2026-10-30T11:01:05.000Z"
    },
    "receipt": {
      "id": "rcpt_888",
      "taskId": "tsk_002",
      "toolName": "gmail_send_message",
      "inputPayloadHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "outputPayloadHash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      "verificationStatus": "VERIFIED",
      "verificationDetails": {
        "verificationMethod": "gmail.users.messages.get",
        "verifiedStatePayload": { "labelIds": ["SENT"], "messageId": "msg_999" }
      },
      "timestamp": "2026-10-30T11:01:05.000Z"
    }
  }
  ```
- **Error Codes**: `403 APPROVAL_REQUIRED` (if attempted without approval on Tier 2), `500 UNVERIFIED_OUTCOME`

---

### 2.8 System Health (`/api/v1/health`)

#### `GET /api/v1/health`
- **Description**: Public health check confirming connectivity to Firestore, Nebius Token Factory, and Google GenAI.
- **Response 200 OK**:
  ```json
  {
    "status": "healthy",
    "uptimeSeconds": 1420,
    "services": {
      "firestore": "connected",
      "nebiusNemotron": "reachable",
      "googleGenAI": "reachable"
    },
    "version": "1.1.0"
  }
  ```
