/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Blocks,
  Calendar,
  Mail,
  HardDrive,
  Table,
  Globe,
  CheckCircle2,
  XCircle,
  Shield,
  Key,
  Terminal,
  Cpu,
  Search,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Plus,
  Play,
} from 'lucide-react';
import { Card } from '../../components/common/Card.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Badge } from '../../components/common/Badge.tsx';
import { api } from '../../services/apiClient.ts';
import { Integration } from '../../types/domain.ts';

export const IntegrationsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'servers' | 'tools' | 'rag_knowledge'>('tools');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [mcpTools, setMcpTools] = useState<any[]>([]);
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [ragDocs, setRagDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionOutput, setActionOutput] = useState<string | null>(null);

  // New RAG doc upload state
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocText, setNewDocText] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setIsLoading(true);
    try {
      const [intRes, toolsRes, srvRes, ragRes] = await Promise.all([
        api.getIntegrations(),
        api.getMCPTools(),
        api.getMCPServers(),
        api.getRAGDocuments(),
      ]);
      setIntegrations(intRes.items || []);
      setMcpTools(toolsRes.tools || []);
      setMcpServers(srvRes.servers || []);
      setRagDocs(ragRes.items || []);
    } catch (err) {
      console.error('Failed to load MCP & Integration data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConnectServer(serverId: string) {
    try {
      await api.connectMCPServer(serverId);
      setActionOutput(`MCP Server '${serverId}' handshake completed. Protocol version 2024-11-05 negotiated.`);
      loadAll();
    } catch (err: any) {
      setActionOutput(`Connection error: ${err.message}`);
    }
  }

  async function handleTestTool(toolName: string, tier: number) {
    try {
      setActionOutput(`Executing tool '${toolName}'...`);
      const res = await api.callMCPTool(toolName, { query: 'Architecture principles' }, tier === 2);
      setActionOutput(`[Execution Receipt]: ${JSON.stringify(res, null, 2)}`);
    } catch (err: any) {
      setActionOutput(`Tool error: ${err.message}`);
    }
  }

  async function handleIngestRAG() {
    if (!newDocText.trim()) return;
    setIsIngesting(true);
    try {
      const res = await api.ingestRAGDocument({
        title: newDocTitle || 'Custom Knowledge Note',
        text: newDocText,
        sourceType: 'knowledge',
      });
      setActionOutput(`Ingested: ${res.title} (${res.chunkCount} chunks generated, embeddings calculated).`);
      setNewDocTitle('');
      setNewDocText('');
      loadAll();
    } catch (err: any) {
      setActionOutput(`Ingestion failed: ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google_calendar':
        return <Calendar className="w-5 h-5 text-blue-400" />;
      case 'gmail':
        return <Mail className="w-5 h-5 text-rose-400" />;
      case 'google_drive':
        return <HardDrive className="w-5 h-5 text-amber-400" />;
      case 'google_sheets':
        return <Table className="w-5 h-5 text-emerald-400" />;
      default:
        return <Globe className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
            <Blocks className="w-5 h-5 text-amber-500" />
            <span>MCP Architecture & Integrations</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1 max-w-xl">
            Official Model Context Protocol (MCP 2024-11-05) Server & Client. Enforces per-user boundaries,
            consequentiality gating, and independent cryptographic receipts.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-stone-900 border border-stone-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'tools'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Registered Tools ({mcpTools.length})
          </button>
          <button
            onClick={() => setActiveTab('servers')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'servers'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            MCP Servers & Connectors
          </button>
          <button
            onClick={() => setActiveTab('rag_knowledge')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'rag_knowledge'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            RAG Ingested Docs ({ragDocs.length})
          </button>
        </div>
      </div>

      {/* Action / Output Banner */}
      {actionOutput && (
        <Card className="border-amber-500/30 bg-stone-950 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Terminal className="w-4 h-4 text-amber-500 shrink-0" />
              <span>MCP Protocol Execution Receipt</span>
            </div>
            <button
              onClick={() => setActionOutput(null)}
              className="text-stone-500 hover:text-stone-300 text-xs"
            >
              Dismiss
            </button>
          </div>
          <pre className="mt-2 text-xs text-stone-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto bg-stone-900/60 p-2.5 rounded-lg border border-stone-800">
            {actionOutput}
          </pre>
        </Card>
      )}

      {/* TAB 1: REGISTERED MCP TOOLS */}
      {activeTab === 'tools' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mcpTools.map((tool) => {
              const tier = tool.consequentialityTier;
              return (
                <Card
                  key={tool.name}
                  className="border-stone-800 bg-stone-900/90 p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-stone-400" />
                        <span>{tool.name}</span>
                      </div>
                      <Badge
                        variant={tier === 2 ? 'amber' : tier === 1 ? 'stone' : 'emerald'}
                        size="sm"
                      >
                        {tier === 2 ? 'Tier 2 (Approval Required)' : tier === 1 ? 'Tier 1 Mutation' : 'Tier 0 Safe'}
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-400 line-clamp-2">{tool.description}</p>
                  </div>

                  <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 font-mono">
                      {tool.readOnly ? 'read_only' : 'mutation'}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTestTool(tool.name, tier)}
                      className="h-7 text-xs flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 text-emerald-400" />
                      <span>Test Invocation</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: EXTERNAL MCP SERVERS & OAUTH INTEGRATIONS */}
      {activeTab === 'servers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mcpServers.map((server) => {
              const isConnected = server.status === 'connected';
              return (
                <Card key={server.serverId} className="border-stone-800 bg-stone-900/90 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700/60 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-stone-100">{server.name}</h3>
                        <div className="text-[11px] text-stone-500 font-mono truncate max-w-[200px]">
                          {server.endpointUrl}
                        </div>
                      </div>
                    </div>
                    <Badge variant={isConnected ? 'emerald' : 'stone'} size="sm">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>

                  <div className="text-xs text-stone-400 space-y-1">
                    <div className="font-mono text-[10px] uppercase text-stone-500">Allowed Tool Contracts:</div>
                    <div className="flex flex-wrap gap-1">
                      {server.allowedTools.map((t: string) => (
                        <span
                          key={t}
                          className="text-[10px] font-mono bg-stone-950 border border-stone-800 text-stone-300 px-2 py-0.5 rounded"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                    <span className="text-[11px] text-stone-500">
                      {server.lastConnectedAt
                        ? `Last sync: ${new Date(server.lastConnectedAt).toLocaleTimeString()}`
                        : 'Never connected'}
                    </span>
                    <Button
                      variant={isConnected ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => handleConnectServer(server.serverId)}
                    >
                      {isConnected ? 'Re-Sync Handshake' : 'Connect Server'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: RAG KNOWLEDGE BASE & DOCUMENT INGESTION */}
      {activeTab === 'rag_knowledge' && (
        <div className="space-y-6">
          {/* Ingestion Box */}
          <Card className="border-stone-800 bg-stone-900/90 p-5 space-y-4">
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-500" />
              <span>Ingest Document into RAG Engine</span>
            </h3>
            <p className="text-xs text-stone-400">
              Ingested text is normalized, parsed into intelligent semantic chunks, embedded with 768-dim vectors,
              and dual-indexed (Vector cosine similarity + BM25 Lexical index) for grounded retrieval.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Document Title (e.g. Adora System Principles)"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/50"
              />
              <textarea
                placeholder="Paste document text, research notes, or executive briefing..."
                rows={4}
                value={newDocText}
                onChange={(e) => setNewDocText(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/50 resize-none font-mono"
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isIngesting || !newDocText.trim()}
                  onClick={handleIngestRAG}
                >
                  {isIngesting ? 'Chunking & Embedding...' : 'Ingest & Index'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Document list */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase text-stone-400 tracking-wider">
              Authoritative Indexed Documents ({ragDocs.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ragDocs.map((doc) => (
                <Card key={doc.documentId} className="border-stone-800 bg-stone-900/80 p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="font-semibold text-xs text-stone-200 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>{doc.title}</span>
                    </div>
                    <Badge variant="emerald" size="sm">
                      Indexed
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-stone-400 font-mono">
                    <span>{doc.chunkCount} Chunks</span>
                    <span>•</span>
                    <span>{doc.wordCount} Words</span>
                    <span>•</span>
                    <span>{doc.dimensions}d Vectors</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
