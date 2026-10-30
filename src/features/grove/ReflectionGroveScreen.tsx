/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  GitFork,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Layers,
  Circle,
  Clock,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Tag,
  Compass,
} from 'lucide-react';
import { Card } from '../../components/common/Card.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Badge, ProvenanceChip } from '../../components/common/Badge.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { api } from '../../services/apiClient.ts';
import { GraphNode, GraphEdge, GraphNodeType } from '../../types/domain.ts';

export const ReflectionGroveScreen: React.FC = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    loadGraph();
  }, []);

  async function loadGraph() {
    try {
      const res = await api.getGroveGraph();
      setNodes(res.nodes || []);
      setEdges(res.edges || []);
      if (res.nodes?.length > 0) {
        setSelectedNode(res.nodes[0]);
      }
    } catch (err) {
      console.error('Failed to load grove graph', err);
    }
  }

  const nodeColorMap: Record<GraphNodeType, string> = {
    reflection: '#f59e0b', // amber
    theme: '#a855f7', // purple
    decision: '#10b981', // emerald
    goal: '#3b82f6', // blue
    event: '#06b6d4', // cyan
    task: '#f97316', // orange
    outcome: '#ec4899', // pink
    fact: '#eab308', // yellow
  };

  const filteredNodes = nodes.filter((n) => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
            <GitFork className="w-5 h-5 text-amber-500" />
            <span>Reflection Grove</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1 max-w-xl">
            Interactive relational knowledge graph. Visualizes connections across reflections,
            themes, decisions, tasks, and approved facts. Solid lines represent confirmed links;
            dashed lines represent candidate suggestions.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-stone-300 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-xl">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Reflection
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Theme
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Decision
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Goal
          </span>
        </div>
      </div>

      {/* Main Grove Layout: Canvas + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Graph Canvas (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-stone-800 bg-stone-950 p-4 relative min-h-[500px] flex flex-col justify-between overflow-hidden shadow-2xl">
          {/* Controls Bar */}
          <div className="flex items-center justify-between z-10 mb-4">
            <div className="flex items-center gap-2 bg-stone-900/80 border border-stone-800 p-1 rounded-lg backdrop-blur-sm">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent text-xs text-stone-300 px-2 py-1 focus:outline-none"
              >
                <option value="all">All Node Types</option>
                <option value="reflection">Reflections</option>
                <option value="theme">Themes</option>
                <option value="decision">Decisions</option>
                <option value="goal">Goals</option>
                <option value="fact">Facts</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-stone-900/80 border border-stone-800 p-1 rounded-lg backdrop-blur-sm">
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
                className="p-1 rounded text-stone-400 hover:text-stone-200"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
                className="p-1 rounded text-stone-400 hover:text-stone-200"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 rounded text-stone-400 hover:text-stone-200"
                title="Reset zoom"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SVG Graph Canvas */}
          {filteredNodes.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={<GitFork className="w-6 h-6 text-stone-400" />}
                title="No nodes in Reflection Grove"
                description="Nodes are automatically created when you record reflections, save memories, or plan workflows."
              />
            </div>
          ) : (
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <svg
                className="w-full h-[400px] transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <defs>
                  <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Render Edges */}
                {edges.map((edge, idx) => (
                  <line
                    key={edge.id || idx}
                    x1="200"
                    y1="180"
                    x2="350"
                    y2="220"
                    stroke="#57534e"
                    strokeWidth="1.5"
                    strokeDasharray={edge.approvalState === 'candidate' ? '4 3' : undefined}
                    strokeOpacity="0.6"
                  />
                ))}

                {/* Render Nodes in radial layout */}
                {filteredNodes.map((node, i) => {
                  const angle = (i / filteredNodes.length) * 2 * Math.PI;
                  const radius = 130;
                  const cx = 260 + radius * Math.cos(angle);
                  const cy = 200 + radius * Math.sin(angle);
                  const isSelected = selectedNode?.id === node.id;
                  const color = nodeColorMap[node.type] || '#f59e0b';

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer group"
                    >
                      {isSelected && (
                        <circle cx={cx} cy={cy} r="26" fill="url(#nodeGlow)" className="animate-pulse" />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? '14' : '10'}
                        fill={color}
                        stroke="#1c1917"
                        strokeWidth="3"
                        className="transition-all duration-200 group-hover:scale-125"
                      />
                      <text
                        x={cx}
                        y={cy + 22}
                        textAnchor="middle"
                        fill="#d6d3d1"
                        fontSize="10"
                        fontFamily="sans-serif"
                        className="select-none font-medium"
                      >
                        {node.label.slice(0, 16)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Footer Status */}
          <div className="z-10 text-[11px] font-mono text-stone-500 flex items-center justify-between border-t border-stone-800/80 pt-3 mt-2">
            <span>
              {filteredNodes.length} nodes active • {edges.length} relational edges
            </span>
            <span>Force Layout Engine Active</span>
          </div>
        </div>

        {/* Right: Node Detail Panel (1 col) */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Node Inspector</span>
          </h3>

          {!selectedNode ? (
            <Card className="text-center p-6 text-xs text-stone-500">
              Click any node in the Reflection Grove to inspect its properties and relationships.
            </Card>
          ) : (
            <Card className="border-stone-800 bg-stone-900/90 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-800">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                    {selectedNode.type} Node
                  </span>
                  <h4 className="text-sm font-semibold text-stone-100 mt-0.5">{selectedNode.label}</h4>
                </div>
                <ProvenanceChip
                  type={selectedNode.approvalState === 'confirmed' ? 'approved_fact' : 'hypothesis'}
                />
              </div>

              {selectedNode.description && (
                <div>
                  <div className="text-[11px] font-mono uppercase text-stone-400 mb-1">Description</div>
                  <p className="text-xs text-stone-300 leading-relaxed p-3 rounded-lg bg-stone-950 border border-stone-800">
                    "{selectedNode.description}"
                  </p>
                </div>
              )}

              <div className="space-y-2 text-xs font-mono text-stone-400 pt-2 border-t border-stone-800">
                <div className="flex justify-between">
                  <span>Source Type:</span>
                  <span className="text-stone-200">{selectedNode.sourceEntityType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Source ID:</span>
                  <span className="text-stone-200">#{selectedNode.sourceEntityId.slice(0, 10)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="text-stone-200">{new Date(selectedNode.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                <span className="text-[11px] text-stone-500">Node ID: {selectedNode.id}</span>
                <Badge variant={selectedNode.approvalState === 'confirmed' ? 'emerald' : 'amber'} size="sm">
                  {selectedNode.approvalState}
                </Badge>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
