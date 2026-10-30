/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MessageSquareQuote,
  Send,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  BookOpen,
  Brain,
  Cpu,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../components/common/Card.tsx';
import { Button } from '../../components/common/Button.tsx';
import { ProvenanceChip } from '../../components/common/Badge.tsx';
import { api } from '../../services/apiClient.ts';
import { ChatMessage, ChatCitation } from '../../types/domain.ts';

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content:
        'Hello. I am Adora. I assist your reflection by retrieving context from your personal Memory Vault, recognizing patterns across past decisions, and helping you formulate verified action plans. What experience or decision would you like to unpack today?',
      timestamp: new Date().toISOString(),
      model: 'NVIDIA Nemotron 3.5 Lightning (Nebius)',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useHighThinking, setUseHighThinking] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<ChatCitation | null>(null);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await api.sendChatMessage({
        message: userMessage.content,
        useHighThinking,
      });

      const assistantMessage: ChatMessage = {
        id: `msg_res_${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toISOString(),
        citations: res.citations,
        model: useHighThinking ? 'gemini-4-argon (High Thinking)' : res.model,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'system',
        content: `Error: ${err.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-4 animate-in fade-in duration-200">
      {/* Top Banner: Engine Status & High Thinking Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-stone-800 bg-stone-900/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-stone-200">
            {useHighThinking ? 'Gemini 4 Argon (High Thinking Active)' : 'NVIDIA Nemotron 3.5 Lightning (Nebius)'}
          </span>
          <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
            Grounded
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useHighThinking}
              onChange={(e) => setUseHighThinking(e.target.checked)}
              className="rounded bg-stone-950 border-stone-700 text-amber-500 focus:ring-amber-500/30 cursor-pointer"
            />
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>High-Thinking Mode</span>
            </span>
          </label>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-stone-800">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isSystem = msg.role === 'system';

          if (isSystem) {
            return (
              <div
                key={msg.id}
                className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2 max-w-xl mx-auto"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{msg.content}</span>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                    : 'bg-stone-800 text-stone-200 border border-stone-700'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-amber-400" />}
              </div>

              <div className="space-y-2 max-w-2xl">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-amber-600/20 text-stone-100 border border-amber-500/30 rounded-tr-none'
                      : 'bg-stone-900/90 text-stone-200 border border-stone-800 rounded-tl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Grounding Citations */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="space-y-1.5 pt-1 pl-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-stone-300 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-amber-400" />
                      <span>Retrieved Evidence Grounding ({msg.citations.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((cite) => (
                        <button
                          key={cite.id}
                          onClick={() => setSelectedCitation(cite)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-950 border border-amber-500/30 hover:border-amber-400 text-[11px] text-amber-300 transition-colors cursor-pointer group"
                        >
                          <span className="font-semibold">{cite.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-stone-300 group-hover:text-amber-200" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center text-xs font-bold text-stone-200 border border-stone-700">
              <Bot className="w-4 h-4 text-amber-400" />
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 rounded-tl-none text-xs text-stone-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Retrieving memory context and reasoning with Nemotron...</span>
            </div>
          </div>
        )}
      </div>

      {/* Message Composer */}
      <form onSubmit={handleSendMessage} className="pt-2 shrink-0">
        <div className="relative flex items-center rounded-2xl border border-stone-800 bg-stone-900/90 shadow-lg focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/30">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about past reflections, decisions, or ask for guidance..."
            className="flex-1 bg-transparent px-4 py-3 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none"
          />
          <div className="pr-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Send className="w-3.5 h-3.5" />}
              disabled={!inputText.trim() || isLoading}
            >
              Send
            </Button>
          </div>
        </div>
      </form>

      {/* Citation Inspector Modal */}
      {selectedCitation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedCitation(null)}
        >
          <div
            className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-3">
              <h3 className="text-sm font-semibold text-stone-100">{selectedCitation.title}</h3>
              <ProvenanceChip type="approved_fact" />
            </div>
            <p className="text-xs text-stone-300 leading-relaxed italic mb-4 p-3 rounded-lg bg-stone-950 border border-stone-800/80">
              "{selectedCitation.quote}"
            </p>
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedCitation(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
