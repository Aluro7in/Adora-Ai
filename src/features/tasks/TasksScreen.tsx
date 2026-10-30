/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Search,
  X,
  Play,
  CheckCircle2,
  ExternalLink,
  Filter,
  Check,
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  FolderGit2,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { Card } from '../../components/common/Card.tsx';
import { Button } from '../../components/common/Button.tsx';
import { StatusPill, TierBadge } from '../../components/common/Badge.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { api } from '../../services/apiClient.ts';
import { Task, TaskStatus } from '../../types/domain.ts';

// Board Column Configuration
interface BoardColumnDef {
  id: TaskStatus;
  title: string;
  description: string;
  color: string;
  headerBg: string;
  borderAccent: string;
}

const BOARD_COLUMNS: BoardColumnDef[] = [
  {
    id: 'PLANNED',
    title: 'Planned',
    description: 'Decomposed steps awaiting dispatch',
    color: 'text-stone-400',
    headerBg: 'bg-stone-800/40',
    borderAccent: 'border-stone-700/60',
  },
  {
    id: 'AWAITING_APPROVAL',
    title: 'Awaiting Approval',
    description: 'Tier 2 consequential actions requiring gatekeeper sign-off',
    color: 'text-amber-400',
    headerBg: 'bg-amber-950/20',
    borderAccent: 'border-amber-500/40',
  },
  {
    id: 'APPROVED',
    title: 'Approved',
    description: 'Authorized by user, ready for execution',
    color: 'text-blue-400',
    headerBg: 'bg-blue-950/20',
    borderAccent: 'border-blue-500/40',
  },
  {
    id: 'RUNNING',
    title: 'In Progress',
    description: 'Actively dispatching external tools',
    color: 'text-cyan-400',
    headerBg: 'bg-cyan-950/20',
    borderAccent: 'border-cyan-500/40',
  },
  {
    id: 'VERIFIED',
    title: 'Verified',
    description: 'Cryptographically proven with SHA-256 receipt',
    color: 'text-emerald-400',
    headerBg: 'bg-emerald-950/20',
    borderAccent: 'border-emerald-500/40',
  },
];

export const TasksScreen: React.FC<{ onNavigateToReceipts: () => void }> = ({
  onNavigateToReceipts,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const res = await api.getTasks();
      setTasks(res.items || []);
    } catch (err) {
      console.error('Failed to load tasks', err);
    }
  }

  // Extract unique projects from tasks
  const uniqueProjects = useMemo(() => {
    const projects = new Set<string>();
    tasks.forEach((t) => {
      if (t.project && t.project.trim().length > 0) {
        projects.add(t.project.trim());
      }
    });
    return Array.from(projects);
  }, [tasks]);

  // Filter tasks based on Search Query, Project, and Status
  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      // Status filter
      if (filterStatus !== 'all' && task.status !== filterStatus) {
        return false;
      }

      // Project filter
      if (selectedProject !== 'all') {
        const taskProject = (task.project || '').toLowerCase();
        if (taskProject !== selectedProject.toLowerCase()) {
          return false;
        }
      }

      // Text Search Query: matches title or project (and workflow/description)
      if (q.length > 0) {
        const titleMatch = task.title.toLowerCase().includes(q);
        const projectMatch = Boolean(task.project && task.project.toLowerCase().includes(q));
        const descMatch = task.description.toLowerCase().includes(q);
        const workflowMatch = task.workflowId.toLowerCase().includes(q);
        const toolMatch = task.toolName.toLowerCase().includes(q);

        if (!titleMatch && !projectMatch && !descMatch && !workflowMatch && !toolMatch) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, searchQuery, selectedProject, filterStatus]);

  // Handle task approval (Tier 2 Consequential gate)
  const handleApprove = async (taskId: string) => {
    try {
      setIsProcessing(taskId);
      await api.approveTask(taskId);
      setFeedbackMessage({ text: 'Task approved! Moved to Approved column.', type: 'success' });
      await loadTasks();
    } catch (err: any) {
      setFeedbackMessage({ text: `Approval failed: ${err.message}`, type: 'error' });
    } finally {
      setIsProcessing(null);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  // Handle task execution and verification
  const handleExecute = async (taskId: string) => {
    try {
      setIsProcessing(taskId);
      const res = await api.executeTask(taskId);
      const digest = res.receipt.outputPayloadHash.slice(0, 10);
      setFeedbackMessage({
        text: `Action executed & independently verified! Cryptographic receipt #${digest} generated. Moved to Verified column.`,
        type: 'success',
      });
      await loadTasks();
    } catch (err: any) {
      setFeedbackMessage({ text: `Execution failed: ${err.message}`, type: 'error' });
    } finally {
      setIsProcessing(null);
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  // Handle moving task directly between columns / statuses on the board
  const handleMoveStatus = async (taskId: string, targetStatus: TaskStatus) => {
    try {
      setIsProcessing(taskId);
      // Optimistically update locally so Framer Motion animates instantly
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus, updatedAt: new Date().toISOString() } : t))
      );
      await api.updateTaskStatus(taskId, targetStatus);
      await loadTasks();
    } catch (err: any) {
      console.error('Failed to change status', err);
      await loadTasks();
    } finally {
      setIsProcessing(null);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedProject('all');
    setFilterStatus('all');
  };

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedProject !== 'all' || filterStatus !== 'all';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-500" />
            <span>Agent Tasks & Action Board</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1 max-w-xl">
            Deterministic 8-state task execution. Consequential Tier 2 actions require explicit human approval.
            Observe smooth Framer Motion transitions as status chips move across board columns upon approval and verification.
          </p>
        </div>

        {/* View Switcher & Reload */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center rounded-lg bg-stone-900 border border-stone-800 p-1">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'board'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Board Kanban view with columns"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board Columns</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Detailed list view"
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadTasks}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            title="Refresh tasks"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Floating Feedback Notification */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : feedbackMessage.type === 'error'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                : 'bg-stone-850 border-stone-700 text-stone-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-stone-400 hover:text-stone-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters Toolbar */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Text Input Field: Search through active tasks by title or project */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search active tasks by title or project (e.g. 'focus', 'Architecture', 'email')..."
              className="w-full bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 text-xs sm:text-sm rounded-xl pl-10 pr-9 py-2.5 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 transition-colors p-1"
                title="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status & Project Quick Selectors */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Project Filter */}
            <div className="flex items-center gap-1.5 text-xs text-stone-400">
              <FolderGit2 className="w-3.5 h-3.5 text-stone-500" />
              <span>Project:</span>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">All Projects ({uniqueProjects.length > 0 ? uniqueProjects.length : 'All'})</option>
                {uniqueProjects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-stone-400">
              <Filter className="w-3.5 h-3.5 text-stone-500" />
              <span>Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">All Statuses ({tasks.length})</option>
                <option value="PLANNED">Planned</option>
                <option value="AWAITING_APPROVAL">Awaiting Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="RUNNING">In Progress</option>
                <option value="VERIFIED">Verified</option>
              </select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-stone-400 hover:text-amber-400 text-xs"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Quick Project Tags Pills & Active Results Stats */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
              Filter by project:
            </span>
            <button
              onClick={() => setSelectedProject('all')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                selectedProject === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700/60'
              }`}
            >
              All
            </button>
            {uniqueProjects.map((proj) => (
              <button
                key={proj}
                onClick={() => setSelectedProject(selectedProject === proj ? 'all' : proj)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  selectedProject === proj
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-stone-800/80 text-stone-400 hover:text-stone-200 border border-stone-700/50'
                }`}
              >
                {proj}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-stone-400 font-mono">
            Showing <span className="text-amber-400 font-bold">{filteredTasks.length}</span> of {tasks.length} active tasks
            {searchQuery.trim() && (
              <span className="text-stone-500 ml-1">
                for query &ldquo;<span className="text-stone-300">{searchQuery}</span>&rdquo;
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Board View vs List View */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8 text-stone-500" />}
          title="No tasks match your search or filter"
          description={
            hasActiveFilters
              ? 'Try adjusting your search query, selecting "All Projects", or resetting filters.'
              : 'Formulate a goal in the Workflows module to plan and dispatch structured agent tasks.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="secondary" size="sm" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            ) : undefined
          }
        />
      ) : viewMode === 'board' ? (
        /* ========================================================================= */
        /* TASK BOARD COMPONENT WITH COLUMNS & FRAMER MOTION TRANSITIONS */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {BOARD_COLUMNS.map((col) => {
            // Tasks assigned to this column
            const columnTasks = filteredTasks.filter((t) => {
              if (col.id === 'RUNNING') {
                return t.status === 'RUNNING' || t.status === 'EXECUTED';
              }
              return t.status === col.id;
            });

            return (
              <div
                key={col.id}
                className="flex flex-col bg-stone-900/60 border border-stone-800 rounded-xl overflow-hidden min-h-[460px] shadow-sm"
              >
                {/* Column Header */}
                <div className={`p-3 border-b ${col.borderAccent} ${col.headerBg} flex items-center justify-between`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                        {col.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-850 text-stone-300 border border-stone-700">
                        {columnTasks.length}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">{col.description}</p>
                  </div>
                </div>

                {/* Column Cards Container */}
                <div className="p-2.5 flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[720px]">
                  <AnimatePresence mode="popLayout">
                    {columnTasks.length === 0 ? (
                      <motion.div
                        key={`empty-${col.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-6 text-center border border-dashed border-stone-800/80 rounded-xl my-auto text-stone-500 text-xs"
                      >
                        No tasks in this column
                      </motion.div>
                    ) : (
                      columnTasks.map((task) => {
                        const isAwaiting = task.status === 'AWAITING_APPROVAL';
                        const isApproved = task.status === 'APPROVED';
                        const isVerified = task.status === 'VERIFIED';
                        const isBusy = isProcessing === task.id;

                        return (
                          <motion.div
                            key={task.id}
                            layout
                            layoutId={`task-card-${task.id}`}
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94 }}
                            transition={{
                              type: 'spring',
                              stiffness: 420,
                              damping: 30,
                              mass: 0.8,
                            }}
                            className={`p-3.5 rounded-xl border bg-stone-950/80 shadow-md flex flex-col justify-between gap-3 group transition-colors ${
                              isAwaiting
                                ? 'border-amber-500/50 hover:border-amber-400/70 bg-amber-950/10'
                                : isVerified
                                ? 'border-emerald-500/40 hover:border-emerald-400/60'
                                : 'border-stone-800 hover:border-stone-700'
                            }`}
                          >
                            {/* Card Header & Status Chip */}
                            <div className="space-y-2">
                              {/* Task Status Chip with Framer Motion Transition */}
                              <div className="flex items-center justify-between gap-1">
                                <motion.div
                                  layout
                                  layoutId={`status-chip-${task.id}`}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 450,
                                    damping: 28,
                                    mass: 0.8,
                                  }}
                                >
                                  <StatusPill
                                    status={task.status}
                                    layoutId={`status-pill-inner-${task.id}`}
                                  />
                                </motion.div>
                                <TierBadge tier={task.consequentialityTier} />
                              </div>

                              {/* Project Tag */}
                              {task.project && (
                                <div className="flex items-center gap-1 text-[10px] text-amber-400/90 font-medium">
                                  <FolderGit2 className="w-3 h-3 text-amber-500/70 shrink-0" />
                                  <span className="truncate">{task.project}</span>
                                </div>
                              )}

                              {/* Task Title */}
                              <h4 className="text-xs font-semibold text-stone-100 leading-snug line-clamp-2">
                                {task.title}
                              </h4>

                              {/* Task Description */}
                              <p className="text-[11px] text-stone-400 leading-relaxed line-clamp-3">
                                {task.description}
                              </p>
                            </div>

                            {/* Card Footer: Metadata and Action Transitions */}
                            <div className="space-y-2 pt-2 border-t border-stone-850">
                              <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
                                <span>tool: {task.toolName}</span>
                                <span>#{task.id.slice(0, 7)}</span>
                              </div>

                              {/* Contextual Actions to Trigger Column Moves */}
                              <div className="flex flex-col gap-1.5 pt-1">
                                {/* Tier 2 Gate: Approve Action */}
                                {isAwaiting && (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    isLoading={isBusy}
                                    icon={<Check className="w-3.5 h-3.5" />}
                                    onClick={() => handleApprove(task.id)}
                                    className="w-full text-xs justify-center"
                                  >
                                    Approve Action
                                  </Button>
                                )}

                                {/* Execute & Verify Action */}
                                {(isApproved || task.consequentialityTier < 2) && !isVerified && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    isLoading={isBusy}
                                    icon={<Play className="w-3.5 h-3.5 text-amber-400" />}
                                    onClick={() => handleExecute(task.id)}
                                    className="w-full text-xs justify-center"
                                  >
                                    Execute & Verify
                                  </Button>
                                )}

                                {/* Verified Cryptographic Receipt */}
                                {isVerified && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onNavigateToReceipts}
                                    icon={<ExternalLink className="w-3 h-3 text-emerald-400" />}
                                    className="w-full text-xs justify-center text-emerald-300 hover:text-emerald-200"
                                  >
                                    View Receipt
                                  </Button>
                                )}

                                {/* Move Column Quick Selector: Demonstrates Framer Motion chip glide between columns */}
                                <div className="flex items-center justify-between gap-1 pt-1 text-[10px] text-stone-500">
                                  <span>Move to:</span>
                                  <select
                                    value={task.status}
                                    disabled={isBusy}
                                    onChange={(e) => handleMoveStatus(task.id, e.target.value as TaskStatus)}
                                    className="bg-stone-900 border border-stone-800 text-stone-300 text-[10px] rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-500/40 cursor-pointer"
                                  >
                                    <option value="PLANNED">Planned</option>
                                    <option value="AWAITING_APPROVAL">Awaiting Approval</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="RUNNING">In Progress</option>
                                    <option value="VERIFIED">Verified</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* DETAILED LIST VIEW WITH FRAMER MOTION CHIP TRANSITIONS */
        /* ========================================================================= */
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => {
              const isAwaiting = task.status === 'AWAITING_APPROVAL';
              const isApproved = task.status === 'APPROVED';
              const isVerified = task.status === 'VERIFIED';
              const isBusy = isProcessing === task.id;

              return (
                <motion.div
                  key={task.id}
                  layout
                  layoutId={`task-card-${task.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                >
                  <Card
                    className={`p-4 border transition-all ${
                      isAwaiting ? 'border-amber-500/50 bg-amber-950/10' : 'border-stone-800 bg-stone-900/90'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Task Info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-stone-100">{task.title}</span>
                          <TierBadge tier={task.consequentialityTier} />
                          {/* Framer Motion Animated Status Chip */}
                          <motion.div
                            layout
                            layoutId={`status-chip-${task.id}`}
                            transition={{
                              type: 'spring',
                              stiffness: 450,
                              damping: 28,
                              mass: 0.8,
                            }}
                          >
                            <StatusPill
                              status={task.status}
                              layoutId={`status-pill-inner-${task.id}`}
                            />
                          </motion.div>
                          {task.project && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                              <FolderGit2 className="w-3 h-3 text-amber-500" />
                              <span>{task.project}</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-stone-400 leading-relaxed max-w-2xl">
                          {task.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-stone-500 pt-1">
                          <span>Tool: {task.toolName}</span>
                          <span>Task ID: #{task.id.slice(0, 8)}</span>
                          {task.verifiedAt && (
                            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified at {new Date(task.verifiedAt).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Approval Action for Tier 2 */}
                        {isAwaiting && (
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={isBusy}
                            icon={<Check className="w-3.5 h-3.5" />}
                            onClick={() => handleApprove(task.id)}
                          >
                            Approve Action
                          </Button>
                        )}

                        {/* Execute Action */}
                        {(isApproved || task.consequentialityTier < 2) && !isVerified && (
                          <Button
                            variant="secondary"
                            size="sm"
                            isLoading={isBusy}
                            icon={<Play className="w-3.5 h-3.5 text-amber-400" />}
                            onClick={() => handleExecute(task.id)}
                          >
                            Execute & Verify
                          </Button>
                        )}

                        {/* Verified Receipt Link */}
                        {isVerified && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={onNavigateToReceipts}
                            icon={<ExternalLink className="w-3 h-3 text-emerald-400" />}
                          >
                            View Receipt
                          </Button>
                        )}

                        {/* Column Transition Selector */}
                        <select
                          value={task.status}
                          disabled={isBusy}
                          onChange={(e) => handleMoveStatus(task.id, e.target.value as TaskStatus)}
                          className="bg-stone-900 border border-stone-800 text-stone-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500/40"
                        >
                          <option value="PLANNED">Planned</option>
                          <option value="AWAITING_APPROVAL">Awaiting Approval</option>
                          <option value="APPROVED">Approved</option>
                          <option value="RUNNING">In Progress</option>
                          <option value="VERIFIED">Verified</option>
                        </select>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
