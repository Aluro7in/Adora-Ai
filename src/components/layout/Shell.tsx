/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  PenTool,
  MessageSquareQuote,
  Vault,
  Sparkles,
  GitFork,
  Workflow,
  CheckSquare,
  Receipt,
  Blocks,
  Settings,
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  Cpu,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { Button } from '../common/Button.tsx';

export type NavModule =
  | 'home'
  | 'reflect'
  | 'chat'
  | 'vault'
  | 'insights'
  | 'grove'
  | 'workflows'
  | 'tasks'
  | 'receipts'
  | 'integrations'
  | 'settings';

interface ShellProps {
  currentModule: NavModule;
  onSelectModule: (module: NavModule) => void;
  children: React.ReactNode;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  onOpenQuickReflect: () => void;
}

export const Shell: React.FC<ShellProps> = ({
  currentModule,
  onSelectModule,
  children,
  isDarkTheme,
  onToggleTheme,
  onOpenQuickReflect,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navItems: Array<{
    id: NavModule;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'reflect', label: 'Reflect', icon: PenTool },
    { id: 'chat', label: 'Adora Chat', icon: MessageSquareQuote },
    { id: 'vault', label: 'Memory Vault', icon: Vault },
    { id: 'insights', label: 'Insights', icon: Sparkles },
    { id: 'grove', label: 'Reflection Grove', icon: GitFork },
    { id: 'workflows', label: 'Workflows', icon: Workflow },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'receipts', label: 'Execution History', icon: Receipt },
    { id: 'integrations', label: 'Integrations', icon: Blocks },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col md:flex-row antialiased selection:bg-amber-500/30 selection:text-amber-200">
      {/* ========================================================= */}
      {/* DESKTOP SIDEBAR */}
      {/* ========================================================= */}
      <aside className="hidden md:flex flex-col w-64 border-r border-stone-800/80 bg-stone-950/90 backdrop-blur-md sticky top-0 h-screen shrink-0 z-30">
        {/* Brand Header */}
        <div className="p-5 border-b border-stone-800/80 flex items-center justify-between">
          <div
            onClick={() => onSelectModule('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 flex items-center justify-center text-stone-950 font-bold text-lg shadow-md shadow-amber-900/30 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-stone-100 flex items-center gap-1.5">
                <span>Adora AI</span>
                <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 rounded">
                  v1.0
                </span>
              </div>
              <div className="text-[10.5px] text-stone-400 font-mono tracking-tight">
                Reflective Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="px-4 pt-4 pb-2">
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center shadow-md shadow-amber-950/40"
            icon={<Plus className="w-4 h-4" />}
            onClick={onOpenQuickReflect}
          >
            New Reflection
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-800">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-300 px-3 py-1">
            Core Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer group ${
                  isActive
                    ? 'bg-amber-600/15 text-amber-300 border border-amber-500/30 shadow-xs'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-amber-400' : 'text-stone-300 group-hover:text-stone-100'
                  }`}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.2 rounded-full font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Inference Health & Model Card */}
        <div className="p-3 border-t border-stone-800/80 bg-stone-900/40">
          <div className="p-2.5 rounded-lg border border-stone-800 bg-stone-900/80">
            <div className="flex items-center gap-2 mb-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] font-medium text-stone-200 truncate">
                NVIDIA Nemotron
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto shrink-0 animate-pulse" />
            </div>
            <div className="text-[10px] text-stone-300 font-mono flex items-center justify-between">
              <span>Nebius Token Factory</span>
              <span className="text-emerald-400 font-medium">Ready</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MOBILE TOP BAR */}
      {/* ========================================================= */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-stone-950 font-bold">
            <Compass className="w-4 h-4 text-stone-950" />
          </div>
          <span className="font-semibold text-sm text-stone-100">Adora AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={onOpenQuickReflect}
          >
            Reflect
          </Button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-stone-900 text-stone-300 border border-stone-800"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-15.5 bottom-0 bg-stone-950/95 backdrop-blur-lg z-30 p-4 overflow-y-auto border-b border-stone-800">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectModule(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium border text-left ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-stone-900/60 text-stone-300 border-stone-800'
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-stone-800/80 bg-stone-950/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold tracking-tight text-stone-100 capitalize flex items-center gap-2">
              <span className="text-stone-300 font-normal">Adora /</span>
              <span>{navItems.find((n) => n.id === currentModule)?.label || currentModule}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 text-xs text-stone-300 bg-stone-900 hover:bg-stone-800/80 border border-stone-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-stone-300" />
              <span className="hidden sm:inline">Search vault & memories</span>
              <kbd className="hidden sm:inline text-[10px] bg-stone-800 border border-stone-700 px-1 py-0.5 rounded text-stone-300 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Notifications Trigger */}
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-900 border border-transparent hover:border-stone-800 transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1.5 right-1.5 ring-2 ring-stone-950" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-stone-500 hover:text-amber-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-amber-400 dark:hover:bg-stone-900 border border-transparent hover:border-stone-300 dark:hover:border-stone-800 transition-colors cursor-pointer"
              title={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkTheme ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-700" />}
            </button>

            {/* User Profile Pill */}
            <div
              onClick={() => onSelectModule('settings')}
              className="flex items-center gap-2 pl-2 border-l border-stone-800 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-full bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-xs font-semibold text-amber-200 group-hover:border-amber-400 transition-colors">
                RE
              </div>
              <span className="hidden lg:inline text-xs font-medium text-stone-300 group-hover:text-stone-100">
                Reflective User
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* ========================================================= */}
      {/* QUICK SEARCH MODAL */}
      {/* ========================================================= */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-stone-800 flex items-center gap-3">
              <Search className="w-4 h-4 text-stone-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search reflections, memories, insights, tasks..."
                className="w-full bg-transparent text-sm text-stone-100 placeholder-stone-500 focus:outline-none"
              />
              <kbd className="text-[10px] bg-stone-800 border border-stone-700 px-1.5 py-0.5 rounded text-stone-400 font-mono">
                ESC
              </kbd>
            </div>
            <div className="p-4 text-xs text-stone-500 text-center">
              Type to execute hybrid semantic search across your personal memory vault.
            </div>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {notificationsOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
          onClick={() => setNotificationsOpen(false)}
        >
          <div
            className="w-full max-w-sm h-full bg-stone-900 border-l border-stone-800 p-5 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <h3 className="text-sm font-semibold text-stone-100">Notifications & Alerts</h3>
              <button
                onClick={() => setNotificationsOpen(false)}
                className="p-1 rounded text-stone-400 hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 py-6 flex flex-col items-center justify-center text-center text-xs text-stone-500">
              <Bell className="w-8 h-8 text-stone-700 mb-2" />
              <p>No new notifications.</p>
              <p className="text-[11px] text-stone-600 mt-1">
                Consequential approvals and action verifications will alert here.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
