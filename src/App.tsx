/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { analyzeSentiment } from './utils/sentiment.ts';
import { Mic, MicOff, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentModule, setCurrentModule] = useState<NavModule>('home');
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isQuickReflectOpen, setIsQuickReflectOpen] = useState(false);
  const [quickText, setQuickText] = useState('');
  const [quickCategory, setQuickCategory] = useState<'personal' | 'professional' | 'strategic'>('professional');
  const [isSavingQuick, setIsSavingQuick] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Voice recording state in Quick Reflect Modal
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    // Apply dark class on html document root
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkTheme]);

  // Cleanup on modal close or unmount
  useEffect(() => {
    if (!isQuickReflectOpen) {
      stopVoiceRecording();
      setVoiceError(null);
      setSaveError(null);
    }
  }, [isQuickReflectOpen]);

  // Sentiment analysis of quickText
  const sentiment = analyzeSentiment(quickText);

  // Voice-to-Text handler
  const startVoiceRecording = async () => {
    setVoiceError(null);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 1. Web Speech API live recognition if available
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let transcriptText = '';
            for (let i = 0; i < event.results.length; i++) {
              transcriptText += event.results[i][0].transcript;
            }
            if (transcriptText.trim()) {
              setQuickText(transcriptText.trim());
            }
          };

          recognition.onerror = (e: any) => {
            console.warn('SpeechRecognition notice:', e.error);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn('SpeechRecognition start failed, relying on audio capture fallback:', e);
        }
      }

      // 2. MediaRecorder fallback / backup recording
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        // If SpeechRecognition didn't populate text, use backend gemini-3.5-transcribe
        if (audioBlob.size > 0 && !quickText.trim()) {
          setIsTranscribingVoice(true);
          try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              const resultStr = reader.result as string;
              const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
              if (base64Data) {
                const res = await api.transcribeAudio(base64Data, audioBlob.type);
                if (res.transcript) {
                  setQuickText((prev) => (prev ? `${prev} ${res.transcript}` : res.transcript));
                }
              }
              setIsTranscribingVoice(false);
            };
          } catch (err: any) {
            console.error('Audio transcription error:', err);
            setVoiceError(`Transcription error: ${err.message}`);
            setIsTranscribingVoice(false);
          }
        }
      };

      recorder.start();
      setIsRecordingVoice(true);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setVoiceError(
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access in browser settings.'
          : `Microphone error: ${err.message}`
      );
    }
  };

  const stopVoiceRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setIsRecordingVoice(false);
  };

  const handleToggleVoice = () => {
    if (isRecordingVoice) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  const handleSaveQuickReflect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim() || isSavingQuick) return;

    if (isRecordingVoice) {
      stopVoiceRecording();
    }

    try {
      setIsSavingQuick(true);
      setSaveError(null);
      await api.createReflection({
        rawText: quickText.trim(),
        category: quickCategory,
        tags: ['quick_capture', sentiment.sentiment],
      });
      setIsQuickReflectOpen(false);
      setQuickText('');
      setCurrentModule('reflect');
    } catch (err: any) {
      setSaveError(`Save failed: ${err.message}`);
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

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
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
        description="Jot down or speak a fleeting thought, decision, or friction point."
      >
        <form onSubmit={handleSaveQuickReflect} className="space-y-4">
          {saveError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {voiceError && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{voiceError}</span>
            </div>
          )}

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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-stone-300">Reflection</label>

              {/* Dynamic Sentiment Emoji Indicator */}
              {quickText.trim().length > 0 && (
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all animate-in fade-in duration-200 ${sentiment.colorClass}`}
                  title={`Sentiment Analysis: ${sentiment.label} (Score: ${sentiment.score})`}
                >
                  <span>{sentiment.emoji}</span>
                  <span className="font-sans">{sentiment.label}</span>
                </div>
              )}
            </div>

            <div className="relative">
              <textarea
                required
                rows={4}
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                placeholder={
                  isRecordingVoice
                    ? 'Listening... speak your reflection clearly.'
                    : 'What did you learn or decide just now? (Type or tap mic to speak)'
                }
                className={`w-full rounded-xl bg-stone-950 border p-3 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none transition-all resize-none ${
                  isRecordingVoice
                    ? 'border-amber-500/70 ring-1 ring-amber-500/30'
                    : 'border-stone-800 focus:border-amber-500/50'
                }`}
              />

              {/* Voice-to-Text Toggle Button Inside Modal */}
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                {isRecordingVoice && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 bg-stone-900/90 border border-amber-500/40 px-2 py-0.5 rounded-md shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>{formatTimer(recordingSeconds)}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleToggleVoice}
                  disabled={isTranscribingVoice}
                  className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                    isRecordingVoice
                      ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-900/40 animate-pulse'
                      : isTranscribingVoice
                      ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                      : 'bg-stone-900 text-stone-400 hover:text-amber-400 border-stone-800 hover:border-amber-500/50'
                  }`}
                  title={isRecordingVoice ? 'Stop Speaking' : 'Speak Reflection (Voice-to-Text)'}
                >
                  {isTranscribingVoice ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  ) : isRecordingVoice ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Helper status text under reflection input */}
            <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
              <span>
                {isRecordingVoice
                  ? 'Microphone active — speak naturally to transcribe.'
                  : isTranscribingVoice
                  ? 'Transcribing audio with Gemini 3.5 Transcribe...'
                  : 'Tap the mic icon to record by voice.'}
              </span>
              <span>{quickText.trim().length} chars</span>
            </div>
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
              isLoading={isSavingQuick || isTranscribingVoice}
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
