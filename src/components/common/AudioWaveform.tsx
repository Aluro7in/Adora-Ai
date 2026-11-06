/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Zap, Volume2, Activity } from 'lucide-react';

export interface AudioWaveformProps {
  isRecording: boolean;
  stream?: MediaStream | null;
  recordingSeconds: number;
  languageLabel?: string;
  onStop?: () => void;
}

const BAR_COUNT = 28;
// Thresholds for voice detection & decibel spikes (dBFS)
const SPEECH_THRESHOLD_DB = -44;
const SPIKE_THRESHOLD_DB = -30;

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
  const [peakCaps, setPeakCaps] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => 0.18)
  );
  const [currentDb, setCurrentDb] = useState<number>(-60);
  const [peakDb, setPeakDb] = useState<number>(-60);
  const [isSpike, setIsSpike] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqDataRef = useRef<any>(null);
  const timeDataRef = useRef<any>(null);
  const stepRef = useRef<number>(0);
  const rollingPeakDbRef = useRef<number>(-60);
  const lastSpikeTimeRef = useRef<number>(0);
  const barPeaksRef = useRef<number[]>(Array.from({ length: BAR_COUNT }, () => 0.18));

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
      setPeakCaps(Array.from({ length: BAR_COUNT }, () => 0.18));
      setCurrentDb(-60);
      setPeakDb(-60);
      setIsSpike(false);
      setIsSpeaking(false);
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
          analyser.fftSize = 128; // 64 frequency bins & 128 time samples for fast transient response
          analyser.smoothingTimeConstant = 0.55; // lower smoothing for immediate decibel spike reactivity
          source.connect(analyser);

          const freqData = new Uint8Array(analyser.frequencyBinCount);
          const timeData = new Uint8Array(analyser.fftSize);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;
          freqDataRef.current = freqData;
          timeDataRef.current = timeData;
        }
      } catch (err) {
        console.warn('Web Audio API analyser setup fallback:', err);
      }
    }

    let lastUiUpdate = 0;

    const updateWaveform = (timestamp: number) => {
      stepRef.current += 0.12;
      const step = stepRef.current;

      if (analyserRef.current && freqDataRef.current && timeDataRef.current) {
        analyserRef.current.getByteFrequencyData(freqDataRef.current);
        analyserRef.current.getByteTimeDomainData(timeDataRef.current);

        const freq = freqDataRef.current;
        const time = timeDataRef.current;

        // 1. Calculate acoustic RMS and real-time Decibels (dBFS)
        let sumSquares = 0;
        for (let i = 0; i < time.length; i++) {
          const norm = (time[i] - 128) / 128; // -1 to 1
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / time.length);
        const rawDb = rms > 0.0001 ? 20 * Math.log10(rms) : -60;
        const instantDb = Math.max(-60, Math.min(0, Math.round(rawDb)));

        // 2. Detect decibel spikes and active speech
        const activeSpeaking = instantDb > SPEECH_THRESHOLD_DB;
        const decibelSpike = instantDb >= SPIKE_THRESHOLD_DB;

        if (decibelSpike) {
          lastSpikeTimeRef.current = Date.now();
        }
        const hasRecentSpike = Date.now() - lastSpikeTimeRef.current < 400;

        // Peak dB decay (studio VU meter decay)
        rollingPeakDbRef.current = Math.max(
          instantDb,
          rollingPeakDbRef.current - 0.4
        );

        // 3. Throttle state updates for numerical labels (every ~60ms) to ensure smooth 60fps rendering
        if (timestamp - lastUiUpdate > 60) {
          setCurrentDb(instantDb);
          setPeakDb(Math.round(rollingPeakDbRef.current));
          setIsSpeaking(activeSpeaking);
          setIsSpike(hasRecentSpike);
          lastUiUpdate = timestamp;
        }

        // 4. Calculate individual bar amplitudes with decibel spike boost
        const spikeMultiplier = hasRecentSpike ? 1.35 : 1.0;
        const newAmplitudes = Array.from({ length: BAR_COUNT }, (_, idx) => {
          const distFromCenter = Math.abs(idx - (BAR_COUNT - 1) / 2);
          const centerWeight = Math.cos((distFromCenter / (BAR_COUNT / 2)) * (Math.PI / 2.4));
          const binIndex = Math.min(
            freq.length - 1,
            Math.floor((idx / BAR_COUNT) * freq.length)
          );
          const freqVal = freq[binIndex] / 255;

          // Organic oscillation for lively motion even during quiet intervals
          const organicWave = Math.sin(step + idx * 0.45) * 0.12 + 0.12;
          const energy = (freqVal * 0.8 + rms * 1.4 + organicWave) * spikeMultiplier;
          const finalHeight = Math.max(
            0.12,
            Math.min(1.0, energy * Math.max(0.65, centerWeight))
          );
          return finalHeight;
        });

        // 5. Update peak-hold caps for each bar (gravity fall-off)
        const newPeaks = newAmplitudes.map((amp, idx) => {
          const currentPeak = barPeaksRef.current[idx] || 0;
          if (amp >= currentPeak) {
            return amp;
          }
          // Gravity decay
          return Math.max(amp, currentPeak - 0.025);
        });
        barPeaksRef.current = newPeaks;

        setAmplitudes(newAmplitudes);
        setPeakCaps(newPeaks);
      } else {
        // Fallback procedural waveform with simulated decibel spikes
        const simulatedSpike = Math.sin(step * 0.6) > 0.75;
        const simulatedDb = simulatedSpike
          ? Math.round(-24 + Math.sin(step * 4) * 6)
          : Math.round(-48 + Math.cos(step * 2) * 8);

        if (timestamp - lastUiUpdate > 60) {
          setCurrentDb(simulatedDb);
          setPeakDb(simulatedSpike ? simulatedDb : -35);
          setIsSpeaking(simulatedSpike || simulatedDb > SPEECH_THRESHOLD_DB);
          setIsSpike(simulatedSpike);
          lastUiUpdate = timestamp;
        }

        const spikeBoost = simulatedSpike ? 1.3 : 1.0;
        const newAmplitudes = Array.from({ length: BAR_COUNT }, (_, idx) => {
          const distFromCenter = Math.abs(idx - (BAR_COUNT - 1) / 2);
          const centerWeight = Math.cos((distFromCenter / (BAR_COUNT / 2)) * (Math.PI / 2.6));
          const wave1 = Math.sin(step * 1.5 + idx * 0.4) * 0.35;
          const wave2 = Math.cos(step * 2.2 - idx * 0.3) * 0.25;
          const wave3 = Math.sin(step * 0.8 + idx * 0.6) * 0.2;
          const height = Math.max(
            0.15,
            Math.min(0.95, (0.35 + wave1 + wave2 + wave3) * centerWeight * spikeBoost)
          );
          return height;
        });

        const newPeaks = newAmplitudes.map((amp, idx) => {
          const currentPeak = barPeaksRef.current[idx] || 0;
          return amp >= currentPeak ? amp : Math.max(amp, currentPeak - 0.03);
        });
        barPeaksRef.current = newPeaks;

        setAmplitudes(newAmplitudes);
        setPeakCaps(newPeaks);
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

  // Convert dB (-60 to 0) to percentage (0 to 100) for the live VU meter bar
  const vuPercent = Math.max(0, Math.min(100, Math.round(((currentDb + 60) / 60) * 100)));

  return (
    <div
      className={`rounded-xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-amber-950/30 border p-3 shadow-lg transition-all duration-150 animate-in fade-in zoom-in-95 ${
        isSpike
          ? 'border-amber-400 ring-1 ring-amber-400/50 shadow-amber-500/20'
          : isSpeaking
          ? 'border-amber-500/60 shadow-amber-950/30'
          : 'border-stone-800'
      }`}
    >
      {/* Top Header: Indicator, Live Timer, Decibel & Spike Status, Stop Button */}
      <div className="flex items-center justify-between gap-2.5 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {/* Pulsing Live Recording Dot */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSpike
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-400 animate-ping'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isSpike ? 'bg-amber-400' : 'bg-rose-500'
              }`}
            />
          </span>

          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 shrink-0">
            <Mic className="w-3.5 h-3.5 animate-pulse text-rose-400" />
            <span>Listening</span>
          </span>

          {/* Real-time Decibel Spike / Speech Status Badge */}
          {isSpike ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-200 bg-amber-500/30 border border-amber-400/60 px-2 py-0.5 rounded-full animate-bounce shadow-sm shadow-amber-500/40">
              <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
              <span>Spike {currentDb} dB</span>
            </span>
          ) : isSpeaking ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 px-1.5 py-0.5 rounded-full">
              <Activity className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
              <span>Voice {currentDb} dB</span>
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-stone-400 bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded">
              <Volume2 className="w-2.5 h-2.5 text-stone-500" />
              <span>{currentDb} dB</span>
            </span>
          )}

          {languageLabel && (
            <span className="hidden md:inline-block text-[10px] text-stone-400 bg-stone-900/80 border border-stone-800 px-1.5 py-0.5 rounded truncate max-w-[110px]">
              {languageLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Live Timer */}
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

      {/* Visual Audio Waveform Bars Container with Peak Caps */}
      <div className="relative flex items-center justify-between gap-1 sm:gap-1.5 h-14 px-2.5 bg-stone-950/90 border border-stone-800 rounded-lg overflow-hidden">
        {amplitudes.map((amp, idx) => {
          // Dynamic height from 10% to 94%
          const heightPercent = Math.round(amp * 84 + 10);
          const peakPercent = Math.min(
            96,
            Math.max(heightPercent + 2, Math.round((peakCaps[idx] || amp) * 84 + 10))
          );
          const isCenter = Math.abs(idx - (BAR_COUNT - 1) / 2) < 6;

          return (
            <div
              key={idx}
              className="relative flex-1 flex items-end justify-center h-full min-w-[2px] pb-1"
            >
              {/* Floating Peak-Hold Decibel Cap (classic studio spectrum analyzer response) */}
              <div
                style={{
                  bottom: `${peakPercent}%`,
                  transition: 'bottom 0.05s ease-out',
                }}
                className={`absolute w-full max-w-[5px] h-[2px] rounded-full z-10 transition-all ${
                  isSpike
                    ? 'bg-rose-300 shadow-[0_0_6px_rgba(251,113,133,0.9)]'
                    : isSpeaking
                    ? 'bg-amber-300 shadow-[0_0_4px_rgba(251,191,36,0.8)]'
                    : 'bg-stone-500 opacity-60'
                }`}
              />

              {/* Dynamic Waveform Bar */}
              <div
                style={{
                  height: `${heightPercent}%`,
                  transition: 'height 0.06s cubic-bezier(0.2, 0.9, 0.3, 1)',
                }}
                className={`w-full max-w-[5px] rounded-full transition-all duration-75 ${
                  isSpike
                    ? 'bg-gradient-to-t from-amber-600 via-orange-400 to-rose-400 shadow-[0_0_10px_rgba(251,146,60,0.85)]'
                    : isSpeaking && isCenter
                    ? 'bg-gradient-to-t from-amber-600 via-amber-400 to-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                    : isSpeaking
                    ? 'bg-gradient-to-t from-amber-700/70 via-amber-500/80 to-amber-300/90'
                    : 'bg-gradient-to-t from-stone-700 via-stone-600 to-stone-500 opacity-40'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Real-time Decibel VU Meter Strip & Feedback Footer */}
      <div className="mt-2 space-y-1.5">
        {/* Dynamic Decibel VU Meter Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-stone-500 shrink-0">-60dB</span>
          <div className="relative flex-1 h-1.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
            {/* Decibel Level Fill */}
            <div
              style={{ width: `${vuPercent}%` }}
              className={`h-full rounded-full transition-all duration-75 ${
                isSpike
                  ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]'
                  : isSpeaking
                  ? 'bg-gradient-to-r from-emerald-500 to-amber-400'
                  : 'bg-stone-600'
              }`}
            />
          </div>
          <span className="text-[9px] font-mono text-stone-500 shrink-0">0dB</span>
        </div>

        {/* Informational Status Footer */}
        <div className="flex items-center justify-between text-[10px] text-stone-400 px-0.5 font-mono">
          <span className="truncate">
            {isSpike ? (
              <span className="text-amber-300 font-semibold flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-amber-400" />
                Active speech spike detected ({currentDb} dB)
              </span>
            ) : isSpeaking ? (
              <span className="text-emerald-300">Microphone capturing voice ({currentDb} dB)</span>
            ) : (
              <span>Listening for voice input...</span>
            )}
          </span>
          <span className="shrink-0 text-stone-500 ml-2">
            Peak: <strong className="text-stone-300">{peakDb} dB</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
