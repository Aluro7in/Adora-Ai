/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Sparkles, CheckCircle2, X, Lightbulb } from 'lucide-react';

export interface ToastProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  summary: string;
  category?: string;
  tags?: string[];
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  isOpen,
  onClose,
  title = 'Reflection Captured',
  summary,
  category,
  tags = [],
  duration = 8000,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-5 right-5 sm:right-6 z-50 max-w-md w-[calc(100vw-2.5rem)] sm:w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="rounded-2xl bg-stone-900/95 dark:bg-stone-900/95 border border-amber-500/40 shadow-xl shadow-amber-950/20 backdrop-blur-md p-4 text-stone-100 overflow-hidden relative group">
        {/* Top ambient highlight */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        <div className="flex items-start gap-3">
          {/* Icon Badge */}
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold tracking-wide text-stone-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{title}</span>
              </span>
              <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full">
                Gemini Takeaway
              </span>
            </div>

            {/* Core Takeaway 1-Sentence Summary */}
            <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/80 my-1.5">
              <p className="text-xs text-stone-200 font-medium leading-relaxed italic flex items-start gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>"{summary}"</span>
              </p>
            </div>

            {/* Attached Tags (if any) */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono text-stone-400 bg-stone-800/70 border border-stone-700/60 px-1.5 py-0.5 rounded"
                  >
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
