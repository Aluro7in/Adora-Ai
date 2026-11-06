/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Headphones } from 'lucide-react';

export interface AudioPlayerProps {
  audioUrl: string;
  onDiscard?: () => void;
  title?: string;
  durationSeconds?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  onDiscard,
  title = 'Recorded Voice Note',
  durationSeconds,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(durationSeconds || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);

  useEffect(() => {
    // Reset state when audioUrl changes
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.defaultPlaybackRate = playbackSpeed;
    }
  }, [audioUrl, playbackSpeed]);

  const handleSpeedChange = (speed: 1 | 1.5 | 2) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      audioRef.current.defaultPlaybackRate = speed;
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().catch((err) => {
        console.warn('Audio play failed:', err);
      });
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.defaultPlaybackRate = playbackSpeed;
      if (!totalDuration || isNaN(totalDuration) || totalDuration === 0) {
        if (isFinite(audioRef.current.duration)) {
          setTotalDuration(audioRef.current.duration);
        }
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-xl bg-stone-900/90 border border-amber-500/30 p-3 shadow-md space-y-2.5 transition-all">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-stone-200 truncate">{title}</p>
            <p className="text-[10px] text-amber-400/80 font-mono">
              Listen to recorded audio clip before saving
            </p>
          </div>
        </div>

        {/* Animated equalizer waves when playing */}
        {isPlaying && (
          <div className="flex items-center gap-0.5 h-4 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 shrink-0">
            <span className="w-0.5 h-2 bg-amber-400 animate-pulse" />
            <span className="w-0.5 h-3.5 bg-amber-400 animate-pulse delay-75" />
            <span className="w-0.5 h-1.5 bg-amber-400 animate-pulse delay-150" />
            <span className="w-0.5 h-3 bg-amber-400 animate-pulse delay-100" />
          </div>
        )}
      </div>

      {/* Playback Controls, Progress Bar, Speed Control & Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
          title={isPlaying ? 'Pause audio' : 'Play audio clip'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current stroke-[2.5]" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5 stroke-[2.5]" />
          )}
        </button>

        {/* Scrubber slider and timestamps */}
        <div className="flex-1 min-w-[130px] space-y-1">
          <div className="relative w-full flex items-center">
            <input
              type="range"
              min="0"
              max={totalDuration > 0 ? totalDuration : 1}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-stone-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Speed Control Toggle: 1x, 1.5x, 2x */}
        <div
          className="flex items-center bg-stone-950 border border-stone-800 rounded-lg p-0.5 shrink-0"
          role="group"
          aria-label="Playback speed"
        >
          {([1, 1.5, 2] as const).map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => handleSpeedChange(speed)}
              className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-all cursor-pointer font-medium ${
                playbackSpeed === speed
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
              title={`Set playback speed to ${speed}x`}
              aria-pressed={playbackSpeed === speed}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Mute button */}
        <button
          type="button"
          onClick={toggleMute}
          className="p-1.5 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer rounded shrink-0"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Discard / Re-record button */}
        {onDiscard && (
          <button
            type="button"
            onClick={onDiscard}
            className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-rose-400 transition-colors cursor-pointer px-2 py-1 rounded bg-stone-800/80 hover:bg-rose-950/30 border border-stone-700/60 hover:border-rose-500/40 shrink-0"
            title="Discard this clip and re-record"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Re-record</span>
          </button>
        )}
      </div>
    </div>
  );
};
