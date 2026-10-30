/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-semibold shadow-sm shadow-amber-900/20 active:translate-y-px',
    secondary:
      'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700/60 active:translate-y-px',
    outline:
      'bg-transparent hover:bg-stone-800/60 text-stone-300 border border-stone-700 active:translate-y-px',
    ghost:
      'bg-transparent hover:bg-stone-800/40 text-stone-400 hover:text-stone-200 active:translate-y-px',
    danger:
      'bg-rose-900/40 hover:bg-rose-900/70 text-rose-300 border border-rose-800/50 active:translate-y-px',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};
