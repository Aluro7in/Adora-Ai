/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import {
  HealthCheckResponse,
  ApiResponse,
  ApiError,
  CreateReflectionRequest,
  SearchMemoriesRequest,
  PlanWorkflowRequest,
  SendChatMessageRequest,
} from './src/types/api.ts';
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
} from './src/types/domain.ts';

import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Google GenAI Multimodal Specialist Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Real Nebius Token Factory NVIDIA Nemotron Helper
async function callNebiusNemotron(userPrompt: string, systemPrompt?: string, jsonMode: boolean = false) {
  const apiKey = process.env.NEBIUS_API_KEY;
  const baseUrl = process.env.NEBIUS_BASE_URL || 'https://api.studio.nebius.ai/v1';
  const model = process.env.NEBIUS_MODEL || 'nvidia/nemotron-4-340b-instruct';

  if (!apiKey || apiKey === 'MY_NEBIUS_API_KEY') {
    return null;
  }

  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const body: any = {
    model,
    messages,
    temperature: 0.2,
  };
  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.warn(`[Nebius API warning] Status ${res.status}: ${errText}`);
    return null;
  }

  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    model: data.model || model,
    usage: data.usage,
  };
}

// Body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Correlation ID & Structured Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  res.setHeader('X-Correlation-ID', correlationId);
  (req as any).correlationId = correlationId;

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms) [corr: ${correlationId}]`
      );
    }
  });

  next();
});

// ==========================================
// IN-MEMORY FOUNDATION STORE (Phase 1 Scaffolding)
// (Will connect to Cloud Firestore in Phase 2)
// ==========================================
const mockStore = {
  reflections: [] as Reflection[],
  memories: [] as Memory[],
  insights: [] as Insight[],
  graphNodes: [] as GraphNode[],
  graphEdges: [] as GraphEdge[],
  workflows: [] as Workflow[],
  tasks: [
    {
      id: 'tsk_focus_01',
      userId: 'usr_adora_local',
      workflowId: 'wf_exec_focus',
      project: 'Adora Executive Focus',
      title: 'Schedule weekly deep-work reflection session',
      description: 'Block 90 minutes in Google Calendar for undistracted weekly reflection and strategic planning.',
      toolName: 'calendar_create_event',
      toolArguments: { duration: 90, summary: 'Deep-Work Reflection' },
      dependencies: [],
      consequentialityTier: 1,
      status: 'PLANNED',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'tsk_audit_02',
      userId: 'usr_adora_local',
      workflowId: 'wf_knowl_graph',
      project: 'Knowledge Graph',
      title: 'Audit episodic memory embeddings for cognitive drift',
      description: 'Run cosine similarity check across episodic memories against recently confirmed insights.',
      toolName: 'vector_audit_tool',
      toolArguments: { similarityThreshold: 0.85 },
      dependencies: [],
      consequentialityTier: 2,
      status: 'AWAITING_APPROVAL',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'tsk_publish_03',
      userId: 'usr_adora_local',
      workflowId: 'wf_arch_rev',
      project: 'Architecture Review',
      title: 'Publish verified architectural briefing document',
      description: 'Export system architecture specifications and cryptographic verification receipts to Drive.',
      toolName: 'drive_publish_doc',
      toolArguments: { targetFolder: 'Architecture Briefs' },
      dependencies: [],
      consequentialityTier: 2,
      status: 'APPROVED',
      approvedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'tsk_index_04',
      userId: 'usr_adora_local',
      workflowId: 'wf_knowl_graph',
      project: 'Knowledge Graph',
      title: 'Index newly ingested research notes and tags',
      description: 'Extract semantic tags and link cross-domain nodes in the Reflection Grove.',
      toolName: 'graph_indexer',
      toolArguments: { depth: 2 },
      dependencies: [],
      consequentialityTier: 0,
      status: 'RUNNING',
      executedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
    {
      id: 'tsk_verify_05',
      userId: 'usr_adora_local',
      workflowId: 'wf_arch_rev',
      project: 'Architecture Review',
      title: 'Verify execution cryptographic receipt digest',
      description: 'Independently read back external state and compute SHA-256 tamper-evident proof.',
      toolName: 'receipt_hash_verifier',
      toolArguments: { checkProof: true },
      dependencies: [],
      consequentialityTier: 0,
      status: 'VERIFIED',
      executedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      verifiedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      id: 'tsk_email_06',
      userId: 'usr_adora_local',
      workflowId: 'wf_exec_focus',
      project: 'Adora Executive Focus',
      title: 'Draft weekly reflective synthesis email',
      description: 'Compose executive summary draft based on high-confidence confirmed insights for advisory review.',
      toolName: 'gmail_draft_message',
      toolArguments: { subject: 'Adora Weekly Synthesis' },
      dependencies: [],
      consequentialityTier: 2,
      status: 'AWAITING_APPROVAL',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  ] as Task[],
  receipts: [
    {
      id: 'rcpt_seed_01',
      userId: 'usr_adora_local',
      taskId: 'tsk_verify_05',
      workflowId: 'wf_arch_rev',
      toolName: 'receipt_hash_verifier',
      inputPayloadHash: '8f434346648f6b96df89dda901c5176b10f607629f7660cc6a500968644f3ca3',
      outputPayloadHash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
      verificationStatus: 'VERIFIED',
      verificationDetails: {
        verificationMethod: 'system_query_readback',
        verifiedStatePayload: { status: 'verified', digestVerified: true },
      },
      timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
  ] as ExecutionReceipt[],
  integrations: [
    {
      id: 'google_calendar',
      userId: 'usr_default',
      provider: 'google_calendar',
      name: 'Google Calendar',
      description: 'Schedule focus blocks, sync reflection appointments, and verify calendar events.',
      status: 'disconnected',
      authorizedScopes: ['https://www.googleapis.com/auth/calendar.events'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'gmail',
      userId: 'usr_default',
      provider: 'gmail',
      name: 'Gmail',
      description: 'Draft reflections into debriefs and send approved summary emails.',
      status: 'disconnected',
      authorizedScopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.compose'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'google_drive',
      userId: 'usr_default',
      provider: 'google_drive',
      name: 'Google Drive',
      description: 'Read past journal exports and backup memory vaults to personal Drive.',
      status: 'disconnected',
      authorizedScopes: ['https://www.googleapis.com/auth/drive.file'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'google_sheets',
      userId: 'usr_default',
      provider: 'google_sheets',
      name: 'Google Sheets',
      description: 'Log verified habits, time-tracking metrics, and execution history data.',
      status: 'disconnected',
      authorizedScopes: ['https://www.googleapis.com/auth/spreadsheets'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'web_research',
      userId: 'usr_default',
      provider: 'web_research',
      name: 'Web Research & Grounding',
      description: 'Verify factual claims and gather context for reflections without mutations.',
      status: 'connected',
      authorizedScopes: ['read_only'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ] as Integration[],
};

// ==========================================
// API ROUTES (/api/v1)
// ==========================================
const apiRouter = express.Router();

// Health Check
apiRouter.get('/health', (_req: Request, res: Response) => {
  const hasNebiusKey = Boolean(process.env.NEBIUS_API_KEY && process.env.NEBIUS_API_KEY !== 'MY_NEBIUS_API_KEY');
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

  const health: HealthCheckResponse = {
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    services: {
      firestore: 'unconfigured', // Phase 2 provision target
      nebiusNemotron: hasNebiusKey ? 'configured' : 'missing_key',
      googleGenAI: hasGeminiKey ? 'configured' : 'missing_key',
    },
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  };

  res.json(health);
});

// Version & Identity
apiRouter.get('/version', (_req: Request, res: Response) => {
  res.json({
    app: 'Adora AI',
    tagline: 'Reflective Intelligence. Adaptive Action.',
    runtime: 'Node.js Express + React 19',
    phase: 'Phase 1: Project Foundation & Shell',
    inferenceTarget: 'NVIDIA Nemotron via Nebius Token Factory',
  });
});

// User profile & session
apiRouter.get('/auth/me', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 'usr_adora_local',
        email: 'user@adora.ai',
        displayName: 'Reflective Explorer',
        photoUrl: null,
        createdAt: new Date().toISOString(),
        settings: {
          theme: 'dark',
          highThinkingDefault: false,
          voiceFeedbackEnabled: true,
          retentionDays: 0,
          vectorSearchTopK: 5,
        },
        stats: {
          totalReflections: mockStore.reflections.length,
          totalMemories: mockStore.memories.length,
          totalInsightsConfirmed: mockStore.insights.filter((i) => i.status === 'confirmed').length,
          totalActionsVerified: mockStore.receipts.filter((r) => r.verificationStatus === 'VERIFIED').length,
        },
      },
    },
  });
});

// Reflections CRUD
apiRouter.get('/reflections', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  let items = [...mockStore.reflections];
  if (category) {
    items = items.filter((r) => r.category === category);
  }
  // Sort descending by created timestamp
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, data: { items } });
});

apiRouter.post('/reflections', (req: Request, res: Response) => {
  const body = req.body as CreateReflectionRequest;
  if (!body.rawText || body.rawText.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ARGUMENT',
        message: 'Reflection rawText is required and cannot be empty.',
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  const now = new Date().toISOString();
  const newReflection: Reflection = {
    id: `ref_${crypto.randomUUID().slice(0, 8)}`,
    userId: 'usr_adora_local',
    rawText: body.rawText.trim(),
    sourceType: body.sourceType || 'text',
    category: body.category || 'personal',
    tags: body.tags || [],
    moodRating: body.moodRating,
    energyRating: body.energyRating,
    audioDurationSeconds: body.audioDurationSeconds,
    analysisState: 'pending',
    extractedEntities: {
      events: [],
      decisions: [],
      goals: [],
      obstacles: [],
      lessons: [],
      themes: body.tags || [],
      questions: [],
    },
    createdAt: now,
    updatedAt: now,
  };

  mockStore.reflections.unshift(newReflection);

  // Automatically seed corresponding graph node
  mockStore.graphNodes.push({
    id: `node_${newReflection.id}`,
    userId: 'usr_adora_local',
    type: 'reflection',
    label: newReflection.rawText.slice(0, 32) + (newReflection.rawText.length > 32 ? '...' : ''),
    description: newReflection.rawText,
    sourceEntityId: newReflection.id,
    sourceEntityType: 'reflections',
    approvalState: 'confirmed',
    createdAt: now,
    updatedAt: now,
  });

  res.status(201).json({ success: true, data: { reflection: newReflection } });
});

apiRouter.get('/reflections/:id', (req: Request, res: Response) => {
  const item = mockStore.reflections.find((r) => r.id === req.params.id);
  if (!item) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: `Reflection with id ${req.params.id} not found`,
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }
  res.json({ success: true, data: { reflection: item } });
});

apiRouter.post('/reflections/:id/extract', async (req: Request, res: Response) => {
  const item = mockStore.reflections.find((r) => r.id === req.params.id);
  if (!item) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: `Reflection with id ${req.params.id} not found`,
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  let extracted = null;
  let modelUsed = process.env.NEBIUS_MODEL || 'nvidia/nemotron-4-340b-instruct';
  let providerName = 'Nebius Token Factory (NVIDIA Nemotron)';
  const start = Date.now();

  try {
    const prompt = `Analyze this reflection text and extract structured entities strictly adhering to the JSON schema.
Reflection:
"""${item.rawText}"""

Output JSON format:
{
  "events": ["list of concrete occurrences"],
  "decisions": ["list of explicit choices or trade-offs"],
  "goals": ["list of desired future states"],
  "obstacles": ["list of friction points or blockers"],
  "lessons": ["list of insights or principles"],
  "themes": ["list of broad themes"],
  "questions": ["inquiry questions to ponder next"]
}`;

    const nebiusResult = await callNebiusNemotron(
      prompt,
      'You are Adora reflective analysis engine powered by NVIDIA Nemotron. Respond strictly with valid JSON.',
      true
    );

    if (nebiusResult && nebiusResult.content) {
      extracted = JSON.parse(nebiusResult.content);
      modelUsed = nebiusResult.model;
    }
  } catch (err) {
    console.warn('[Nemotron Extraction Error, falling back to structured extractor]:', err);
  }

  if (!extracted) {
    providerName = 'Nebius Token Factory Scaffold (Configure NEBIUS_API_KEY for live inference)';
    const words = item.rawText.split(/\s+/);
    const sampleThemes = item.tags.length > 0 ? item.tags : ['Reflection', item.category];
    extracted = {
      events: [`Recorded reflection in category '${item.category}'`],
      decisions: words.length > 15 ? [`Evaluated priority: "${words.slice(0, 5).join(' ')}..."`] : [],
      goals: [`Continue deliberate practice around ${item.category}`],
      obstacles: item.energyRating && item.energyRating <= 2 ? ['Reported lower energy during capture'] : [],
      lessons: ['Consistent journaling clarifies underlying patterns over time'],
      themes: sampleThemes,
      questions: ['What key decision will emerge from this experience next?'],
    };
  }

  item.extractedEntities = extracted;
  item.analysisState = 'analyzed';
  item.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: {
      extractedEntities: extracted,
      modelMetadata: {
        provider: providerName,
        model: modelUsed,
        latencyMs: Date.now() - start,
      },
    },
  });
});

// Memories Vault CRUD & Search
apiRouter.get('/memories', (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  const state = req.query.approvalState as string | undefined;

  let items = [...mockStore.memories];
  if (type) {
    items = items.filter((m) => m.type === type);
  }
  if (state) {
    items = items.filter((m) => m.userApprovalState === state);
  }

  res.json({ success: true, data: { items } });
});

apiRouter.post('/memories', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.title || !body.statement) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ARGUMENT',
        message: 'Memory requires both title and statement.',
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  const now = new Date().toISOString();
  const newMemory: Memory = {
    id: `mem_${crypto.randomUUID().slice(0, 8)}`,
    userId: 'usr_adora_local',
    type: body.type || 'semantic',
    title: body.title,
    statement: body.statement,
    detailedContext: body.detailedContext,
    sourceReflectionIds: body.sourceReflectionIds || [],
    userApprovalState: body.userApprovalState || 'approved',
    confidenceScore: body.confidenceScore || 0.9,
    tags: body.tags || [],
    embeddingDimensions: 768,
    createdAt: now,
    updatedAt: now,
  };

  mockStore.memories.unshift(newMemory);

  // Seed node in Grove
  mockStore.graphNodes.push({
    id: `node_${newMemory.id}`,
    userId: 'usr_adora_local',
    type: newMemory.type === 'procedural' ? 'task' : 'fact',
    label: newMemory.title,
    description: newMemory.statement,
    sourceEntityId: newMemory.id,
    sourceEntityType: 'memories',
    approvalState: newMemory.userApprovalState === 'approved' ? 'confirmed' : 'candidate',
    createdAt: now,
    updatedAt: now,
  });

  res.status(201).json({ success: true, data: { memory: newMemory } });
});

apiRouter.post('/memories/search', (req: Request, res: Response) => {
  const { query, types } = req.body as SearchMemoriesRequest;
  if (!query || query.trim().length === 0) {
    return res.json({ success: true, data: { matches: [] } });
  }

  const q = query.toLowerCase();
  let pool = [...mockStore.memories];
  if (types && types.length > 0) {
    pool = pool.filter((m) => types.includes(m.type));
  }

  const matches = pool
    .map((mem) => {
      let score = 0;
      if (mem.title.toLowerCase().includes(q)) score += 0.6;
      if (mem.statement.toLowerCase().includes(q)) score += 0.4;
      if (mem.tags.some((t) => t.toLowerCase().includes(q))) score += 0.3;
      return { memory: mem, score: Math.min(1.0, score), matchedBy: 'keyword' as const };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  res.json({ success: true, data: { matches } });
});

// Insights Discovery
apiRouter.get('/insights', (_req: Request, res: Response) => {
  res.json({ success: true, data: { items: mockStore.insights } });
});

apiRouter.post('/insights/discover', (_req: Request, res: Response) => {
  // Check if we have reflections to evaluate
  if (mockStore.reflections.length === 0) {
    return res.json({
      success: true,
      data: {
        candidateInsights: [],
        message: 'No reflections available yet. Add entries in the Reflect screen to allow pattern discovery.',
      },
    });
  }

  const now = new Date().toISOString();
  const sampleCandidate: Insight = {
    id: `ins_${crypto.randomUUID().slice(0, 8)}`,
    userId: 'usr_adora_local',
    title: 'Focused Reflection Cadence',
    hypothesis: 'Capturing reflections consistently correlates with clearer goal formulation and higher action follow-through.',
    description: 'Preliminary synthesis across initial user entries indicates increased clarity following structured reflection.',
    supportingEvidence: mockStore.reflections.slice(0, 2).map((r) => ({
      reflectionId: r.id,
      quote: r.rawText.slice(0, 80) + '...',
      timestamp: r.createdAt,
    })),
    counterEvidence: [],
    confidenceScore: 0.82,
    status: 'candidate',
    createdAt: now,
    updatedAt: now,
  };

  mockStore.insights.unshift(sampleCandidate);

  res.json({ success: true, data: { candidateInsights: [sampleCandidate] } });
});

apiRouter.patch('/insights/:id/status', (req: Request, res: Response) => {
  const item = mockStore.insights.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: `Insight ${req.params.id} not found`,
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  const { status, userNotes } = req.body;
  if (status) item.status = status;
  if (userNotes !== undefined) item.userNotes = userNotes;
  item.updatedAt = new Date().toISOString();

  res.json({ success: true, data: { insight: item } });
});

// Reflection Grove Knowledge Graph
apiRouter.get('/grove/graph', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      nodes: mockStore.graphNodes,
      edges: mockStore.graphEdges,
    },
  });
});

// Chat & Conversational Intelligence
apiRouter.post('/chat/message', async (req: Request, res: Response) => {
  const { message, useHighThinking } = req.body as SendChatMessageRequest;
  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ARGUMENT',
        message: 'Chat message cannot be empty.',
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Match memory context if available
  const cited: Array<{ id: string; title: string; quote: string; sourceType: 'memory' | 'reflection' }> = [];
  if (mockStore.memories.length > 0) {
    const topMem = mockStore.memories[0];
    cited.push({
      id: topMem.id,
      title: topMem.title,
      quote: topMem.statement,
      sourceType: 'memory',
    });
  }

  let answerText = '';
  let modelIdentifier = 'NVIDIA Nemotron 3.5 Lightning (Nebius)';

  if (useHighThinking) {
    try {
      modelIdentifier = 'gemini-4-argon (ThinkingLevel.HIGH)';
      const memoryContext = cited.length > 0 ? `Relevant user memory: "${cited[0].title}" - ${cited[0].quote}` : 'No previous memories stored yet.';
      const resGen = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: `You are Adora's Deep Deliberation engine.
Context:
${memoryContext}

User Query:
${message.trim()}

Respond with deep strategic insight and reflective inquiry. Ground answers in user context.`,
        config: {
          thinkingConfig: {
            thinkingLevel: 'HIGH' as any,
          },
        },
      });
      answerText = resGen.text || '';
    } catch (err: any) {
      console.warn('[Gemini High Thinking Fallback]:', err);
    }
  }

  if (!answerText) {
    try {
      const memoryContext = cited.length > 0 ? `Relevant user memory: "${cited[0].title}" - ${cited[0].quote}` : 'No previous memories stored yet.';
      const nebiusRes = await callNebiusNemotron(
        `User context: ${memoryContext}\nUser message: ${message.trim()}`,
        'You are Adora AI, a reflective intelligence assistant powered by NVIDIA Nemotron. Provide a thoughtful, grounded response. Citing memory items where appropriate.'
      );
      if (nebiusRes && nebiusRes.content) {
        answerText = nebiusRes.content;
        modelIdentifier = nebiusRes.model;
      }
    } catch (err: any) {
      console.warn('[Nemotron Chat Fallback]:', err);
    }
  }

  if (!answerText) {
    answerText = `I hear you regarding "${message.trim()}". `;
    if (cited.length > 0) {
      answerText += `Grounding in your Memory Vault: in "${cited[0].title}", you noted that "${cited[0].quote}" [cite:${cited[0].id}]. How does this relate to your current goal?`;
    } else {
      answerText += `Your vault currently has no stored memories for direct citation yet. Record reflections or approve candidate memories to ground future conversations in your personal history.`;
    }
  }

  res.json({
    success: true,
    data: {
      answer: answerText,
      conversationId: 'conv_primary',
      citations: cited,
      model: modelIdentifier,
    },
  });
});

// Audio & Multimodal Endpoints (Gemini Specialist Models)
apiRouter.post('/audio/transcribe', async (req: Request, res: Response) => {
  const { audioBase64, mimeType } = req.body;
  if (!audioBase64) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_ARGUMENT', message: 'Missing audioBase64 in request body.' },
    });
  }

  try {
    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'audio/webm',
              data: cleanBase64,
            },
          },
          { text: 'Transcribe this spoken personal reflection verbatim. Preserve natural tone and self-corrections.' },
        ],
      },
    });

    res.json({
      success: true,
      data: {
        transcript: response.text || '',
      },
    });
  } catch (err: any) {
    console.error('[Audio Transcription Error]:', err);
    res.status(500).json({
      success: false,
      error: { code: 'TRANSCRIPTION_FAILED', message: err.message },
    });
  }
});

apiRouter.post('/audio/tts', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_ARGUMENT', message: 'Text required' } });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: `Read this reflection back in a gentle, warm, reflective voice:\n\n${text}`,
    });

    res.json({
      success: true,
      data: {
        speechMetadata: 'Synthesized via gemini-3.8-flash-tts',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'TTS_FAILED', message: err.message } });
  }
});

// Workflows, Tasks & Execution
apiRouter.get('/workflows', (_req: Request, res: Response) => {
  res.json({ success: true, data: { items: mockStore.workflows } });
});

apiRouter.post('/workflows/plan', async (req: Request, res: Response) => {
  const { goal } = req.body as PlanWorkflowRequest;
  if (!goal || goal.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ARGUMENT',
        message: 'Goal description is required to plan a workflow.',
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  const now = new Date().toISOString();
  const wfId = `wf_${crypto.randomUUID().slice(0, 8)}`;
  let planTasks: any[] = [];
  let rationale = 'Structured into context retrieval followed by an approval-gated external action.';

  try {
    const prompt = `Decompose this goal into a discrete sequence of tasks.
Goal: "${goal}"
Assign each task: title, description, tool_name (memory_search, calendar_create_event, gmail_send_message, web_research), and consequentiality_tier (0: read-only, 1: benign mutation, 2: consequential requiring human approval).

Output JSON:
{
  "rationale": "strategic rationale",
  "tasks": [
    {
      "title": "task title",
      "description": "instructions",
      "tool_name": "tool_name",
      "consequentiality_tier": 0
    }
  ]
}`;
    const nebiusPlan = await callNebiusNemotron(
      prompt,
      'You are Adora Agentic Planner powered by NVIDIA Nemotron. Respond strictly with valid JSON.',
      true
    );

    if (nebiusPlan && nebiusPlan.content) {
      const parsed = JSON.parse(nebiusPlan.content);
      if (parsed.tasks && Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
        planTasks = parsed.tasks;
        if (parsed.rationale) rationale = parsed.rationale;
      }
    }
  } catch (err) {
    console.warn('[Nemotron Planning Fallback]:', err);
  }

  if (planTasks.length === 0) {
    planTasks = [
      {
        title: `Context & Memory Search for "${goal.slice(0, 30)}..."`,
        description: 'Retrieve relevant procedural memories and past experiences before acting.',
        tool_name: 'memory_search',
        consequentiality_tier: 0,
      },
      {
        title: `Prepare Action Draft for "${goal.slice(0, 30)}..."`,
        description: 'Formulate executable plan and schedule next checkpoint.',
        tool_name: 'calendar_create_event',
        consequentiality_tier: 2,
      },
    ];
  }

  const projectName = goal.split(' ').slice(0, 3).join(' ') || 'Strategic Plan';

  const createdTasks: Task[] = planTasks.map((pt, idx) => {
    const tId = `tsk_${crypto.randomUUID().slice(0, 8)}`;
    const tier = (pt.consequentiality_tier ?? (idx === 0 ? 0 : 2)) as 0 | 1 | 2;
    return {
      id: tId,
      userId: 'usr_adora_local',
      workflowId: wfId,
      project: projectName,
      title: pt.title || `Action step ${idx + 1}`,
      description: pt.description || '',
      toolName: pt.tool_name || 'generic_step',
      toolArguments: { goal, step: idx + 1 },
      dependencies: idx > 0 ? [`tsk_${idx}`] : [],
      consequentialityTier: tier,
      status: tier === 2 ? 'AWAITING_APPROVAL' : 'PLANNED',
      createdAt: now,
      updatedAt: now,
    };
  });

  const workflow: Workflow = {
    id: wfId,
    userId: 'usr_adora_local',
    goal,
    rationale,
    status: 'planned',
    taskIds: createdTasks.map((t) => t.id),
    createdAt: now,
    updatedAt: now,
  };

  mockStore.workflows.unshift(workflow);
  mockStore.tasks.unshift(...createdTasks);

  res.status(201).json({
    success: true,
    data: {
      workflow,
      tasks: createdTasks,
    },
  });
});


apiRouter.get('/tasks', (_req: Request, res: Response) => {
  res.json({ success: true, data: { items: mockStore.tasks } });
});

apiRouter.post('/tasks/:id/approve', (req: Request, res: Response) => {
  const task = mockStore.tasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: `Task ${req.params.id} not found`,
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  task.status = 'APPROVED';
  task.approvedAt = new Date().toISOString();
  task.updatedAt = task.approvedAt;

  res.json({
    success: true,
    data: {
      taskId: task.id,
      status: task.status,
      approvedAt: task.approvedAt,
    },
  });
});

apiRouter.post('/tasks/:id/execute', (req: Request, res: Response) => {
  const task = mockStore.tasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: `Task ${req.params.id} not found`,
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Check consequential approval invariant
  if (task.consequentialityTier === 2 && task.status !== 'APPROVED') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'APPROVAL_REQUIRED',
        message: 'This action is Tier 2 Consequential and cannot execute without explicit user approval.',
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  const now = new Date().toISOString();
  task.status = 'RUNNING';
  task.executedAt = now;

  // Execute tool & compute SHA-256 hashes
  const inputStr = JSON.stringify(task.toolArguments);
  const inputHash = crypto.createHash('sha256').update(inputStr).digest('hex');

  const executionResult = {
    tool: task.toolName,
    dispatchedAt: now,
    status: 'success',
    simulatedOutput: `Executed ${task.toolName} successfully. Verified external parameters.`,
  };
  const outputHash = crypto.createHash('sha256').update(JSON.stringify(executionResult)).digest('hex');

  // Independent verification simulation
  task.status = 'VERIFIED';
  task.verifiedAt = now;
  task.executionResult = executionResult;
  task.verificationProof = {
    verifiedBy: 'system_query_readback',
    proofData: { targetState: 'confirmed', confirmedAt: now },
    timestamp: now,
  };
  task.updatedAt = now;

  const receipt: ExecutionReceipt = {
    id: `rcpt_${crypto.randomUUID().slice(0, 8)}`,
    userId: 'usr_adora_local',
    taskId: task.id,
    workflowId: task.workflowId,
    toolName: task.toolName,
    inputPayloadHash: inputHash,
    outputPayloadHash: outputHash,
    verificationStatus: 'VERIFIED',
    verificationDetails: {
      verificationMethod: 'system_query_readback',
      verifiedStatePayload: { status: 'verified', timestamp: now },
    },
    timestamp: now,
  };

  mockStore.receipts.unshift(receipt);

  res.json({
    success: true,
    data: {
      task,
      receipt,
    },
  });
});

apiRouter.patch('/tasks/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const task = mockStore.tasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: `Task ${req.params.id} not found`,
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  const validStatuses: TaskStatus[] = [
    'PLANNED',
    'AWAITING_APPROVAL',
    'APPROVED',
    'RUNNING',
    'EXECUTED',
    'VERIFIED',
    'FAILED',
    'CANCELLED',
    'UNVERIFIED',
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_STATUS',
        message: `Invalid task status: ${status}`,
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  task.status = status;
  task.updatedAt = new Date().toISOString();
  if (status === 'APPROVED' && !task.approvedAt) {
    task.approvedAt = task.updatedAt;
  }
  if (status === 'VERIFIED' && !task.verifiedAt) {
    task.verifiedAt = task.updatedAt;
  }

  res.json({
    success: true,
    data: {
      task,
    },
  });
});

apiRouter.get('/receipts', (_req: Request, res: Response) => {
  res.json({ success: true, data: { items: mockStore.receipts } });
});

apiRouter.get('/integrations', (_req: Request, res: Response) => {
  res.json({ success: true, data: { items: mockStore.integrations } });
});

// Audio Transcription with gemini-3.5-transcribe
apiRouter.post('/audio/transcribe', async (req: Request, res: Response) => {
  const { audioBase64, mimeType = 'audio/webm' } = req.body;
  if (!audioBase64) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Missing audioBase64 in request body',
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  try {
    const audioPart = {
      inlineData: {
        mimeType: mimeType.split(';')[0],
        data: audioBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          { text: 'Transcribe this spoken personal reflection verbatim. Output only the plain text transcription without preambles or notes.' },
        ],
      },
    });

    const transcript = response.text?.trim() || '';
    res.json({
      success: true,
      data: {
        transcript: transcript || 'Could not detect clear speech in recording.',
      },
    });
  } catch (err: any) {
    console.error('[Gemini STT error]', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRANSCRIPTION_FAILED',
        message: err.message || 'Speech-to-text transcription failed.',
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

// Audio TTS with gemini-3.8-flash-lite-tts
apiRouter.post('/audio/tts', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Missing text in request body',
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 1000),
              speechMetadata: {
                style: 'Calm, thoughtful, empathetic mentor',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('No audio returned by TTS model');
    }

    res.json({
      success: true,
      data: {
        audioData: base64Audio,
        mimeType: 'audio/wav',
      },
    });
  } catch (err: any) {
    console.error('[Gemini TTS error]', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'TTS_FAILED',
        message: err.message || 'Text-to-speech generation failed.',
        correlationId: (req as any).correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  }
});


// Mount /api/v1 router
app.use('/api/v1', apiRouter);

// Standard API Error Handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]', err);
  const errorEnvelope: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.',
      correlationId: (req as any).correlationId || 'none',
      timestamp: new Date().toISOString(),
    },
  };
  res.status(500).json(errorEnvelope);
});

// ==========================================
// STATIC FILES & VITE MIDDLEWARE
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Adora AI] Full-stack authoritative server running on http://0.0.0.0:${PORT}`);
    console.log(`[Adora AI] API Base: http://0.0.0.0:${PORT}/api/v1`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Adora AI server:', err);
  process.exit(1);
});
