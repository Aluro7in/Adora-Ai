/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// ADORA AI — SHARED DOMAIN ENTITY CONTRACTS
// ==========================================

export type ReflectionCategory =
  | 'personal'
  | 'professional'
  | 'strategic'
  | 'creative'
  | 'wellbeing';

export type ReflectionSourceType =
  | 'text'
  | 'voice_transcript'
  | 'multimodal_note';

export interface ExtractedEntities {
  events: string[];
  decisions: string[];
  goals: string[];
  obstacles: string[];
  lessons: string[];
  themes: string[];
  questions: string[];
}

export interface Reflection {
  id: string;
  userId: string;
  rawText: string;
  sourceType: ReflectionSourceType;
  audioStoragePath?: string | null;
  audioDurationSeconds?: number | null;
  category: ReflectionCategory;
  tags: string[];
  moodRating?: number; // 1 to 5
  energyRating?: number; // 1 to 5
  analysisState: 'pending' | 'analyzed' | 'failed';
  extractedEntities: ExtractedEntities;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ------------------------------------------
// Memory Vault (4-Tier Cognitive Hierarchy)
// ------------------------------------------
export type MemoryType = 'episodic' | 'semantic' | 'relational' | 'procedural';

export type MemoryApprovalState =
  | 'candidate'
  | 'approved'
  | 'rejected'
  | 'archived';

export interface Memory {
  id: string;
  userId: string;
  type: MemoryType;
  title: string;
  statement: string;
  detailedContext?: string;
  sourceReflectionIds: string[];
  userApprovalState: MemoryApprovalState;
  confidenceScore: number; // 0.0 to 1.0
  tags: string[];
  embeddingDimensions?: number;
  lastReinforcedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------
// Insights & Patterns
// ------------------------------------------
export interface EvidenceReference {
  reflectionId: string;
  quote: string;
  timestamp: string;
}

export type InsightStatus = 'candidate' | 'confirmed' | 'dismissed' | 'refined';

export interface Insight {
  id: string;
  userId: string;
  title: string;
  hypothesis: string; // Always framed as hypothesis, non-diagnostic
  description: string;
  supportingEvidence: EvidenceReference[];
  counterEvidence: EvidenceReference[];
  confidenceScore: number;
  status: InsightStatus;
  userNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------
// Reflection Grove (Knowledge Graph)
// ------------------------------------------
export type GraphNodeType =
  | 'reflection'
  | 'event'
  | 'theme'
  | 'goal'
  | 'decision'
  | 'task'
  | 'outcome'
  | 'fact';

export type RelationType =
  | 'causes'
  | 'relates_to'
  | 'resolves'
  | 'hinders'
  | 'reinforces'
  | 'derived_from';

export interface GraphNode {
  id: string;
  userId: string;
  type: GraphNodeType;
  label: string;
  description?: string;
  sourceEntityId: string;
  sourceEntityType: string;
  approvalState: 'candidate' | 'confirmed';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GraphEdge {
  id: string;
  userId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationType: RelationType;
  confidence: number;
  approvalState: 'candidate' | 'confirmed';
  evidenceSnippet?: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------
// Conversational Intelligence & Chat
// ------------------------------------------
export interface ChatCitation {
  id: string;
  title: string;
  quote: string;
  sourceType: 'memory' | 'reflection';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: ChatCitation[];
  model?: string;
  thinkingLevel?: 'none' | 'high';
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------
// Workflows, Tasks & Agent Execution
// ------------------------------------------
export type ConsequentialityTier = 0 | 1 | 2; // 0: Read, 1: Minor write, 2: Consequential (Approval required)

export type TaskStatus =
  | 'PLANNED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'RUNNING'
  | 'EXECUTED'
  | 'VERIFIED'
  | 'FAILED'
  | 'CANCELLED'
  | 'UNVERIFIED';

export interface Task {
  id: string;
  userId: string;
  workflowId: string;
  project?: string;
  title: string;
  description: string;
  toolName: string;
  toolArguments: Record<string, unknown>;
  dependencies: string[];
  consequentialityTier: ConsequentialityTier;
  status: TaskStatus;
  approvedAt?: string;
  executedAt?: string;
  verifiedAt?: string;
  executionResult?: Record<string, unknown>;
  verificationProof?: {
    verifiedBy: string;
    proofData: Record<string, unknown>;
    timestamp: string;
  };
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workflow {
  id: string;
  userId: string;
  goal: string;
  rationale: string;
  status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  taskIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------
// Execution History & Cryptographic Receipts
// ------------------------------------------
export interface ExecutionReceipt {
  id: string;
  userId: string;
  taskId: string;
  workflowId: string;
  toolName: string;
  inputPayloadHash: string; // SHA-256
  outputPayloadHash: string; // SHA-256
  verificationStatus: 'VERIFIED' | 'FAILED' | 'UNVERIFIED';
  verificationDetails: {
    verificationMethod: string;
    verifiedStatePayload: Record<string, unknown>;
  };
  timestamp: string;
}

// ------------------------------------------
// Integrations & MCP
// ------------------------------------------
export type IntegrationProvider =
  | 'google_calendar'
  | 'gmail'
  | 'google_drive'
  | 'google_sheets'
  | 'web_research';

export interface Integration {
  id: IntegrationProvider;
  userId: string;
  provider: IntegrationProvider;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'revoked';
  authorizedScopes: string[];
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------
// User & Settings
// ------------------------------------------
export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  createdAt: string;
  settings: {
    theme: 'dark' | 'light' | 'system';
    highThinkingDefault: boolean;
    voiceFeedbackEnabled: boolean;
    retentionDays: number;
    vectorSearchTopK: number;
  };
  stats: {
    totalReflections: number;
    totalMemories: number;
    totalInsightsConfirmed: number;
    totalActionsVerified: number;
  };
}
