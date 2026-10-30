# ADORA AI — DATABASE SCHEMA SPECIFICATION

**Document Version:** 1.1.0  
**Status:** Approved Master Schema  
**Target Engine:** Google Cloud Firestore (Document & Vector Store)  
**Partitioning Strategy:** User Root Path Isolation (`/users/{userId}/*`)  

---

## 1. Schema Hierarchy & Relational Architecture

To satisfy zero-trust multi-tenancy and mathematically prevent cross-user data leakage, all application collections (except top-level user profiles) are scoped under each user's authenticated UID root path.

```
/users/{userId}
   │
   ├── reflections/{reflectionId}
   │      └── (source reflections & raw journal inputs)
   │
   ├── memories/{memoryId}
   │      └── (episodic, semantic, relational, procedural records + vector embeddings)
   │
   ├── insights/{insightId}
   │      └── (hypotheses, supporting citations, counter-evidence)
   │
   ├── graph_nodes/{nodeId}
   │      └── (Reflection Grove entities)
   │
   ├── graph_edges/{edgeId}
   │      └── (Reflection Grove relational links)
   │
   ├── agent_plans/{planId} (workflows)
   │      └── (high-level goals, DAG definitions, state)
   │
   ├── tasks/{taskId}
   │      └── (actionable steps, tool parameters, dependencies, tiers)
   │
   ├── execution_history/{receiptId} (receipts)
   │      └── (cryptographic verification proofs & tamper-evident hashes)
   │
   └── tool_configurations/{integrationId}
          └── (authorized OAuth scopes, connection states, tool configs)
```

---

## 2. Collection Definitions & Entity Schemas

### 2.1 Collection: `users`
- **Document Path**: `/users/{userId}`
- **Primary Key**: `userId` (matches Firebase Authentication UID)
- **Description**: Stores user identity, configuration preferences, and system-wide aggregate counters.

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | `string` | PK, 1-128 chars | Matches `request.auth.uid`. |
| `email` | `string` | Valid email | User email from Firebase Auth token. |
| `displayName` | `string \| null` | Max 100 chars | User display name. |
| `photoUrl` | `string \| null` | Max 500 chars | Profile avatar URL. |
| `createdAt` | `timestamp` | Immutable | Server timestamp (`request.time`). |
| `updatedAt` | `timestamp` | Mutable | Timestamp of last profile update. |
| `settings` | `map` | Required | Configuration object: |
| `settings.theme` | `string` | `'dark' \| 'light' \| 'system'` | Active UI appearance theme. |
| `settings.highThinkingDefault` | `boolean` | Default `false` | Enable `gemini-4-argon` deep deliberation. |
| `settings.voiceFeedbackEnabled` | `boolean` | Default `true` | Enable TTS voice playback. |
| `settings.retentionDays` | `number` | `>= 0` (0 = infinite) | Auto-purge threshold for raw reflections. |
| `settings.vectorSearchTopK` | `number` | `1..20`, default `5` | Default number of vector matches in RAG. |
| `stats` | `map` | System-updated | Operational counters: |
| `stats.totalReflections` | `number` | `>= 0` | Total ingested reflections count. |
| `stats.totalMemories` | `number` | `>= 0` | Total approved memory count. |
| `stats.totalInsightsConfirmed` | `number` | `>= 0` | Total user-confirmed patterns count. |
| `stats.totalActionsVerified` | `number` | `>= 0` | Total independently verified actions count. |

---

### 2.2 Subcollection: `reflections`
- **Document Path**: `/users/{userId}/reflections/{reflectionId}`
- **Description**: Stores raw, immutable user reflections, transcripts, and model-extracted entity candidates.

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | `string` | PK, regex `^[a-zA-Z0-9_\-]+$` | Unique reflection identifier. |
| `userId` | `string` | Immutable, matches parent | Relational foreign key. |
| `rawText` | `string` | `1..10000` chars | Verbatim user input or confirmed audio transcript. |
| `sourceType` | `string` | `'text' \| 'voice_transcript' \| 'multimodal_note'` | Sensory origin of entry. |
| `audioStoragePath` | `string \| null` | Optional | Cloud Storage URI if user enabled voice retention. |
| `audioDurationSeconds` | `number \| null` | `>= 0` | Duration of voice recording in seconds. |
| `category` | `string` | `'personal' \| 'professional' \| 'strategic' \| 'creative' \| 'wellbeing'` | User or inferred category. |
| `tags` | `array<string>` | Max 10 items, each `<= 30` chars | Contextual tags. |
| `moodRating` | `number \| null` | `1..5` | Self-reported emotional mood score. |
| `energyRating` | `number \| null` | `1..5` | Self-reported physiological energy score. |
| `analysisState` | `string` | `'pending' \| 'analyzed' \| 'failed'` | Status of Nemotron extraction pipeline. |
| `extractedEntities` | `map` | Required | Structured candidate extractions from Nemotron: |
| `extractedEntities.events` | `array<string>` | Max 20 items | Concrete occurrences and factual milestones. |
| `extractedEntities.decisions` | `array<string>` | Max 20 items | Trade-offs made or deliberate choices. |
| `extractedEntities.goals` | `array<string>` | Max 20 items | Desired future states or targets. |
| `extractedEntities.obstacles` | `array<string>` | Max 20 items | Blockers, frictions, or pain points. |
| `extractedEntities.lessons` | `array<string>` | Max 20 items | Principles or insights derived. |
| `extractedEntities.themes` | `array<string>` | Max 10 items | Broad topics or recurring subjects. |
| `extractedEntities.questions` | `array<string>` | Max 10 items | Open inquiries for future reflection. |
| `createdAt` | `timestamp` | Immutable | Server timestamp of creation. |
| `updatedAt` | `timestamp` | Mutable | Server timestamp of modification. |

---

### 2.3 Subcollection: `memories`
- **Document Path**: `/users/{userId}/memories/{memoryId}`
- **Description**: Atomic, user-governed cognitive units across four distinct classifications.

#### Memory Classifications:
1. **Episodic**: Chronological milestones, journal summaries, specific life events.
2. **Semantic**: Approved facts, declared preferences, durable values, project context.
3. **Relational**: Explicit links connecting experiences, people, organizations, decisions.
4. **Procedural**: Validated habits, operating heuristics, reusable execution preferences.

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | `string` | PK, regex `^[a-zA-Z0-9_\-]+$` | Memory identifier. |
| `userId` | `string` | Immutable | Relational foreign key. |
| `type` | `string` | `'episodic' \| 'semantic' \| 'relational' \| 'procedural'` | Cognitive memory category. |
| `title` | `string` | `3..120` chars | Concise descriptive title. |
| `statement` | `string` | `10..2000` chars | Distilled atomic statement. |
| `detailedContext` | `string \| null` | Max 5000 chars | Extended background or situational context. |
| `sourceReflectionIds` | `array<string>` | Min 1 item | Provenance pointers to originating reflections. |
| `userApprovalState` | `string` | `'candidate' \| 'approved' \| 'rejected' \| 'archived'` | Governance state. |
| `confidenceScore` | `number` | `0.0..1.0` | Model confidence in extraction accuracy. |
| `tags` | `array<string>` | Max 15 items | Categorization tags. |
| `embedding` | `array<number>` | Optional (768 or 1536 dim) | Dense vector embedding for nearest-neighbor search. |
| `lastReinforcedAt` | `timestamp \| null` | Optional | Timestamp when memory was last cited or confirmed. |
| `createdAt` | `timestamp` | Immutable | Creation timestamp. |
| `updatedAt` | `timestamp` | Mutable | Last update timestamp. |

---

### 2.4 Subcollection: `insights`
- **Document Path**: `/users/{userId}/insights/{insightId}`
- **Description**: Stores synthesized recurring behavioral or strategic patterns with supporting quotes and counter-evidence.

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | `string` | PK, regex `^[a-zA-Z0-9_\-]+$` | Unique insight identifier. |
| `userId` | `string` | Immutable | Relational foreign key. |
| `title` | `string` | `5..150` chars | Pattern title. |
| `hypothesis` | `string` | `10..1500` chars | Formulated as a testable hypothesis, not a medical or clinical fact. |
| `description` | `string` | `10..3000` chars | In-depth breakdown of recurring dynamic. |
| `supportingEvidence` | `array<map>` | Min 1 item | List of `{ reflectionId, quote, timestamp }`. |
| `counterEvidence` | `array<map>` | Optional | List of `{ reflectionId, quote, timestamp }` showing counter-examples. |
| `confidenceScore` | `number` | `0.0..1.0` | Statistical pattern strength. |
| `status` | `string` | `'candidate' \| 'confirmed' \| 'dismissed' \| 'refined'` | User governance state. |
| `userNotes` | `string \| null` | Max 2000 chars | Optional annotations added by user. |
| `createdAt` | `timestamp` | Immutable | Creation timestamp. |
| `updatedAt` | `timestamp` | Mutable | Last update timestamp. |

---

### 2.5 Subcollection: `graph_nodes` & `graph_edges` (Reflection Grove)
- **Document Paths**:
  - `/users/{userId}/graph_nodes/{nodeId}`
  - `/users/{userId}/graph_edges/{edgeId}`
- **Description**: Knowledge graph nodes and relational edges powering the Reflection Grove visualization.

#### `graph_nodes` Schema:
| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | `string` | PK | Node identifier. |
| `userId` | `string` | Immutable | Relational owner. |
| `type` | `string` | `'reflection' \| 'event' \| 'theme' \| 'goal' \| 'decision' \| 'task' \| 'outcome' \| 'fact'` | Node entity type. |
| `label` | `string` | `1..100` chars | Display label in force graph. |
| `sourceEntityId` | `string` | Required | ID of underlying reflection, memory, or task. |
| `sourceEntityType` | `string` | Required | Collection name of source entity. |
| `approvalState` | `string` | `'candidate' \| 'confirmed'` | Visual status (dashed vs. solid). |
| `metadata` | `map` | Optional | Custom rendering properties (color, weight). |
| `createdAt` | `timestamp` | Immutable | Creation timestamp. |

#### `graph_edges` Schema:
| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | `string` | PK | Edge identifier. |
| `userId` | `string` | Immutable | Relational owner. |
| `sourceNodeId` | `string` | Foreign Key | Origin node ID. |
| `targetNodeId` | `string` | Foreign Key | Destination node ID. |
| `relationType` | `string` | `'causes' \| 'relates_to' \| 'resolves' \| 'hinders' \| 'reinforces' \| 'derived_from'` | Relational semantic edge type. |
| `confidence` | `number` | `0.0..1.0` | Edge confidence. |
| `approvalState` | `string` | `'candidate' \| 'confirmed'` | Visual styling toggle. |
| `evidenceSnippet` | `string \| null` | Max 500 chars | Context quote explaining relationship. |
| `createdAt` | `timestamp` | Immutable | Creation timestamp. |

---

### 2.6 Subcollection: `agent_plans` (Workflows) & `tasks`
- **Document Paths**:
  - `/users/{userId}/agent_plans/{planId}`
  - `/users/{userId}/tasks/{taskId}`
- **Description**: Hierarchical goal decomposition and DAG task execution management.

#### `agent_plans` Schema:
| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | `string` | PK | Workflow/plan identifier. |
| `userId` | `string` | Immutable | Relational owner. |
| `goal` | `string` | `5..500` chars | High-level natural language goal. |
| `rationale` | `string` | `10..2000` chars | Nemotron-generated strategic rationale. |
| `status` | `string` | `'draft' \| 'planned' \| 'in_progress' \| 'completed' \| 'failed' \| 'cancelled'` | Overall workflow execution state. |
| `taskIds` | `array<string>` | Required | Ordered list of child task IDs. |
| `createdAt` | `timestamp` | Immutable | Creation timestamp. |
| `updatedAt` | `timestamp` | Mutable | Last update timestamp. |

#### `tasks` Schema:
| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | `string` | PK | Unique task identifier. |
| `userId` | `string` | Immutable | Relational owner. |
| `workflowId` | `string` | Foreign Key | Parent plan ID. |
| `title` | `string` | `3..150` chars | Actionable task title. |
| `description` | `string` | Max 1000 chars | Detailed execution instructions. |
| `toolName` | `string` | Required | Registered MCP tool (e.g. `gmail_send_message`). |
| `toolArguments` | `map` | Required | JSON parameters validated against tool schema. |
| `dependencies` | `array<string>` | Optional | Prerequisite task IDs (DAG order). |
| `consequentialityTier` | `number` | `0 \| 1 \| 2` | `0`: Read-only, `1`: Minor write, `2`: Consequential (Requires approval). |
| `status` | `string` | Enum (8 states) | `'PLANNED'`, `'AWAITING_APPROVAL'`, `'APPROVED'`, `'RUNNING'`, `'EXECUTED'`, `'VERIFIED'`, `'FAILED'`, `'CANCELLED'`, `'UNVERIFIED'`. |
| `approvedAt` | `timestamp \| null` | Required if Tier 2 | Server timestamp of human approval. |
| `executedAt` | `timestamp \| null` | Set upon dispatch | Timestamp of tool invocation. |
| `verifiedAt` | `timestamp \| null` | Set upon verify | Timestamp of independent state verification. |
| `executionResult` | `map \| null` | Optional | Raw payload returned by tool. |
| `verificationProof` | `map \| null` | Optional | Proof of external state delta read-back. |
| `errorMessage` | `string \| null` | Optional | Error diagnostics if failed. |
| `createdAt` | `timestamp` | Immutable | Creation timestamp. |
| `updatedAt` | `timestamp` | Mutable | Last update timestamp. |

---

### 2.7 Subcollection: `execution_history` (Receipts)
- **Document Path**: `/users/{userId}/execution_history/{receiptId}`
- **Description**: Immutable cryptographic proof of agent execution and independent verification.

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | `string` | PK | Receipt identifier. |
| `userId` | `string` | Immutable | Relational owner. |
| `taskId` | `string` | Foreign Key | Associated task ID. |
| `workflowId` | `string` | Foreign Key | Associated workflow ID. |
| `toolName` | `string` | Required | Tool invoked. |
| `inputPayloadHash` | `string` | SHA-256 (64 hex chars) | Cryptographic hash of normalized input parameters. |
| `outputPayloadHash` | `string` | SHA-256 (64 hex chars) | Cryptographic hash of raw execution output. |
| `verificationStatus` | `string` | `'VERIFIED' \| 'FAILED' \| 'UNVERIFIED'` | Verification outcome. |
| `verificationDetails` | `map` | Required | Specific verification method and payload. |
| `timestamp` | `timestamp` | Immutable | Exact server timestamp of receipt issuance. |

---

### 2.8 Subcollection: `tool_configurations` (Integrations)
- **Document Path**: `/users/{userId}/tool_configurations/{integrationId}`
- **Description**: Stores OAuth connection status, authorized scopes, and configuration for integrations (Google Calendar, Gmail, Google Drive, Google Sheets).

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | `string` | PK (e.g. `'google_calendar'`) | Provider identifier. |
| `userId` | `string` | Immutable | Relational owner. |
| `provider` | `string` | `'google_calendar' \| 'gmail' \| 'google_drive' \| 'google_sheets'` | Service provider. |
| `status` | `string` | `'connected' \| 'disconnected' \| 'revoked'` | Integration status. |
| `authorizedScopes` | `array<string>` | Required | OAuth scopes granted by user. |
| `lastSyncedAt` | `timestamp \| null` | Optional | Timestamp of last health check or sync. |
| `createdAt` | `timestamp` | Immutable | Creation timestamp. |
| `updatedAt` | `timestamp` | Mutable | Modification timestamp. |

---

## 3. Firestore Indexes Specification

### 3.1 Composite Indexes (`firestore.indexes.json`)
```json
{
  "indexes": [
    {
      "collectionGroup": "reflections",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "memories",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "userApprovalState", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "insights",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "workflowId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "graph_edges",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sourceNodeId", "order": "ASCENDING" },
        { "fieldPath": "relationType", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### 3.2 Vector Search Index
- **Target Collection**: `users/{userId}/memories`
- **Field**: `embedding`
- **Dimensions**: `768` (from `gemini-embedding-2-preview`)
- **Distance Measure**: `COSINE`

---

## 4. Security Rules Architecture (ABAC)

The security rules enforce the Eight Pillars of Hardened Rules:
1. **Default Deny**: All unmapped paths return `PERMISSION_DENIED`.
2. **Master Gate**: All subcollections verify `request.auth.uid == userId`.
3. **Data Blueprints**: Stands on standalone validation helpers (`isValidReflection`, `isValidMemory`, `isValidTask`).
4. **Action-Based Updates**: Enforces `affectedKeys().hasOnly([...])` on every mutation to block shadow field injection.
5. **Terminal State Locking**: Completed receipts and verified task states cannot be modified after issuance.
