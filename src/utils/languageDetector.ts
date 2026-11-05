/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LANGUAGE_OPTIONS, LanguageOption, getLanguageOption } from './languageOptions.ts';

export interface DetectionResult {
  code: string;
  language: string;
  accent: string;
  confidence: number;
  reason: string;
}

interface LanguagePattern {
  code: string;
  regex?: RegExp;
  keywords?: string[];
  weight: number;
  reason: string;
}

const LANGUAGE_PATTERNS: LanguagePattern[] = [
  // Script-based high confidence detections
  {
    code: 'hi-IN',
    regex: /[\u0900-\u097F]/, // Devanagari script
    weight: 0.98,
    reason: 'Devanagari script detected',
  },
  {
    code: 'ja-JP',
    regex: /[\u3040-\u309F\u30A0-\u30FF]/, // Hiragana & Katakana
    weight: 0.98,
    reason: 'Japanese kana detected',
  },
  {
    code: 'zh-CN',
    regex: /[\u4E00-\u9FFF]/, // Chinese Hanzi
    weight: 0.95,
    reason: 'Chinese characters detected',
  },
  {
    code: 'ko-KR',
    regex: /[\uAC00-\uD7AF\u1100-\u11FF]/, // Korean Hangul
    weight: 0.98,
    reason: 'Korean Hangul detected',
  },
  {
    code: 'ar-SA',
    regex: /[\u0600-\u06FF]/, // Arabic script
    weight: 0.98,
    reason: 'Arabic script detected',
  },

  // Vocabulary & Colloquialisms
  {
    code: 'en-IN',
    keywords: [
      'yaar',
      'achha',
      'accha',
      'lakh',
      'crore',
      'prepone',
      'do the needful',
      'today itself',
      'passed out',
      'revert back',
      'timepass',
      'upgradation',
      'doubt regarding',
      'what is your good name',
      'out of station',
      'firstly',
      'only',
      'itself',
    ],
    weight: 0.85,
    reason: 'Indian English / Hinglish colloquialisms detected',
  },
  {
    code: 'en-GB',
    keywords: [
      'cheers',
      'bloody',
      'mate',
      'proper',
      'rubbish',
      'sorted',
      'fortnight',
      'postcode',
      'trousers',
      'flatmate',
      'gutted',
      'blimey',
      'innit',
      'dodgy',
    ],
    weight: 0.8,
    reason: 'British English phrasing detected',
  },
  {
    code: 'en-AU',
    keywords: [
      "g'day",
      'arvo',
      'brekkie',
      'no worries',
      'fair dinkum',
      'bloke',
      'outback',
      'crikey',
      'straya',
      'heaps good',
    ],
    weight: 0.85,
    reason: 'Australian English vernacular detected',
  },
  {
    code: 'en-SG',
    keywords: ['lah', 'lor', 'leh', 'chope', 'can or not', 'shiok', 'kena', 'alamak', 'paiseh'],
    weight: 0.88,
    reason: 'Singaporean / Southeast Asian English detected',
  },
  {
    code: 'en-PH',
    keywords: ['po', 'opo', 'kasi', 'naman', 'talaga', 'bawal', 'chibog', 'charot'],
    weight: 0.88,
    reason: 'Filipino / Taglish phrasing detected',
  },
  {
    code: 'en-NG',
    keywords: ['abi', 'sha', 'abeg', 'wetin', 'wahala', 'dey', 'sef', 'o jare'],
    weight: 0.88,
    reason: 'Nigerian / West African English phrasing detected',
  },
  {
    code: 'es-MX',
    keywords: [
      'hola',
      'bueno',
      'órale',
      'güey',
      'chido',
      'ahorita',
      'qué onda',
      'entonces',
      'porque',
      'también',
      'gracias',
    ],
    weight: 0.82,
    reason: 'Latin American / Mexican Spanish detected',
  },
  {
    code: 'es-ES',
    keywords: [
      'hola',
      'vale',
      'hombre',
      'guay',
      'venga',
      'entonces',
      'porque',
      'también',
      'gracias',
      'decisión',
      'trabajo',
      'hoy',
    ],
    weight: 0.8,
    reason: 'Castilian Spanish detected',
  },
  {
    code: 'fr-FR',
    keywords: [
      'bonjour',
      'merci',
      'parce que',
      'donc',
      'aussi',
      'faire',
      'temps',
      'décision',
      'travail',
      'aujourd',
      'salut',
      'daccord',
    ],
    weight: 0.85,
    reason: 'French vocabulary detected',
  },
  {
    code: 'de-DE',
    keywords: [
      'hallo',
      'danke',
      'weil',
      'also',
      'auch',
      'machen',
      'zeit',
      'entscheidung',
      'arbeit',
      'heute',
      'genau',
      'bitte',
    ],
    weight: 0.85,
    reason: 'German vocabulary detected',
  },
  {
    code: 'pt-BR',
    keywords: [
      'olá',
      'obrigado',
      'porque',
      'então',
      'também',
      'fazer',
      'tempo',
      'decisão',
      'trabalho',
      'hoje',
      'beleza',
      'valeu',
    ],
    weight: 0.85,
    reason: 'Brazilian Portuguese detected',
  },
  {
    code: 'it-IT',
    keywords: [
      'ciao',
      'grazie',
      'perché',
      'quindi',
      'anche',
      'fare',
      'tempo',
      'decisione',
      'lavoro',
      'oggi',
      'prego',
    ],
    weight: 0.85,
    reason: 'Italian vocabulary detected',
  },
  {
    code: 'nl-NL',
    keywords: [
      'hallo',
      'bedankt',
      'omdat',
      'dus',
      'ook',
      'maken',
      'tijd',
      'beslissing',
      'werk',
      'vandaag',
      'alsjeblieft',
    ],
    weight: 0.85,
    reason: 'Dutch vocabulary detected',
  },
];

/**
 * Fast client-side language & accent detection from transcribed text
 */
export function detectLanguageFromText(text: string): DetectionResult | null {
  if (!text || text.trim().length < 4) {
    return null;
  }

  const clean = text.toLowerCase();

  // 1. Script checks
  for (const p of LANGUAGE_PATTERNS) {
    if (p.regex && p.regex.test(text)) {
      const opt = getLanguageOption(p.code);
      return {
        code: opt.code,
        language: opt.language,
        accent: opt.accent,
        confidence: p.weight,
        reason: p.reason,
      };
    }
  }

  // 2. Keyword checks
  let bestMatch: DetectionResult | null = null;
  let highestScore = 0;

  for (const p of LANGUAGE_PATTERNS) {
    if (p.keywords) {
      let matchCount = 0;
      for (const kw of p.keywords) {
        // match word boundaries where possible
        const pattern = new RegExp(`\\b${kw}\\b`, 'i');
        if (pattern.test(clean) || clean.includes(kw)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const score = Math.min(0.96, p.weight * (0.6 + matchCount * 0.2));
        if (score > highestScore && score >= 0.7) {
          highestScore = score;
          const opt = getLanguageOption(p.code);
          bestMatch = {
            code: opt.code,
            language: opt.language,
            accent: opt.accent,
            confidence: score,
            reason: p.reason,
          };
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Consistency Tracker: accumulates consecutive detections to verify a stable language pattern
 */
export class LanguageConsistencyTracker {
  private history: Array<{ code: string; timestamp: number; confidence: number }> = [];
  private readonly threshold: number = 2; // Requires at least 2 consistent signals
  private readonly windowMs: number = 30000; // 30-second sliding window

  public recordObservation(code: string, confidence: number = 0.8): string | null {
    const now = Date.now();
    // Prune stale observations
    this.history = this.history.filter((h) => now - h.timestamp < this.windowMs);

    this.history.push({ code, timestamp: now, confidence });

    // Count observations for this specific code
    const matching = this.history.filter((h) => h.code === code);
    const avgConfidence =
      matching.reduce((acc, curr) => acc + curr.confidence, 0) / (matching.length || 1);

    if (matching.length >= this.threshold && avgConfidence >= 0.72) {
      return code;
    }

    return null;
  }

  public reset(): void {
    this.history = [];
  }
}
