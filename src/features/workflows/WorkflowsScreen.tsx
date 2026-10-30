/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Workflow as WorkflowIcon,
  Plus,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Badge, StatusPill, TierBadge } from '../../components/common/Badge.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { api } from '../../services/apiClient.ts';
import { Workflow, Task } from '../../types/domain.ts';

export const WorkflowsScreen: React.FC<{ onNavigateToTasks: () => void }> = ({ onNavigateToTasks }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goalInput, setGoalInput] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [wfRes, taskRes] = await Promise.all([api.getWorkflows(), api.getTasks()]);
      setWorkflows(wfRes.items || []);
      setTasks(taskRes.items || []);
    } catch (err) {
      console.error('Failed to load workflows', err);
    }
  }

  const handlePlanWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim() || isPlanning) return;

    try {
      setIsPlanning(true);
      await api.planWorkflow({ goal: goalInput.trim() });
      setGoalInput('');
      await loadData();
    } catch (err: any) {
      alert(`Planning failed: ${err.message}`);
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
          <WorkflowIcon className="w-5 h-5 text-amber-500" />
          <span>Workflows & Goal Planning</span>
        </h2>
        <p className="text-xs text-stone-400 mt-1 max-w-xl">
          Adaptive goal-to-DAG planner powered by NVIDIA Nemotron. Translates high-level strategic
          intents into dependency-ordered tasks with clear consequentiality checkpoints.
        </p>
      </div>

      {/* Goal Planner Input Form */}
      <Card className="border-amber-500/30 bg-stone-900/90 shadow-lg">
        <form onSubmit={handlePlanWorkflow} className="space-y-4">
          <CardHeader
            title="Formulate a High-Level Goal"
            subtitle="Nemotron decomposes your objective into discrete, verifiable actions"
            action={<span className="text-xs font-mono text-amber-400">Agent Planner Active</span>}
          />

          <div>
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="e.g., Schedule a 90-minute focus block on my calendar and email a project debrief draft to the team..."
              className="w-full rounded-xl bg-stone-950 border border-stone-800 p-4 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-stone-500">
              Consequential actions (emails, mutations) will halt for explicit human approval.
            </span>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Sparkles className="w-4 h-4" />}
              isLoading={isPlanning}
              disabled={!goalInput.trim()}
            >
              Plan Workflow with Nemotron
            </Button>
          </div>
        </form>
      </Card>

      {/* Workflows List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-stone-200">
          Structured Workflow Plans ({workflows.length})
        </h3>

        {workflows.length === 0 ? (
          <EmptyState
            icon={<WorkflowIcon className="w-6 h-6 text-stone-400" />}
            title="No workflows planned yet"
            description="Enter a goal above to watch Adora construct a dependency-ordered plan with verification criteria."
          />
        ) : (
          <div className="space-y-4">
            {workflows.map((wf) => {
              const childTasks = tasks.filter((t) => t.workflowId === wf.id);
              const pendingCount = childTasks.filter((t) => t.status === 'AWAITING_APPROVAL').length;

              return (
                <Card key={wf.id} className="border-stone-800 bg-stone-900/90 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-stone-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-stone-100">{wf.goal}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-stone-800 text-stone-300">
                          {wf.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 leading-relaxed">{wf.rationale}</p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onNavigateToTasks}
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Open Task Board
                    </Button>
                  </div>

                  {/* Task DAG Decomposition Preview */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
                      Planned Task Sequence ({childTasks.length} steps)
                    </div>

                    <div className="space-y-2">
                      {childTasks.map((task, idx) => (
                        <div
                          key={task.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-stone-950 border border-stone-800/80 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center font-mono text-[11px] text-stone-400 shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-medium text-stone-200">{task.title}</div>
                              <div className="text-[11px] text-stone-500 font-mono">
                                Tool: {task.toolName}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <TierBadge tier={task.consequentialityTier} />
                            <StatusPill status={task.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
