/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HealthCheckResponse,
  AuthMeResponse,
  CreateReflectionRequest,
  ExtractReflectionResponse,
  SearchMemoriesRequest,
  SearchMemoriesResponse,
  SendChatMessageRequest,
  SendChatMessageResponse,
  PlanWorkflowRequest,
  PlanWorkflowResponse,
  ApproveTaskResponse,
  ExecuteTaskResponse,
  ApiResponse,
} from '../types/api.ts';
import {
  Reflection,
  Memory,
  Insight,
  GraphNode,
  GraphEdge,
  Workflow,
  Task,
  TaskStatus,
  ExecutionReceipt,
  Integration,
} from '../types/domain.ts';

const BASE_URL = '/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const json = await response.json();
  if (!response.ok || json.success === false) {
    const errorMsg = json.error?.message || `HTTP ${response.status}: Request failed`;
    throw new Error(errorMsg);
  }

  // Handle both { success: true, data: T } and direct data objects
  return (json.data !== undefined ? json.data : json) as T;
}

export const api = {
  // Health & System
  getHealth: () => request<HealthCheckResponse>('/health'),
  getVersion: () => request<Record<string, unknown>>('/version'),

  // Auth / User
  getMe: () => request<AuthMeResponse>('/auth/me'),

  // Reflections
  getReflections: (category?: string) => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return request<{ items: Reflection[] }>(`/reflections${query}`);
  },
  createReflection: (data: CreateReflectionRequest) =>
    request<{ reflection: Reflection; summary?: string }>('/reflections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  summarizeReflection: (text: string) =>
    request<{ summary: string }>('/reflections/summarize', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  getReflection: (id: string) => request<{ reflection: Reflection }>(`/reflections/${id}`),
  extractReflection: (id: string) =>
    request<ExtractReflectionResponse>(`/reflections/${id}/extract`, {
      method: 'POST',
    }),

  // Memory Vault
  getMemories: (type?: string, approvalState?: string) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (approvalState) params.set('approvalState', approvalState);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{ items: Memory[] }>(`/memories${qs}`);
  },
  createMemory: (data: Partial<Memory>) =>
    request<{ memory: Memory }>('/memories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  searchMemories: (data: SearchMemoriesRequest) =>
    request<SearchMemoriesResponse>('/memories/search', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Insights & Patterns
  getInsights: () => request<{ items: Insight[] }>('/insights'),
  discoverInsights: () => request<{ candidateInsights: Insight[]; message?: string }>('/insights/discover', { method: 'POST' }),
  updateInsightStatus: (id: string, status: Insight['status'], userNotes?: string) =>
    request<{ insight: Insight }>(`/insights/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, userNotes }),
    }),

  // Reflection Grove (Knowledge Graph)
  getGroveGraph: () => request<{ nodes: GraphNode[]; edges: GraphEdge[] }>('/grove/graph'),

  // Chat
  sendChatMessage: (data: SendChatMessageRequest) =>
    request<SendChatMessageResponse>('/chat/message', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Workflows & Agent Execution
  getWorkflows: () => request<{ items: Workflow[] }>('/workflows'),
  planWorkflow: (data: PlanWorkflowRequest) =>
    request<PlanWorkflowResponse>('/workflows/plan', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Tasks & Receipts
  getTasks: () => request<{ items: Task[] }>('/tasks'),
  approveTask: (id: string) =>
    request<ApproveTaskResponse>(`/tasks/${id}/approve`, {
      method: 'POST',
    }),
  executeTask: (id: string) =>
    request<ExecuteTaskResponse>(`/tasks/${id}/execute`, {
      method: 'POST',
    }),
  updateTaskStatus: (id: string, status: TaskStatus) =>
    request<{ task: Task }>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getReceipts: () => request<{ items: ExecutionReceipt[] }>('/receipts'),

  // Integrations
  getIntegrations: () => request<{ items: Integration[] }>('/integrations'),

  // Audio / Multimodal
  transcribeAudio: (audioBase64: string, mimeType: string = 'audio/webm') =>
    request<{ transcript: string }>('/audio/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audioBase64, mimeType }),
    }),
  generateTts: (text: string) =>
    request<{ audioData: string; mimeType: string }>('/audio/tts', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  // RAG Knowledge Engine
  getRAGDocuments: () => request<{ items: any[] }>('/rag/documents'),
  ingestRAGDocument: (data: { title: string; text: string; sourceType?: string }) =>
    request<{ documentId: string; title: string; status: string; chunkCount: number }>('/rag/ingest/text', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  searchRAG: (query: string, topK: number = 5) =>
    request<{ results: any[]; total: number }>('/rag/search', {
      method: 'POST',
      body: JSON.stringify({ query, top_k: topK }),
    }),
  askRAG: (question: string, topK: number = 5) =>
    request<any>('/rag/ask', {
      method: 'POST',
      body: JSON.stringify({ question, top_k: topK }),
    }),
  deleteRAGDocument: (docId: string) =>
    request<{ documentId: string; status: string }>(`/rag/documents/${docId}`, {
      method: 'DELETE',
    }),

  // MCP Server & Ecosystem
  getMCPTools: () => request<{ tools: any[] }>('/mcp/tools'),
  callMCPTool: (toolName: string, args: Record<string, unknown> = {}, isApproved: boolean = false) =>
    request<any>('/mcp/tools/call', {
      method: 'POST',
      body: JSON.stringify({ toolName, arguments: args, isApproved }),
    }),
  getMCPServers: () => request<{ servers: any[] }>('/mcp/servers'),
  connectMCPServer: (serverId: string) =>
    request<any>(`/mcp/servers/${serverId}/connect`, {
      method: 'POST',
    }),
};

