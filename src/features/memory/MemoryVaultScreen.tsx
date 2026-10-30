/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Vault,
  Search,
  Plus,
  BookOpen,
  Sparkles,
  Flame,
  Network,
  CheckCircle2,
  Trash2,
  Tag,
  Clock,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Badge, ProvenanceChip } from '../../components/common/Badge.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { api } from '../../services/apiClient.ts';
import { Memory, MemoryType, MemoryApprovalState } from '../../types/domain.ts';

export const MemoryVaultScreen: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [activeTab, setActiveTab] = useState<MemoryType>('episodic');
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStatement, setNewStatement] = useState('');
  const [newContext, setNewContext] = useState('');
  const [newTags, setNewTags] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  useEffect(() => {
    loadMemories();
  }, [activeTab, approvalFilter]);

  async function loadMemories() {
    try {
      const state = approvalFilter === 'all' ? undefined : approvalFilter;
      const res = await api.getMemories(activeTab, state);
      setMemories(res.items || []);
    } catch (err) {
      console.error('Failed to load memories', err);
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return loadMemories();
    }
    try {
      const res = await api.searchMemories({
        query: searchQuery.trim(),
        types: [activeTab],
      });
      setMemories(res.matches.map((m) => m.memory));
    } catch (err) {
      console.error('Search error', err);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStatement.trim()) return;

    try {
      await api.createMemory({
        title: newTitle.trim(),
        statement: newStatement.trim(),
        detailedContext: newContext.trim() || undefined,
        type: activeTab,
        userApprovalState: 'approved',
        tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
        sourceReflectionIds: [],
      });
      setIsCreateOpen(false);
      setNewTitle('');
      setNewStatement('');
      setNewContext('');
      setNewTags('');
      await loadMemories();
    } catch (err: any) {
      alert(`Error creating memory: ${err.message}`);
    }
  };

  const tierMeta = {
    episodic: {
      label: 'Episodic Memory',
      description: 'Original experiences, reflections, and timestamped chronological milestones.',
      icon: BookOpen,
      color: 'text-cyan-400',
    },
    semantic: {
      label: 'Semantic Memory',
      description: 'Approved facts, durable personal preferences, context, and long-term values.',
      icon: Sparkles,
      color: 'text-purple-400',
    },
    relational: {
      label: 'Relational Memory',
      description: 'Links between people, projects, themes, decisions, and outcomes.',
      icon: Network,
      color: 'text-emerald-400',
    },
    procedural: {
      label: 'Procedural Memory',
      description: 'User-approved operating heuristics, workflow preferences, and daily habits.',
      icon: Flame,
      color: 'text-amber-400',
    },
  };

  const ActiveIcon = tierMeta[activeTab].icon;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
            <Vault className="w-5 h-5 text-amber-500" />
            <span>Memory Vault</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1 max-w-xl">
            User-governed persistent memory across four distinct cognitive tiers. Search, inspect,
            curate, or delete items. Nothing is promoted to permanent memory without approval.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateOpen(true)}
        >
          Add {tierMeta[activeTab].label.split(' ')[0]} Memory
        </Button>
      </div>

      {/* 4 Cognitive Tiers Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 rounded-xl bg-stone-900 border border-stone-800">
        {(['episodic', 'semantic', 'relational', 'procedural'] as MemoryType[]).map((type) => {
          const meta = tierMeta[type];
          const Icon = meta.icon;
          const isActive = activeTab === type;
          return (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`flex items-center gap-2.5 p-3 rounded-lg text-xs font-medium text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700/80'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${meta.color}`} />
              <div>
                <div className="font-semibold">{meta.label.split(' ')[0]}</div>
                <div className="text-[10px] text-stone-500 font-mono">
                  {memories.filter((m) => m.type === type).length} items
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tier Description & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-stone-900/60 border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center shrink-0">
            <ActiveIcon className={`w-4 h-4 ${tierMeta[activeTab].color}`} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-stone-200">{tierMeta[activeTab].label}</h3>
            <p className="text-[11px] text-stone-400">{tierMeta[activeTab].description}</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search statements..."
              className="w-48 sm:w-60 bg-stone-950 border border-stone-800 text-xs text-stone-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-500/40"
            />
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2" />
          </form>

          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All States</option>
            <option value="approved">Approved</option>
            <option value="candidate">Candidate</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Memories Grid */}
      {memories.length === 0 ? (
        <EmptyState
          icon={<Vault className="w-6 h-6 text-stone-400" />}
          title={`No ${tierMeta[activeTab].label} entries found`}
          description="Memories are user-approved facts and guidelines extracted from reflections or created manually."
          action={
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
              Create Memory Record
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memories.map((mem) => (
            <Card
              key={mem.id}
              hoverable
              onClick={() => setSelectedMemory(mem)}
              className="flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-xs font-semibold text-stone-100 line-clamp-1">{mem.title}</h4>
                  <Badge
                    variant={mem.userApprovalState === 'approved' ? 'emerald' : 'amber'}
                    size="sm"
                  >
                    {mem.userApprovalState}
                  </Badge>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed line-clamp-3 mb-3">
                  "{mem.statement}"
                </p>
              </div>

              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-300 font-mono">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-stone-300" />
                  <span className="truncate max-w-[120px]">
                    {mem.tags.length > 0 ? mem.tags.join(', ') : 'no tags'}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-stone-300">
                  <Clock className="w-3 h-3" />
                  {new Date(mem.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Memory Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={`Add ${tierMeta[activeTab].label.split(' ')[0]} Memory`}
        description="Add a durable, user-verified fact or procedure into your vault."
      >
        <form onSubmit={handleCreateMemory} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Morning Focus Blocks"
              className="w-full rounded-lg bg-stone-950 border border-stone-800 p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Distilled Statement / Rule
            </label>
            <textarea
              required
              rows={3}
              value={newStatement}
              onChange={(e) => setNewStatement(e.target.value)}
              placeholder="State the core principle or fact concisely..."
              className="w-full rounded-lg bg-stone-950 border border-stone-800 p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Context & Nuance (Optional)
            </label>
            <textarea
              rows={2}
              value={newContext}
              onChange={(e) => setNewContext(e.target.value)}
              placeholder="Under what conditions does this apply?"
              className="w-full rounded-lg bg-stone-950 border border-stone-800 p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="routine, focus, habit"
              className="w-full rounded-lg bg-stone-950 border border-stone-800 p-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save to Vault
            </Button>
          </div>
        </form>
      </Modal>

      {/* Memory Detail Modal */}
      {selectedMemory && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedMemory(null)}
          title={selectedMemory.title}
          description={`Type: ${selectedMemory.type} • Status: ${selectedMemory.userApprovalState}`}
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
              <div className="text-[11px] font-mono uppercase text-stone-400 mb-1">Statement</div>
              <p className="text-xs sm:text-sm text-stone-100 leading-relaxed">
                "{selectedMemory.statement}"
              </p>
            </div>

            {selectedMemory.detailedContext && (
              <div>
                <div className="text-[11px] font-mono uppercase text-stone-400 mb-1">Context</div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {selectedMemory.detailedContext}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-stone-400 pt-2 border-t border-stone-800">
              <div>Created: {new Date(selectedMemory.createdAt).toLocaleString()}</div>
              <div>Confidence: {(selectedMemory.confidenceScore * 100).toFixed(0)}%</div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-stone-800">
              <div className="flex items-center gap-1.5">
                <ProvenanceChip type="approved_fact" />
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelectedMemory(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
