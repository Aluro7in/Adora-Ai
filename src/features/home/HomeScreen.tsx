/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  PenTool,
  Sparkles,
  Vault,
  Workflow,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Flame,
  Plus,
  Compass,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card.tsx';
import { Button } from '../../components/common/Button.tsx';
import { StatusPill, TierBadge } from '../../components/common/Badge.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { api } from '../../services/apiClient.ts';
import { Reflection, Memory, Task, Workflow as WorkflowType } from '../../types/domain.ts';
import { NavModule } from '../../components/layout/Shell.tsx';

interface HomeScreenProps {
  onNavigate: (module: NavModule) => void;
  onOpenReflectModal: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, onOpenReflectModal }) => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [refRes, memRes, taskRes, wfRes] = await Promise.all([
          api.getReflections(),
          api.getMemories(),
          api.getTasks(),
          api.getWorkflows(),
        ]);
        setReflections(refRes.items || []);
        setMemories(memRes.items || []);
        setTasks(taskRes.items || []);
        setWorkflows(wfRes.items || []);
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const pendingApprovals = tasks.filter((t) => t.status === 'AWAITING_APPROVAL');
  const recentReflections = reflections.slice(0, 3);
  const memoryCounts = {
    episodic: memories.filter((m) => m.type === 'episodic').length,
    semantic: memories.filter((m) => m.type === 'semantic').length,
    relational: memories.filter((m) => m.type === 'relational').length,
    procedural: memories.filter((m) => m.type === 'procedural').length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ========================================================= */}
      {/* WELCOME HERO & REFLECT ENTRY POINT */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-800 bg-gradient-to-b from-stone-900/90 via-stone-900/50 to-stone-950 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Capture → Understand → Act → Verify → Learn</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-100">
              Welcome back to Adora AI
            </h2>
            <p className="text-sm text-stone-400 leading-relaxed">
              Your personal reflective intelligence platform. Reflect on today's decisions, synthesize
              evidence-backed patterns, and execute verified actions with independent proof.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="lg"
              icon={<PenTool className="w-4 h-4" />}
              onClick={onOpenReflectModal}
            >
              Capture Reflection
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon={<Sparkles className="w-4 h-4 text-amber-400" />}
              onClick={() => onNavigate('chat')}
            >
              Ask Adora Chat
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PENDING APPROVAL GATEWAY (Crucial for Tier 2 safety) */}
      {/* ========================================================= */}
      {pendingApprovals.length > 0 && (
        <div className="border border-amber-500/40 rounded-xl bg-amber-950/20 p-5 backdrop-blur-sm animate-pulse-subtle">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-200">
                Action Required: {pendingApprovals.length} Consequential Task Pending Approval
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('tasks')}
              className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
            >
              Review Queue
            </Button>
          </div>
          <p className="text-xs text-stone-400 mb-3">
            In accordance with Adora's safety architecture, Tier 2 external actions require your
            explicit consent before execution.
          </p>
          <div className="space-y-2">
            {pendingApprovals.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg bg-stone-900/90 border border-stone-800 text-xs"
              >
                <div>
                  <div className="font-medium text-stone-200">{task.title}</div>
                  <div className="text-[11px] text-stone-300 font-mono">Tool: {task.toolName}</div>
                </div>
                <div className="flex items-center gap-2">
                  <TierBadge tier={task.consequentialityTier} />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onNavigate('tasks')}
                  >
                    Examine & Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* METRICS & COGNITIVE SNAPSHOT */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverable onClick={() => onNavigate('vault')}>
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Episodic Vault</span>
            <Vault className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-stone-100">{memoryCounts.episodic}</div>
          <div className="text-[11px] text-stone-500 mt-1">Chronological events & entries</div>
        </Card>

        <Card hoverable onClick={() => onNavigate('vault')}>
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Semantic Facts</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-stone-100">{memoryCounts.semantic}</div>
          <div className="text-[11px] text-stone-500 mt-1">Validated preferences & context</div>
        </Card>

        <Card hoverable onClick={() => onNavigate('vault')}>
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Procedural Habits</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-stone-100">{memoryCounts.procedural}</div>
          <div className="text-[11px] text-stone-500 mt-1">Operating heuristics & workflows</div>
        </Card>

        <Card hoverable onClick={() => onNavigate('receipts')}>
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Verified Actions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-stone-100">
            {tasks.filter((t) => t.status === 'VERIFIED').length}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Cryptographic execution receipts</div>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* RECENT REFLECTIONS & ACTIVE WORKFLOWS */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reflections */}
        <Card>
          <CardHeader
            title="Recent Reflections"
            subtitle="Original verbatim journal entries and notes"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('reflect')}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View all
              </Button>
            }
          />

          {recentReflections.length === 0 ? (
            <EmptyState
              icon={<PenTool className="w-5 h-5 text-stone-400" />}
              title="No reflections recorded yet"
              description="Capture your thoughts, decisions, and obstacles. Adora extracts structured entities and helps detect recurring patterns."
              action={
                <Button variant="primary" size="sm" onClick={onOpenReflectModal}>
                  Write First Reflection
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {recentReflections.map((ref) => (
                <div
                  key={ref.id}
                  onClick={() => onNavigate('reflect')}
                  className="p-3.5 rounded-lg bg-stone-900 border border-stone-800/80 hover:border-stone-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1.5 font-mono">
                    <span className="capitalize text-amber-400/90 font-medium">{ref.category}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-stone-200 line-clamp-2 leading-relaxed group-hover:text-stone-100">
                    {ref.rawText}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Active Workflows & Agent Execution */}
        <Card>
          <CardHeader
            title="Active Workflows & Agent Plans"
            subtitle="Goal-to-DAG decompositions with deterministic progress"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('workflows')}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View all
              </Button>
            }
          />

          {workflows.length === 0 ? (
            <EmptyState
              icon={<Workflow className="w-5 h-5 text-stone-400" />}
              title="No active workflows"
              description="Formulate a high-level goal in natural language. Adora plans a structured dependency graph of tasks with verification checkpoints."
              action={
                <Button variant="secondary" size="sm" onClick={() => onNavigate('workflows')}>
                  Plan a Goal
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {workflows.slice(0, 3).map((wf) => (
                <div
                  key={wf.id}
                  onClick={() => onNavigate('workflows')}
                  className="p-3.5 rounded-lg bg-stone-900 border border-stone-800/80 hover:border-stone-700 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-stone-200 truncate max-w-xs">
                      {wf.goal}
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-stone-800 text-stone-300 px-2 py-0.5 rounded">
                      {wf.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 line-clamp-1">{wf.rationale}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
