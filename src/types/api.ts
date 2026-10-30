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
