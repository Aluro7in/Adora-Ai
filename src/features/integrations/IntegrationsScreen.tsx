/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Blocks,
  Calendar,
  Mail,
  HardDrive,
  Table,
  Globe,
  CheckCircle2,
  XCircle,
  Shield,
  Key,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Badge } from '../../components/common/Badge.tsx';
import { api } from '../../services/apiClient.ts';
import { Integration } from '../../types/domain.ts';

export const IntegrationsScreen: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    try {
      const res = await api.getIntegrations();
      setIntegrations(res.items || []);
    } catch (err) {
      console.error('Failed to load integrations', err);
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google_calendar':
        return <Calendar className="w-5 h-5 text-blue-400" />;
      case 'gmail':
        return <Mail className="w-5 h-5 text-rose-400" />;
      case 'google_drive':
        return <HardDrive className="w-5 h-5 text-amber-400" />;
      case 'google_sheets':
        return <Table className="w-5 h-5 text-emerald-400" />;
      default:
        return <Globe className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
          <Blocks className="w-5 h-5 text-amber-500" />
          <span>MCP Tools & Integrations</span>
        </h2>
        <p className="text-xs text-stone-400 mt-1 max-w-xl">
          Connect external services under strict Model Context Protocol (MCP) contracts. An integration
          never shows as connected without verified OAuth token authorization.
        </p>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item) => {
          const isConnected = item.status === 'connected';

          return (
            <Card key={item.id} className="border-stone-800 bg-stone-900/90 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-800/80 border border-stone-700/60 flex items-center justify-center">
                    {getProviderIcon(item.provider)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-stone-100">{item.name}</h3>
                    <div className="text-[11px] text-stone-500 font-mono">
                      Provider: {item.provider}
                    </div>
                  </div>
                </div>

                <Badge variant={isConnected ? 'emerald' : 'stone'} size="sm">
                  {isConnected ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>

              <p className="text-xs text-stone-400 leading-relaxed">{item.description}</p>

              {/* Scopes */}
              <div>
                <div className="text-[10px] font-mono uppercase text-stone-500 mb-1.5 flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  <span>Configured Permissions / Scopes</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.authorizedScopes.map((scope) => (
                    <span
                      key={scope}
                      className="text-[10px] font-mono bg-stone-950 border border-stone-800 text-stone-400 px-2 py-0.5 rounded truncate max-w-xs"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                <span className="text-[11px] text-stone-500">
                  {isConnected ? 'Active & Healthy' : 'Requires User Consent Flow'}
                </span>

                <Button
                  variant={isConnected ? 'outline' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    alert(
                      `${item.name} connection authorization will be initiated in Phase 7 via official OAuth flow.`
                    );
                  }}
                >
                  {isConnected ? 'Configure Scopes' : 'Connect via OAuth'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
