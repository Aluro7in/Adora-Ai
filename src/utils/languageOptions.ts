/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LanguageOption {
  code: string;         // BCP-47 language tag (e.g., 'en-US', 'en-IN')
  language: string;     // Language name
  accent: string;       // Accent / Dialect description
  label: string;        // Human-readable dropdown label
  regionFlag: string;   // Country / Region emoji
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  // --- English Accents (Enhanced for non-native and global speakers) ---
  {
    code: 'en-US',
    language: 'English',
    accent: 'Standard North American',
    label: 'English — US / Standard',
    regionFlag: '🇺🇸',
  },
  {
    code: 'en-IN',
    language: 'English',
    accent: 'Indian Accent (Subcontinent)',
    label: 'English — Indian Accent',
    regionFlag: '🇮🇳',
  },
  {
    code: 'en-GB',
    language: 'English',
    accent: 'British / UK Received Pronunciation',
    label: 'English — UK / British',
    regionFlag: '🇬🇧',
  },
  {
    code: 'en-AU',
    language: 'English',
    accent: 'Australian',
    label: 'English — Australian',
    regionFlag: '🇦🇺',
  },
  {
    code: 'en-SG',
    language: 'English',
    accent: 'Singapore / Southeast Asian Accent',
    label: 'English — Singapore & SE Asia',
    regionFlag: '🇸🇬',
  },
  {
    code: 'en-PH',
    language: 'English',
    accent: 'Filipino Accent',
    label: 'English — Filipino Accent',
    regionFlag: '🇵🇭',
  },
  {
    code: 'en-NG',
    language: 'English',
    accent: 'Nigerian / West African Accent',
    label: 'English — Nigerian / West African',
    regionFlag: '🇳🇬',
  },
  {
    code: 'en-ZA',
    language: 'English',
    accent: 'South African Accent',
    label: 'English — South African',
    regionFlag: '🇿🇦',
  },
  {
    code: 'en-CA',
    language: 'English',
    accent: 'Canadian Accent',
    label: 'English — Canadian',
    regionFlag: '🇨🇦',
  },
  {
    code: 'en-IE',
    language: 'English',
    accent: 'Irish Accent',
    label: 'English — Irish Accent',
    regionFlag: '🇮🇪',
  },
  {
    code: 'en-NZ',
    language: 'English',
    accent: 'New Zealand Accent',
    label: 'English — New Zealand',
    regionFlag: '🇳🇿',
  },

  // --- Spanish Dialects ---
  {
    code: 'es-ES',
    language: 'Spanish',
    accent: 'Spain / Castilian',
    label: 'Spanish — Spain (Castilian)',
    regionFlag: '🇪🇸',
  },
  {
    code: 'es-MX',
    language: 'Spanish',
    accent: 'Mexican / Latin American',
    label: 'Spanish — Mexico / Latin America',
    regionFlag: '🇲🇽',
  },

  // --- Other Major World Languages ---
  {
    code: 'hi-IN',
    language: 'Hindi',
    accent: 'Hindi & Hinglish',
    label: 'Hindi — India (Hinglish)',
    regionFlag: '🇮🇳',
  },
  {
    code: 'fr-FR',
    language: 'French',
    accent: 'France / Metropolitan',
    label: 'French — France',
    regionFlag: '🇫🇷',
  },
  {
    code: 'fr-CA',
    language: 'French',
    accent: 'Canadian / Québécois',
    label: 'French — Canada (Québec)',
    regionFlag: '🇨🇦',
  },
  {
    code: 'de-DE',
    language: 'German',
    accent: 'Standard German',
    label: 'German — Germany',
    regionFlag: '🇩🇪',
  },
  {
    code: 'ja-JP',
    language: 'Japanese',
    accent: 'Standard Japanese',
    label: 'Japanese — Japan',
    regionFlag: '🇯🇵',
  },
  {
    code: 'zh-CN',
    language: 'Chinese',
    accent: 'Mandarin (Simplified)',
    label: 'Chinese — Mandarin',
    regionFlag: '🇨🇳',
  },
  {
    code: 'pt-BR',
    language: 'Portuguese',
    accent: 'Brazilian Portuguese',
    label: 'Portuguese — Brazil',
    regionFlag: '🇧🇷',
  },
  {
    code: 'ar-SA',
    language: 'Arabic',
    accent: 'Modern Standard Arabic',
    label: 'Arabic — Modern Standard',
    regionFlag: '🇸🇦',
  },
  {
    code: 'it-IT',
    language: 'Italian',
    accent: 'Standard Italian',
    label: 'Italian — Italy',
    regionFlag: '🇮🇹',
  },
  {
    code: 'ko-KR',
    language: 'Korean',
    accent: 'Standard Korean',
    label: 'Korean — South Korea',
    regionFlag: '🇰🇷',
  },
  {
    code: 'nl-NL',
    language: 'Dutch',
    accent: 'Netherlands',
    label: 'Dutch — Netherlands',
    regionFlag: '🇳🇱',
  },
];

export const DEFAULT_LANGUAGE_CODE = 'en-US';

export function getLanguageOption(code: string): LanguageOption {
  return (
    LANGUAGE_OPTIONS.find((opt) => opt.code === code) ||
    LANGUAGE_OPTIONS[0]
  );
}
