/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}> = ({ children, className = '', onClick, hoverable = false }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-stone-900/90 border border-stone-800/80 rounded-xl p-5 shadow-sm shadow-black/40 backdrop-blur-sm transition-all duration-200 ${
        hoverable ? 'hover:border-stone-700 hover:bg-stone-800/60 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-stone-100 tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
