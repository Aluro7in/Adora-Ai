/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Quote,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Check,
  X,
  Compass,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Badge, ProvenanceChip } from '../../components/common/Badge.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { api } from '../../services/apiClient.ts';
import { Insight } from '../../types/domain.ts';

export const InsightsScreen: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [filterState, setFilterState] = useState<'all' | 'candidate' | 'confirmed'>('all');

  useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights() {
    try {
      const res = await api.getInsights();
      setInsights(res.items || []);
    } catch (err) {
      console.error('Failed to load insights', err);
    }
  }

  const handleDiscover = async () => {
    try {
      setIsDiscovering(true);
      const res = await api.discoverInsights();
      if (res.candidateInsights && res.candidateInsights.length > 0) {
        await loadInsights();
      } else if (res.message) {
        alert(res.message);
      }
    } catch (err: any) {
      alert(`Discovery failed: ${err.message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: Insight['status']) => {
    try {
      await api.updateInsightStatus(id, status);
      await loadInsights();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const filtered = insights.filter((i) => {
    if (filterState === 'all') return true;
    return i.status === filterState;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Evidence-Backed Insights</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1 max-w-xl">
            Pattern discovery synthesizing recurring dynamics across reflections. Inferences are
            framed strictly as hypotheses, showing both supporting evidence and counter-evidence.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Sparkles className="w-4 h-4" />}
          isLoading={isDiscovering}
          onClick={handleDiscover}
        >
          Discover New Patterns
        </Button>
      </div>

      {/* Non-Diagnostic Epistemic Guarantee Banner */}
      <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 text-xs text-stone-400 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-stone-200">Non-Diagnostic Guarantee:</strong> Adora does not infer
          psychological or clinical conclusions. Every candidate pattern requires multiple source
          citations, preserves counter-evidence, and remains a hypothesis until you confirm it.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
        {(['all', 'candidate', 'confirmed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterState(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
              filterState === tab
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            {tab} Patterns ({insights.filter((i) => (tab === 'all' ? true : i.status === tab)).length})
          </button>
        ))}
      </div>

      {/* Insights List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Lightbulb className="w-6 h-6 text-stone-400" />}
          title="No pattern insights detected yet"
          description="Capture reflections across multiple days or click 'Discover New Patterns' to analyze your history with Nemotron."
          action={
            <Button variant="primary" size="sm" onClick={handleDiscover}>
              Run Pattern Discovery
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((insight) => (
            <Card key={insight.id} className="border-stone-800 bg-stone-900/90 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-stone-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-stone-100">{insight.title}</h3>
                    <Badge
                      variant={insight.status === 'confirmed' ? 'emerald' : 'amber'}
                      size="sm"
                    >
                      {insight.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-amber-300/90 font-medium leading-relaxed">
                    Hypothesis: {insight.hypothesis}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <ProvenanceChip type="hypothesis" />
                  <span className="text-xs text-stone-400 font-mono">
                    Confidence: {(insight.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">{insight.description}</p>

              {/* Supporting Evidence */}
              <div>
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Supporting Evidence Citations ({insight.supportingEvidence.length})</span>
                </h4>
                <div className="space-y-2">
                  {insight.supportingEvidence.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-stone-950 border border-stone-800/80 text-xs text-stone-300 flex items-start gap-2.5"
                    >
                      <Quote className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="italic">"{ev.quote}"</p>
                        <div className="text-[10px] text-stone-500 font-mono mt-1">
                          Source Reflection #{ev.reflectionId.slice(0, 8)} •{' '}
                          {new Date(ev.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Counter Evidence */}
              {insight.counterEvidence.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-orange-400 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Counter-Evidence / Nuance ({insight.counterEvidence.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {insight.counterEvidence.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-stone-950 border border-stone-800/80 text-xs text-stone-300 flex items-start gap-2.5"
                      >
                        <Quote className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="italic">"{ev.quote}"</p>
                          <div className="text-[10px] text-stone-500 font-mono mt-1">
                            Counter Citation #{ev.reflectionId.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-800">
                <span className="text-[11px] text-stone-500">
                  Confirming this pattern promotes it to a permanent Semantic Memory.
                </span>

                <div className="flex items-center gap-2">
                  {insight.status === 'candidate' && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<X className="w-3.5 h-3.5" />}
                        onClick={() => handleUpdateStatus(insight.id, 'dismissed')}
                      >
                        Dismiss
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Check className="w-3.5 h-3.5" />}
                        onClick={() => handleUpdateStatus(insight.id, 'confirmed')}
                      >
                        Confirm Pattern
                      </Button>
                    </>
                  )}
                  {insight.status === 'confirmed' && (
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmed by You
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
