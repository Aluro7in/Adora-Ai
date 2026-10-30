/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TaskStatus, ConsequentialityTier } from '../../types/domain.ts';

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'amber' | 'emerald' | 'blue' | 'purple' | 'stone' | 'rose';
  size?: 'sm' | 'md';
  className?: string;
}> = ({ children, variant = 'stone', size = 'sm', className = '' }) => {
  const variantStyles = {
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    blue: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    stone: 'bg-stone-800 text-stone-300 border-stone-700',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 tracking-wide uppercase font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusPill: React.FC<{
  status: TaskStatus;
  layoutId?: string;
  className?: string;
}> = ({ status, layoutId, className = '' }) => {
  const config: Record<
    TaskStatus,
    { label: string; bg: string; text: string; dot: string; border: string }
  > = {
    PLANNED: {
      label: 'Planned',
      bg: 'bg-stone-800/80',
      text: 'text-stone-400',
      dot: 'bg-stone-500',
      border: 'border-stone-700',
    },
    AWAITING_APPROVAL: {
      label: 'Awaiting Approval',
      bg: 'bg-amber-500/15',
      text: 'text-amber-300 font-semibold',
      dot: 'bg-amber-400 animate-pulse',
      border: 'border-amber-500/40',
    },
    APPROVED: {
      label: 'Approved',
      bg: 'bg-blue-500/15',
      text: 'text-blue-300',
      dot: 'bg-blue-400',
      border: 'border-blue-500/40',
    },
    RUNNING: {
      label: 'Running...',
      bg: 'bg-cyan-500/15',
      text: 'text-cyan-300',
      dot: 'bg-cyan-400 animate-ping',
      border: 'border-cyan-500/40',
    },
    EXECUTED: {
      label: 'Executed',
      bg: 'bg-indigo-500/15',
      text: 'text-indigo-300',
      dot: 'bg-indigo-400',
      border: 'border-indigo-500/40',
    },
    VERIFIED: {
      label: 'Verified',
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-300 font-semibold',
      dot: 'bg-emerald-400',
      border: 'border-emerald-500/40',
    },
    UNVERIFIED: {
      label: 'Unverified',
      bg: 'bg-orange-500/15',
      text: 'text-orange-300',
      dot: 'bg-orange-400',
      border: 'border-orange-500/40',
    },
    FAILED: {
      label: 'Failed',
      bg: 'bg-rose-500/15',
      text: 'text-rose-300',
      dot: 'bg-rose-400',
      border: 'border-rose-500/40',
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-stone-900',
      text: 'text-stone-500',
      dot: 'bg-stone-600',
      border: 'border-stone-800',
    },
  };

  const item = config[status] || config.PLANNED;

  return (
    <motion.span
      layout
      layoutId={layoutId}
      transition={{
        type: 'spring',
        stiffness: 450,
        damping: 30,
        mass: 0.8,
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${item.bg} ${item.text} ${item.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      <span>{item.label}</span>
    </motion.span>
  );
};

export const TierBadge: React.FC<{ tier: ConsequentialityTier }> = ({ tier }) => {
  if (tier === 2) {
    return (
      <Badge variant="rose" size="sm">
        Tier 2 • Consequential (Gate Required)
      </Badge>
    );
  }
  if (tier === 1) {
    return (
      <Badge variant="amber" size="sm">
        Tier 1 • Reversible Mutation
      </Badge>
    );
  }
  return (
    <Badge variant="stone" size="sm">
      Tier 0 • Safe Read-Only
    </Badge>
  );
};

export const ProvenanceChip: React.FC<{
  type: 'verbatim' | 'hypothesis' | 'approved_fact' | 'verified_action';
  sourceId?: string;
  className?: string;
}> = ({ type, sourceId, className = '' }) => {
  const styles = {
    verbatim: {
      label: 'User Verbatim',
      color: 'bg-cyan-950/50 text-cyan-300 border-cyan-800/60',
    },
    hypothesis: {
      label: 'AI Inferred Hypothesis',
      color: 'bg-purple-950/50 text-purple-300 border-purple-800/60',
    },
    approved_fact: {
      label: 'User-Approved Fact',
      color: 'bg-amber-950/50 text-amber-300 border-amber-800/60',
    },
    verified_action: {
      label: 'Independently Verified',
      color: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60',
    },
  };

  const s = styles[type];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${s.color} ${className}`}
      title={sourceId ? `Source ID: ${sourceId}` : undefined}
    >
      <span>●</span>
      <span>{s.label}</span>
      {sourceId && <span className="opacity-60 text-[9px]">#{sourceId.slice(0, 6)}</span>}
    </span>
  );
};
