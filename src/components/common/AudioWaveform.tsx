/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';

export interface AudioWaveformProps {
  isRecording: boolean;
  stream?: MediaStream | null;
  recordingSeconds: number;
  languageLabel?: string;
  onStop?: () => void;
}

const BAR_COUNT = 28;

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isRecording,
  stream,
  recordingSeconds,
  languageLabel,
  onStop,
}) => {
  const [amplitudes, setAmplitudes] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => 0.15)
  );

  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<any>(null);
  const stepRef = useRef<number>(0);

  useEffect(() => {
    if (!isRecording) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setAmplitudes(Array.from({ length: BAR_COUNT }, () => 0.15));
      return;
    }

    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;

    if (stream && stream.active) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
          }
          const source = audioCtx.createMediaStreamSource(stream);
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64; // Produces 32 frequency bins
          analyser.smoothingTimeConstant = 0.75;
          source.connect(analyser);

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;
          dataArrayRef.current = dataArray;
        }
      } catch (err) {
        console.warn('Web Audio API analyser setup fallback:', err);
      }
    }

    const updateWaveform = () => {
      stepRef.current += 0.12;
      const step = stepRef.current;

      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const data = dataArrayRef.current;

        // Calculate average volume to scale overall activity
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += data[i];
        }
        const avg = sum / data.length / 255; // 0 to 1

        const newAmplitudes = Array.from({ length: BAR_COUNT }, (_, idx) => {
          // Map index to frequency bin with symmetrical wave shape
          const distFromCenter = Math.abs(idx - (BAR_COUNT - 1) / 2);
          const centerWeight = Math.cos((distFromCenter / (BAR_COUNT / 2)) * (Math.PI / 2.5));
          const binIndex = Math.floor((idx / BAR_COUNT) * (data.length - 1));
          const freqVal = data[binIndex] / 255;

          // Blend real audio frequency with subtle organic pulse
          const organicWave = Math.sin(step + idx * 0.45) * 0.15 + 0.15;
          const combined = freqVal * 0.75 + avg * 0.35 + organicWave;
          const finalHeight = Math.max(0.12, Math.min(1.0, combined * Math.max(0.6, centerWeight)));
          return finalHeight;
        });

        setAmplitudes(newAmplitudes);
      } else {
        // Fallback procedural multi-sine wave animation
        const newAmplitudes = Array.from({ length: BAR_COUNT }, (_, idx) => {
          const distFromCenter = Math.abs(idx - (BAR_COUNT - 1) / 2);
          const centerWeight = Math.cos((distFromCenter / (BAR_COUNT / 2)) * (Math.PI / 2.6));
          const wave1 = Math.sin(step * 1.5 + idx * 0.4) * 0.35;
          const wave2 = Math.cos(step * 2.2 - idx * 0.3) * 0.25;
          const wave3 = Math.sin(step * 0.8 + idx * 0.6) * 0.2;
          const height = Math.max(0.15, Math.min(0.95, (0.4 + wave1 + wave2 + wave3) * centerWeight));
          return height;
        });

        setAmplitudes(newAmplitudes);
      }

      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    animationFrameRef.current = requestAnimationFrame(updateWaveform);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [isRecording, stream]);

  if (!isRecording) return null;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-amber-950/30 border border-amber-500/50 p-3 shadow-lg shadow-amber-950/20 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          {/* Pulsing Recording Indicator */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 animate-pulse text-rose-400" />
            <span>Listening Live</span>
          </span>
          {languageLabel && (
            <span className="hidden sm:inline-block text-[10px] text-stone-400 bg-stone-900/80 border border-stone-800 px-1.5 py-0.5 rounded">
              {languageLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Live timer badge */}
          <span className="font-mono text-xs font-semibold text-amber-300 bg-stone-950/80 px-2 py-0.5 rounded-md border border-amber-500/30 shadow-inner">
            {formatTimer(recordingSeconds)}
          </span>

          {/* Stop button inside waveform banner */}
          {onStop && (
            <button
              type="button"
              onClick={onStop}
              className="inline-flex items-center gap-1 text-[11px] font-medium bg-rose-500 hover:bg-rose-400 active:scale-95 text-white px-2.5 py-1 rounded-lg shadow-sm transition-all cursor-pointer"
              title="Stop recording and transcribe"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Done</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Audio Waveform Bars Container */}
      <div className="flex items-center justify-between gap-1 sm:gap-1.5 h-12 px-2 bg-stone-950/80 border border-stone-800/80 rounded-lg overflow-hidden">
        {amplitudes.map((amp, idx) => {
          // Dynamic height from 10% to 92%
          const heightPercent = Math.round(amp * 85 + 10);
          // Distinguish center bars with amber glow vs flanking subtle tones
          const isCenter = Math.abs(idx - (BAR_COUNT - 1) / 2) < 6;

          return (
            <div
              key={idx}
              className="flex-1 flex items-center justify-center h-full min-w-[2px]"
            >
              <div
                style={{
                  height: `${heightPercent}%`,
                  transition: 'height 0.08s ease-out',
                }}
                className={`w-full max-w-[5px] rounded-full transition-all duration-75 ${
                  isCenter
                    ? 'bg-gradient-to-t from-amber-600 via-amber-400 to-rose-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                    : 'bg-gradient-to-t from-amber-700/60 via-amber-500/80 to-amber-300/80'
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10px] text-stone-400 px-0.5 font-mono">
        <span>Speak naturally — speech converts to text in real-time</span>
        <span className="text-amber-400/90">● Live audio frequency</span>
      </div>
    </div>
  );
};
