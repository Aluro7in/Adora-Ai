/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, description, action, className = '' }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-stone-800 rounded-xl bg-stone-900/30 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-stone-800/80 border border-stone-700/60 flex items-center justify-center text-stone-400 mb-3.5 shadow-inner">
        {icon}
      </div>
      <h4 className="text-sm font-medium text-stone-200 mb-1">{title}</h4>
      <p className="text-xs text-stone-400 max-w-sm mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
