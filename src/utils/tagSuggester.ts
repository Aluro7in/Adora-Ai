/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SentimentAnalysisResult } from './sentiment.ts';

export interface TagRule {
  tag: string;
  keywords: string[];
  sentiments?: Array<SentimentAnalysisResult['sentiment']>;
}

const TAG_RULES: TagRule[] = [
  {
    tag: '#focus',
    keywords: ['focus', 'concentrat', 'deep work', 'distract', 'flow', 'uninterrupted', 'session', 'block', 'zone', 'priority'],
    sentiments: ['calm', 'reflective', 'energized'],
  },
  {
    tag: '#todo',
    keywords: ['todo', 'to-do', 'need to', 'must', 'plan to', 'finish', 'action', 'task', 'follow up', 'deliver', 'deadline', 'ship'],
    sentiments: ['energized', 'neutral'],
  },
  {
    tag: '#discovery',
    keywords: ['discover', 'learn', 'realiz', 'insight', 'found', 'surpris', 'aha', 'notice', 'breakthrough', 'new way', 'understood'],
    sentiments: ['reflective', 'energized'],
  },
  {
    tag: '#decision',
    keywords: ['decid', 'choice', 'chose', 'trade-off', 'option', 'direction', 'conclude', 'verdict', 'settle', 'selected'],
    sentiments: ['reflective'],
  },
  {
    tag: '#strategy',
    keywords: ['strateg', 'roadmap', 'vision', 'long-term', 'high-level', 'goal', 'milestone', 'objective', 'architecture'],
    sentiments: ['reflective', 'energized'],
  },
  {
    tag: '#obstacle',
    keywords: ['stuck', 'block', 'hard', 'difficult', 'struggle', 'frustrat', 'friction', 'issue', 'bug', 'delay', 'challeng'],
    sentiments: ['challenging'],
  },
  {
    tag: '#wellbeing',
    keywords: ['energy', 'tired', 'sleep', 'rest', 'burnout', 'peace', 'calm', 'mental', 'health', 'walk', 'breathe', 'recover'],
    sentiments: ['calm', 'challenging'],
  },
  {
    tag: '#gratitude',
    keywords: ['grateful', 'thankful', 'appreciat', 'kind', 'blessed', 'support', 'content', 'glad'],
    sentiments: ['calm', 'energized'],
  },
  {
    tag: '#team',
    keywords: ['team', 'meet', 'sync', 'colleague', 'discuss', 'feedback', 'client', 'partner', 'delegat', 'collaborat'],
    sentiments: ['neutral', 'energized'],
  },
  {
    tag: '#breakthrough',
    keywords: ['breakthrough', 'win', 'solved', 'unlocked', 'succeed', 'crushed', 'huge', 'progress', 'victory'],
    sentiments: ['energized'],
  },
];

const DEFAULT_TAGS = ['#focus', '#todo', '#discovery', '#decision'];

export function suggestTags(
  text: string,
  sentiment: SentimentAnalysisResult['sentiment'] = 'neutral'
): string[] {
  if (!text || !text.trim()) {
    return DEFAULT_TAGS;
  }

  const clean = text.toLowerCase();
  const scoredTags: Array<{ tag: string; score: number }> = [];

  for (const rule of TAG_RULES) {
    let score = 0;

    // Check keyword matches in text
    for (const kw of rule.keywords) {
      if (clean.includes(kw)) {
        score += 2;
      }
    }

    // Sentiment affinity bonus
    if (rule.sentiments && rule.sentiments.includes(sentiment)) {
      score += 1;
    }

    if (score > 0) {
      scoredTags.push({ tag: rule.tag, score });
    }
  }

  // Sort by relevance score
  scoredTags.sort((a, b) => b.score - a.score);

  const topTags = scoredTags.map((st) => st.tag);

  // If fewer than 3 tags matched, fill in contextually relevant defaults
  for (const defaultTag of DEFAULT_TAGS) {
    if (!topTags.includes(defaultTag) && topTags.length < 5) {
      topTags.push(defaultTag);
    }
  }

  return topTags.slice(0, 5);
}
