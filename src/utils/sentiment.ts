/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SentimentAnalysisResult {
  sentiment: 'energized' | 'reflective' | 'calm' | 'challenging' | 'neutral';
  emoji: string;
  label: string;
  colorClass: string;
  score: number; // -1.0 to 1.0
}

const ENERGIZED_KEYWORDS = [
  'breakthrough', 'excited', 'win', 'winning', 'energized', 'achieved', 'proud',
  'progress', 'awesome', 'crushed', 'fantastic', 'great', 'momentum', 'celebrate',
  'accomplished', 'thrilled', 'inspired', 'confident', 'succeeded', 'triumph'
];

const REFLECTIVE_KEYWORDS = [
  'realized', 'realize', 'lesson', 'learned', 'ponder', 'wonder', 'insight',
  'question', 'clarity', 'perspective', 'reflect', 'reflection', 'decision',
  'decided', 'trade-off', 'understand', 'meaning', 'thought', 'evaluate', 'strategy'
];

const CALM_KEYWORDS = [
  'peace', 'calm', 'grateful', 'gratitude', 'thankful', 'content', 'balanced',
  'relaxed', 'steady', 'centered', 'mindful', 'serene', 'grounded', 'harmonious'
];

const CHALLENGING_KEYWORDS = [
  'hard', 'difficult', 'struggle', 'frustrated', 'frustration', 'stuck', 'obstacle',
  'tired', 'exhausted', 'overwhelmed', 'blocker', 'anxious', 'anxiety', 'stress',
  'stressed', 'friction', 'failure', 'failed', 'doubt', 'worried', 'draining'
];

export function analyzeSentiment(text: string): SentimentAnalysisResult {
  if (!text || !text.trim()) {
    return {
      sentiment: 'neutral',
      emoji: '📝',
      label: 'Neutral',
      colorClass: 'text-stone-400 bg-stone-900 border-stone-800',
      score: 0.0,
    };
  }

  const clean = text.toLowerCase();
  const words = clean.split(/[^a-zA-Z0-9_-]+/).filter(Boolean);

  let energizedCount = 0;
  let reflectiveCount = 0;
  let calmCount = 0;
  let challengingCount = 0;

  for (const word of words) {
    if (ENERGIZED_KEYWORDS.some((kw) => word.includes(kw))) energizedCount++;
    if (REFLECTIVE_KEYWORDS.some((kw) => word.includes(kw))) reflectiveCount++;
    if (CALM_KEYWORDS.some((kw) => word.includes(kw))) calmCount++;
    if (CHALLENGING_KEYWORDS.some((kw) => word.includes(kw))) challengingCount++;
  }

  // Determine top sentiment
  const counts = [
    { type: 'energized' as const, count: energizedCount, emoji: '🚀', label: 'Energized & Motivated', color: 'text-amber-400 bg-amber-950/40 border-amber-800/60', score: 0.8 },
    { type: 'reflective' as const, count: reflectiveCount, emoji: '💡', label: 'Reflective & Thoughtful', color: 'text-sky-400 bg-sky-950/40 border-sky-800/60', score: 0.5 },
    { type: 'calm' as const, count: calmCount, emoji: '🌿', label: 'Calm & Centered', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60', score: 0.6 },
    { type: 'challenging' as const, count: challengingCount, emoji: '🌧️', label: 'Challenging / Stressed', color: 'text-rose-400 bg-rose-950/40 border-rose-800/60', score: -0.6 },
  ];

  counts.sort((a, b) => b.count - a.count);

  if (counts[0].count > 0) {
    return {
      sentiment: counts[0].type,
      emoji: counts[0].emoji,
      label: counts[0].label,
      colorClass: counts[0].color,
      score: counts[0].score,
    };
  }

  // Default heuristic based on punctuation/length
  if (text.includes('?')) {
    return {
      sentiment: 'reflective',
      emoji: '🤔',
      label: 'Inquiring / Curious',
      colorClass: 'text-purple-400 bg-purple-950/40 border-purple-800/60',
      score: 0.3,
    };
  }

  if (text.includes('!')) {
    return {
      sentiment: 'energized',
      emoji: '✨',
      label: 'Expressive',
      colorClass: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
      score: 0.4,
    };
  }

  return {
    sentiment: 'neutral',
    emoji: '📝',
    label: 'Observational',
    colorClass: 'text-stone-400 bg-stone-900 border-stone-800',
    score: 0.1,
  };
}
