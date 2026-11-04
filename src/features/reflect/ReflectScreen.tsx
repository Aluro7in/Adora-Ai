/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  PenTool,
  Mic,
  MicOff,
  Sparkles,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Check,
  ChevronRight,
  Send,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Badge, ProvenanceChip } from '../../components/common/Badge.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { api } from '../../services/apiClient.ts';
import { Reflection, ReflectionCategory } from '../../types/domain.ts';

export const ReflectScreen: React.FC<{
  onShowToast?: (summary: string, tags?: string[]) => void;
}> = ({ onShowToast }) => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ReflectionCategory>('professional');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [rawText, setRawText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [moodRating, setMoodRating] = useState<number>(4);
  const [energyRating, setEnergyRating] = useState<number>(3);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAnalysisRef, setActiveAnalysisRef] = useState<Reflection | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const categories: ReflectionCategory[] = [
    'personal',
    'professional',
    'strategic',
    'creative',
    'wellbeing',
  ];

  useEffect(() => {
    loadReflections();
  }, [filterCategory]);

  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const startVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatusMessage('Microphone access is not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        if (audioBlob.size > 0) {
          setIsTranscribing(true);
          try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              const resultStr = reader.result as string;
              const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
              if (base64Data) {
                const res = await api.transcribeAudio(base64Data, audioBlob.type);
                if (res.transcript) {
                  setRawText((prev) => (prev ? `${prev}\n\n${res.transcript}` : res.transcript));
                  setStatusMessage('Voice reflection transcribed verbatim by gemini-3.5-transcribe.');
                }
              }
              setIsTranscribing(false);
            };
          } catch (err: any) {
            console.error('Transcription failed:', err);
            setStatusMessage(`Transcription failed: ${err.message}`);
            setIsTranscribing(false);
          }
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setStatusMessage(`Could not start microphone: ${err.message}`);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  async function loadReflections() {
    try {
      const res = await api.getReflections(filterCategory === 'all' ? undefined : filterCategory);
      setReflections(res.items || []);
    } catch (err) {
      console.error('Failed to load reflections', err);
    }
  }

  const handleSaveReflection = async () => {
    if (!rawText.trim()) return;
    try {
      setIsSubmitting(true);
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await api.createReflection({
        rawText: rawText.trim(),
        category: selectedCategory,
        tags: parsedTags,
        moodRating,
        energyRating,
        sourceType: isRecording ? 'voice_transcript' : 'text',
      });

      setStatusMessage('Reflection captured successfully.');
      setRawText('');
      setTagsInput('');
      setIsRecording(false);
      await loadReflections();

      // Show Gemini 1-sentence core takeaway toast
      if (res.summary && onShowToast) {
        onShowToast(res.summary, parsedTags);
      }

      // Trigger automatic Nemotron entity extraction
      if (res.reflection) {
        handleTriggerExtraction(res.reflection);
      }
    } catch (err: any) {
      setStatusMessage(`Error saving reflection: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleTriggerExtraction = async (reflection: Reflection) => {
    try {
      setIsAnalyzing(true);
      setActiveAnalysisRef(reflection);
      const res = await api.extractReflection(reflection.id);
      setActiveAnalysisRef({
        ...reflection,
        extractedEntities: res.extractedEntities,
        analysisState: 'analyzed',
      });
      await loadReflections();
    } catch (err: any) {
      setStatusMessage(`Analysis note: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePromoteToMemory = async (statement: string, title: string) => {
    try {
      await api.createMemory({
        title,
        statement,
        type: 'semantic',
        userApprovalState: 'approved',
        sourceReflectionIds: activeAnalysisRef ? [activeAnalysisRef.id] : [],
        tags: [activeAnalysisRef?.category || 'reflection'],
      });
      setStatusMessage('Promoted candidate to permanent Memory Vault!');
    } catch (err: any) {
      setStatusMessage(`Promotion failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
          <PenTool className="w-5 h-5 text-amber-500" />
          <span>Reflect & Journal</span>
        </h2>
        <p className="text-xs text-stone-400 mt-1 max-w-2xl leading-relaxed">
          Record verbatim experiences, decisions, and challenges. Adora preserves your original words
          as immutable ground truth, then generates structured hypotheses for your review.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* CAPTURE DRAFT CARD */}
      {/* ========================================================= */}
      <Card className="border-amber-500/30 bg-stone-900/90 shadow-lg">
        <CardHeader
          title="New Reflection Entry"
          subtitle="Direct, unfiltered capture of thoughts, dilemmas, or milestones"
          action={
            <div className="flex items-center gap-2">
              <ProvenanceChip type="verbatim" />
            </div>
          }
        />

        {/* Category Pills */}
        <div className="mb-4">
          <label className="block text-[11px] font-medium text-stone-300 uppercase tracking-wider mb-2">
            Context Category
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize border transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                    : 'bg-stone-800 text-stone-300 border-stone-700/60 hover:bg-stone-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="mb-4">
          <textarea
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="What happened today? What decisions did you make, what friction did you encounter, and what lesson stands out?"
            className="w-full rounded-xl bg-stone-950/80 border border-stone-800 p-4 text-xs sm:text-sm text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 leading-relaxed font-sans"
          />
          <div className="flex items-center justify-between text-[11px] text-stone-400 mt-1 px-1">
            <span>{rawText.trim().split(/\s+/).filter(Boolean).length} words</span>
            <span>Max 10,000 characters</span>
          </div>
        </div>

        {/* Metadata Controls: Tags, Mood, Energy, Voice Capture */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-800/80 mb-5">
          {/* Tags */}
          <div>
            <label className="block text-[11px] font-medium text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-stone-400" />
              <span>Tags (comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="launch, team, priority"
              className="w-full rounded-lg bg-stone-950 border border-stone-800 px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500/40"
            />
          </div>

          {/* Mood Rating */}
          <div>
            <label className="block text-[11px] font-medium text-stone-300 uppercase tracking-wider mb-1.5">
              Mood Rating ({moodRating}/5)
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMoodRating(num)}
                  className={`w-7 h-7 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                    moodRating === num
                      ? 'bg-amber-500 text-stone-950 border-amber-400'
                      : 'bg-stone-800 text-stone-300 border-stone-700/60 hover:bg-stone-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Energy Rating */}
          <div>
            <label className="block text-[11px] font-medium text-stone-300 uppercase tracking-wider mb-1.5">
              Energy Rating ({energyRating}/5)
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setEnergyRating(num)}
                  className={`w-7 h-7 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                    energyRating === num
                      ? 'bg-cyan-500 text-stone-950 border-cyan-400'
                      : 'bg-stone-800 text-stone-300 border-stone-700/60 hover:bg-stone-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-800">
          <div className="flex items-center gap-2">
            {/* Voice Capture Mode Toggle */}
            <Button
              type="button"
              variant={isRecording ? 'danger' : 'outline'}
              size="sm"
              disabled={isTranscribing}
              icon={
                isTranscribing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : isRecording ? (
                  <MicOff className="w-3.5 h-3.5 animate-pulse" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )
              }
              onClick={() => {
                if (!isRecording) {
                  startVoiceRecording();
                } else {
                  stopVoiceRecording();
                }
              }}
            >
              {isTranscribing
                ? 'Transcribing audio...'
                : isRecording
                ? `Recording (${recordingSeconds}s)... Click to Finish`
                : 'Record Spoken Reflection'}
            </Button>
          </div>


          <Button
            variant="primary"
            size="md"
            icon={<Send className="w-4 h-4" />}
            isLoading={isSubmitting}
            onClick={handleSaveReflection}
            disabled={!rawText.trim()}
          >
            Save Reflection & Extract
          </Button>
        </div>
      </Card>

      {/* ========================================================= */}
      {/* REFLECTION HISTORY & NEMOTRON ANALYSIS DRAWER */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Reflection List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-200">
              Captured Reflections ({reflections.length})
            </h3>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-stone-300 mr-1">Filter:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-stone-900 border border-stone-800 text-stone-300 rounded-md px-2 py-1 text-xs focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {reflections.length === 0 ? (
            <EmptyState
              icon={<PenTool className="w-6 h-6 text-stone-400" />}
              title="No reflections found in this view"
              description="Write an entry above or record a voice reflection to establish your initial historical memory."
            />
          ) : (
            <div className="space-y-3">
              {reflections.map((ref) => {
                const isSelected = activeAnalysisRef?.id === ref.id;
                return (
                  <div
                    key={ref.id}
                    onClick={() => setActiveAnalysisRef(ref)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                        : 'bg-stone-900/60 border-stone-800/80 hover:border-stone-700 hover:bg-stone-900/90'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium uppercase font-mono bg-stone-800 text-stone-300">
                          {ref.category}
                        </span>
                        {ref.sourceType === 'voice_transcript' && (
                          <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
                            <Mic className="w-3 h-3" /> Voice
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-stone-300 text-[11px]">
                        {ref.moodRating && <span>Mood: {ref.moodRating}/5</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ref.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed mb-3">
                      {ref.rawText}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-800/60 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {ref.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-mono bg-stone-800 text-stone-400 px-1.5 py-0.2 rounded"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerExtraction(ref);
                        }}
                        className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{ref.analysisState === 'analyzed' ? 'View Extraction' : 'Analyze with Nemotron'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Analysis & Entity Inspector (1 col) */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>NVIDIA Nemotron Analysis Drawer</span>
          </h3>

          {!activeAnalysisRef ? (
            <Card className="text-center p-6 text-xs text-stone-400">
              <p>Select any reflection on the left to inspect structured AI extraction results.</p>
            </Card>
          ) : isAnalyzing ? (
            <Card className="flex flex-col items-center justify-center p-8 text-center text-xs text-stone-400 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <p>Extracting decisions, events, obstacles, and lessons with Nemotron...</p>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="border-stone-800 bg-stone-900/90 p-4 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <div className="text-xs font-semibold text-stone-100 truncate">
                    Extraction for #{activeAnalysisRef.id.slice(0, 8)}
                  </div>
                  <ProvenanceChip type="hypothesis" />
                </div>

                {/* Decisions */}
                <div>
                  <h4 className="text-[11px] font-mono uppercase text-stone-400 mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Decisions Extracted</span>
                  </h4>
                  {activeAnalysisRef.extractedEntities?.decisions?.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-stone-200">
                      {activeAnalysisRef.extractedEntities.decisions.map((d, i) => (
                        <li
                          key={i}
                          className="p-2 rounded bg-stone-950 border border-stone-800/80 flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{d}</span>
                          <button
                            onClick={() => handlePromoteToMemory(d, 'Extracted Decision')}
                            className="text-[10px] text-amber-400 hover:text-amber-300 font-mono shrink-0 cursor-pointer"
                          >
                            + Save Memory
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-stone-500 italic">No explicit trade-offs detected.</p>
                  )}
                </div>

                {/* Obstacles & Friction */}
                <div>
                  <h4 className="text-[11px] font-mono uppercase text-stone-400 mb-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    <span>Obstacles & Friction</span>
                  </h4>
                  {activeAnalysisRef.extractedEntities?.obstacles?.length > 0 ? (
                    <ul className="space-y-1 text-xs text-stone-300">
                      {activeAnalysisRef.extractedEntities.obstacles.map((o, i) => (
                        <li key={i} className="p-2 rounded bg-stone-950 border border-stone-800/80">
                          {o}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-stone-500 italic">No blockers identified.</p>
                  )}
                </div>

                {/* Lessons Learned */}
                <div>
                  <h4 className="text-[11px] font-mono uppercase text-stone-400 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>Lessons Derived</span>
                  </h4>
                  {activeAnalysisRef.extractedEntities?.lessons?.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-stone-200">
                      {activeAnalysisRef.extractedEntities.lessons.map((l, i) => (
                        <li
                          key={i}
                          className="p-2 rounded bg-stone-950 border border-stone-800/80 flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{l}</span>
                          <button
                            onClick={() => handlePromoteToMemory(l, 'Derived Lesson')}
                            className="text-[10px] text-amber-400 hover:text-amber-300 font-mono shrink-0 cursor-pointer"
                          >
                            + Save Memory
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-stone-500 italic">No lessons recorded.</p>
                  )}
                </div>

                {/* Next Inquiries */}
                <div>
                  <h4 className="text-[11px] font-mono uppercase text-stone-400 mb-1.5 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-cyan-400" />
                    <span>Inquiry Questions</span>
                  </h4>
                  {activeAnalysisRef.extractedEntities?.questions?.length > 0 ? (
                    <ul className="space-y-1 text-xs text-stone-400">
                      {activeAnalysisRef.extractedEntities.questions.map((q, i) => (
                        <li key={i} className="p-2 rounded bg-stone-950 border border-stone-800/80 italic">
                          "{q}"
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-stone-500 italic">No questions formulated.</p>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
