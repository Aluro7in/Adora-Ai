/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  UserProfile,
  Reflection,
  ExtractedEntities,
  Memory,
  Insight,
  GraphNode,
  GraphEdge,
  Workflow,
  Task,
  ExecutionReceipt,
  Integration,
} from './domain.ts';

// ==========================================
// ADORA AI — STANDARDIZED API CONTRACT TYPES
// ==========================================

export type ApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'PERMISSION_DENIED'
  | 'INVALID_ARGUMENT'
  | 'RESOURCE_NOT_FOUND'
  | 'CONFLICT'
  | 'APPROVAL_REQUIRED'
  | 'UNVERIFIED_OUTCOME'
  | 'INFERENCE_PROVIDER_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_SERVER_ERROR';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  correlationId: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptimeSeconds: number;
  environment: string;
  services: {
    firestore: 'connected' | 'unconfigured' | 'error';
    nebiusNemotron: 'configured' | 'missing_key' | 'unreachable';
    googleGenAI: 'configured' | 'missing_key' | 'unreachable';
  };
  version: string;
  timestamp: string;
}

// User / Auth contracts
export interface AuthMeResponse {
  user: UserProfile;
}

// Reflection contracts
export interface CreateReflectionRequest {
  rawText: string;
  category: Reflection['category'];
  tags?: string[];
  moodRating?: number;
  energyRating?: number;
  sourceType?: Reflection['sourceType'];
  audioDurationSeconds?: number;
}

export interface ExtractReflectionResponse {
  extractedEntities: ExtractedEntities;
  modelMetadata: {
    provider: string;
    model: string;
    latencyMs: number;
  };
}

// Audio contracts
export interface TranscribeAudioRequest {
  audioBase64: string;
  mimeType: string;
}

export interface TranscribeAudioResponse {
  transcript: string;
  durationSeconds?: number;
}

export interface TTSRequest {
  text: string;
  voicePersona?: string;
}

export interface TTSResponse {
  audioBase64: string;
  mimeType: string;
}

// Memory contracts
export interface SearchMemoriesRequest {
  query: string;
  types?: Memory['type'][];
  topK?: number;
  minScore?: number;
}

export interface SearchMemoriesMatch {
  memory: Memory;
  score: number;
  matchedBy: 'vector' | 'keyword' | 'hybrid';
}

export interface SearchMemoriesResponse {
  matches: SearchMemoriesMatch[];
}

// Chat contracts
export interface SendChatMessageRequest {
  message: string;
  conversationId?: string;
  useHighThinking?: boolean;
}

export interface SendChatMessageResponse {
  answer: string;
  conversationId: string;
  citations: Array<{
    id: string;
    title: string;
    quote: string;
    sourceType: 'memory' | 'reflection';
  }>;
  model: string;
}

// Workflow & Agent contracts
export interface PlanWorkflowRequest {
  goal: string;
  context?: string;
}

export interface PlanWorkflowResponse {
  workflow: Workflow;
  tasks: Task[];
}

export interface ApproveTaskResponse {
  taskId: string;
  status: Task['status'];
  approvedAt: string;
}

export interface ExecuteTaskResponse {
  task: Task;
  receipt: ExecutionReceipt;
}

// ==========================================
// RAG & MCP CONTRACTS
// ==========================================

export interface RAGDocument {
  documentId: string;
  title: string;
  sourceType: string;
  contentHash: string;
  wordCount: number;
  charCount?: number;
  chunkCount: number;
  embeddingModel: string;
  dimensions: number;
  tags: string[];
  createdAt: string;
  indexStatus: 'pending' | 'indexed' | 'failed';
}

export interface RAGSearchMatch {
  recordId: string;
  chunkId: string;
  parentDocId: string;
  content: string;
  score: number;
  metadata: {
    title: string;
    sourceType: string;
    headingPath?: string[];
    tags?: string[];
  };
  retrievalMethod: 'vector' | 'lexical' | 'hybrid_rrf';
}

export interface RAGSearchResponse {
  results: RAGSearchMatch[];
  total: number;
}

export interface RAGAskResponse {
  answer: string;
  citations: Array<{
    chunkId: string;
    documentId: string;
    title: string;
    sourceType: string;
    snippet: string;
    score: number;
    explicitlyCited: boolean;
  }>;
  confidenceScore: number;
  insufficientContext: boolean;
  model: string;
}

export interface MCPToolItem {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  consequentialityTier: 0 | 1 | 2;
  requiresApproval: boolean;
  readOnly: boolean;
  requiredScopes?: string[];
}

export interface MCPServerItem {
  serverId: string;
  name: string;
  endpointUrl: string;
  isEnabled: boolean;
  allowedTools: string[];
  status: 'connected' | 'disconnected' | 'error';
  lastConnectedAt?: string;
  lastError?: string;
}
