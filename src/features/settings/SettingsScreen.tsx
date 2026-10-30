/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Download,
  Trash2,
  Cpu,
  Moon,
  Sun,
  Key,
  Database,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Badge } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { api } from '../../services/apiClient.ts';
import { UserProfile } from '../../types/domain.ts';

export const SettingsScreen: React.FC<{
  isDarkTheme: boolean;
  onToggleTheme: () => void;
}> = ({ isDarkTheme, onToggleTheme }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.getMe();
        setProfile(res.user);
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    }
    loadProfile();
  }, []);

  const handleExportData = async () => {
    try {
      const [refRes, memRes, insRes, taskRes] = await Promise.all([
        api.getReflections(),
        api.getMemories(),
        api.getInsights(),
        api.getTasks(),
      ]);

      const exportBundle = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        reflections: refRes.items || [],
        memories: memRes.items || [],
        insights: insRes.items || [],
        tasks: taskRes.items || [],
      };

      const blob = new Blob([JSON.stringify(exportBundle, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adora_vault_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const handlePurgeData = () => {
    if (confirmText !== 'PURGE MY VAULT') {
      alert('Confirmation text does not match.');
      return;
    }
    alert('Vault purge initiated. In Phase 2, this executes an atomic Firestore deletion cascade.');
    setIsPurgeModalOpen(false);
    setConfirmText('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-amber-500" />
          <span>Account & System Settings</span>
        </h2>
        <p className="text-xs text-stone-400 mt-1 max-w-xl">
          Manage your personal identity, data sovereignty, inference parameters, and security policies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Identity Profile */}
        <Card className="border-stone-800 bg-stone-900/90 p-5 space-y-4">
          <CardHeader
            title="Account & Identity"
            subtitle="Authenticated profile and session claims"
          />

          <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-950 border border-stone-800">
            <div className="w-12 h-12 rounded-full bg-amber-600/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300">
              RE
            </div>
            <div>
              <div className="font-semibold text-sm text-stone-100">
                {profile?.displayName || 'Reflective Explorer'}
              </div>
              <div className="text-xs text-stone-400 font-mono">
                {profile?.email || 'user@adora.ai'}
              </div>
              <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                UID: {profile?.id || 'usr_adora_local'}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs text-stone-300">
            <span>Visual Theme</span>
            <Button variant="outline" size="sm" onClick={onToggleTheme}>
              {isDarkTheme ? <Sun className="w-3.5 h-3.5 mr-1" /> : <Moon className="w-3.5 h-3.5 mr-1" />}
              {isDarkTheme ? 'Switch to Light' : 'Switch to Dark'}
            </Button>
          </div>
        </Card>

        {/* AI Inference Architecture */}
        <Card className="border-stone-800 bg-stone-900/90 p-5 space-y-4">
          <CardHeader
            title="Inference Engine Configuration"
            subtitle="Transparent model selection and server credentials"
          />

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-stone-400">Primary Reasoner:</span>
                <span className="text-amber-400 font-semibold">NVIDIA Nemotron</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-stone-400">Inference Factory:</span>
                <span className="text-stone-200">Nebius Token Factory</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-stone-400">Secret Security:</span>
                <span className="text-emerald-400 font-medium">NEBIUS_API_KEY (Server Secret)</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed">
              Adora routes core reflection analysis, entity extraction, pattern discovery, and workflow
              planning strictly to NVIDIA Nemotron. No client secrets are ever transmitted to the browser.
            </p>
          </div>
        </Card>

        {/* Data Sovereignty & Export */}
        <Card className="border-stone-800 bg-stone-900/90 p-5 space-y-4">
          <CardHeader
            title="Data Sovereignty & Vault Export"
            subtitle="Full data ownership and portable archives"
          />

          <p className="text-xs text-stone-400 leading-relaxed">
            Download an exhaustive, unencrypted JSON archive containing all your raw reflections,
            episodic entries, procedural memories, confirmed patterns, and task execution history.
          </p>

          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportData}
          >
            Export Complete Vault Archive
          </Button>
        </Card>

        {/* Danger Zone: Account Purge */}
        <Card className="border-rose-900/40 bg-rose-950/10 p-5 space-y-4">
          <CardHeader
            title="Danger Zone: Permanent Purge"
            subtitle="Irreversible erasure of all memories and graph nodes"
          />

          <p className="text-xs text-stone-400 leading-relaxed">
            Permanently erase all stored reflections, memory vault entries, Reflection Grove nodes,
            and execution receipts. This operation cannot be undone.
          </p>

          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setIsPurgeModalOpen(true)}
          >
            Purge All Data
          </Button>
        </Card>
      </div>

      {/* Purge Confirmation Modal */}
      {isPurgeModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsPurgeModalOpen(false)}
          title="Confirm Irreversible Data Purge"
          description="Type 'PURGE MY VAULT' to confirm cryptographic deletion."
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>All reflections, memories, and receipts will be permanently erased.</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Confirmation</label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="PURGE MY VAULT"
                className="w-full rounded-lg bg-stone-950 border border-stone-800 p-2.5 text-xs text-stone-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
              <Button variant="ghost" size="sm" onClick={() => setIsPurgeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={confirmText !== 'PURGE MY VAULT'}
                onClick={handlePurgeData}
              >
                Permanently Delete Everything
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
