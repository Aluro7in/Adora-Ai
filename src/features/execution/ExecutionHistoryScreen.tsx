/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Hash,
  ExternalLink,
  Code2,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Badge, ProvenanceChip } from '../../components/common/Badge.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { api } from '../../services/apiClient.ts';
import { ExecutionReceipt } from '../../types/domain.ts';

export const ExecutionHistoryScreen: React.FC = () => {
  const [receipts, setReceipts] = useState<ExecutionReceipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ExecutionReceipt | null>(null);

  useEffect(() => {
    loadReceipts();
  }, []);

  async function loadReceipts() {
    try {
      const res = await api.getReceipts();
      setReceipts(res.items || []);
    } catch (err) {
      console.error('Failed to load receipts', err);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-amber-500" />
          <span>Execution History & Receipts</span>
        </h2>
        <p className="text-xs text-stone-400 mt-1 max-w-xl">
          Tamper-evident audit ledger. Every executed tool call produces a cryptographic receipt
          anchoring input parameters, external responses, and independent postcondition proofs.
        </p>
      </div>

      {/* Receipts List */}
      {receipts.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-6 h-6 text-stone-400" />}
          title="No execution receipts minted yet"
          description="When tasks execute and undergo independent verification, cryptographic receipts with SHA-256 digests appear here."
        />
      ) : (
        <div className="space-y-4">
          {receipts.map((rcpt) => (
            <Card
              key={rcpt.id}
              hoverable
              onClick={() => setSelectedReceipt(rcpt)}
              className="border-stone-800 bg-stone-900/90 p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-stone-100">
                      Receipt #{rcpt.id} • Tool: {rcpt.toolName}
                    </h3>
                    <div className="text-[10px] text-stone-500 font-mono">
                      Task Reference #{rcpt.taskId} • Workflow #{rcpt.workflowId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="emerald" size="sm">
                    {rcpt.verificationStatus}
                  </Badge>
                  <ProvenanceChip type="verified_action" />
                </div>
              </div>

              {/* SHA-256 Hashes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-stone-950 border border-stone-800/80">
                  <div className="text-[10px] text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-stone-400" />
                    <span>Canonical Input Digest (SHA-256)</span>
                  </div>
                  <div className="text-stone-300 truncate font-semibold">{rcpt.inputPayloadHash}</div>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-950 border border-stone-800/80">
                  <div className="text-[10px] text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-stone-400" />
                    <span>Execution Output Digest (SHA-256)</span>
                  </div>
                  <div className="text-stone-300 truncate font-semibold">{rcpt.outputPayloadHash}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] font-mono text-stone-500 border-t border-stone-800/60">
                <span>Verification Method: {rcpt.verificationDetails?.verificationMethod}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(rcpt.timestamp).toLocaleString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Receipt JSON Inspector Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReceipt(null)}
          title={`Execution Receipt #${selectedReceipt.id}`}
          description="Cryptographic proof and payload inspection"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 font-mono text-[11px] text-stone-300 overflow-x-auto max-h-96">
              <pre>{JSON.stringify(selectedReceipt, null, 2)}</pre>
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedReceipt(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
