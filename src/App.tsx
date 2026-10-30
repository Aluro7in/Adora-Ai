/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shell, NavModule } from './components/layout/Shell.tsx';
import { HomeScreen } from './features/home/HomeScreen.tsx';
import { ReflectScreen } from './features/reflect/ReflectScreen.tsx';
import { ChatScreen } from './features/chat/ChatScreen.tsx';
import { MemoryVaultScreen } from './features/memory/MemoryVaultScreen.tsx';
import { InsightsScreen } from './features/insights/InsightsScreen.tsx';
import { ReflectionGroveScreen } from './features/grove/ReflectionGroveScreen.tsx';
import { WorkflowsScreen } from './features/workflows/WorkflowsScreen.tsx';
import { TasksScreen } from './features/tasks/TasksScreen.tsx';
import { ExecutionHistoryScreen } from './features/execution/ExecutionHistoryScreen.tsx';
import { IntegrationsScreen } from './features/integrations/IntegrationsScreen.tsx';
import { SettingsScreen } from './features/settings/SettingsScreen.tsx';
import { Modal } from './components/common/Modal.tsx';
import { Button } from './components/common/Button.tsx';
import { api } from './services/apiClient.ts';

export default function App() {
  const [currentModule, setCurrentModule] = useState<NavModule>('home');
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isQuickReflectOpen, setIsQuickReflectOpen] = useState(false);
  const [quickText, setQuickText] = useState('');
  const [quickCategory, setQuickCategory] = useState<'personal' | 'professional' | 'strategic'>('professional');
  const [isSavingQuick, setIsSavingQuick] = useState(false);

  useEffect(() => {
    // Apply dark class on html document root
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkTheme]);

  const handleSaveQuickReflect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim()) return;

    try {
      setIsSavingQuick(true);
      await api.createReflection({
        rawText: quickText.trim(),
        category: quickCategory,
        tags: ['quick_capture'],
      });
      setIsQuickReflectOpen(false);
      setQuickText('');
      setCurrentModule('reflect');
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSavingQuick(false);
    }
  };

  const renderModuleView = () => {
    switch (currentModule) {
      case 'home':
        return (
          <HomeScreen
            onNavigate={(mod) => setCurrentModule(mod)}
            onOpenReflectModal={() => setIsQuickReflectOpen(true)}
          />
        );
      case 'reflect':
        return <ReflectScreen />;
      case 'chat':
        return <ChatScreen />;
      case 'vault':
        return <MemoryVaultScreen />;
      case 'insights':
        return <InsightsScreen />;
      case 'grove':
        return <ReflectionGroveScreen />;
      case 'workflows':
        return <WorkflowsScreen onNavigateToTasks={() => setCurrentModule('tasks')} />;
      case 'tasks':
        return <TasksScreen onNavigateToReceipts={() => setCurrentModule('receipts')} />;
      case 'receipts':
        return <ExecutionHistoryScreen />;
      case 'integrations':
        return <IntegrationsScreen />;
      case 'settings':
        return (
          <SettingsScreen
            isDarkTheme={isDarkTheme}
            onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
          />
        );
      default:
        return (
          <HomeScreen
            onNavigate={(mod) => setCurrentModule(mod)}
            onOpenReflectModal={() => setIsQuickReflectOpen(true)}
          />
        );
    }
  };

  return (
    <Shell
      currentModule={currentModule}
      onSelectModule={(mod) => setCurrentModule(mod)}
      isDarkTheme={isDarkTheme}
      onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
      onOpenQuickReflect={() => setIsQuickReflectOpen(true)}
    >
      {renderModuleView()}

      {/* Quick Reflect Modal accessible globally */}
      <Modal
        isOpen={isQuickReflectOpen}
        onClose={() => setIsQuickReflectOpen(false)}
        title="Quick Reflection Capture"
        description="Jot down a fleeting thought, decision, or friction point."
      >
        <form onSubmit={handleSaveQuickReflect} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5">Category</label>
            <div className="flex gap-2">
              {(['professional', 'personal', 'strategic'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setQuickCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize border transition-all cursor-pointer ${
                    quickCategory === cat
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5">Reflection</label>
            <textarea
              required
              rows={4}
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              placeholder="What did you learn or decide just now?"
              className="w-full rounded-xl bg-stone-950 border border-stone-800 p-3 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsQuickReflectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingQuick}
              disabled={!quickText.trim()}
            >
              Save & Open Reflect View
            </Button>
          </div>
        </form>
      </Modal>
    </Shell>
  );
}
