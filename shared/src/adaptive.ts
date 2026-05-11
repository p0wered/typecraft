import type { TypingMode } from "./results";

export type AdaptiveDifficulty = "easy" | "normal" | "hard";

export type AdaptiveFocus =
  | "accuracy"
  | "speed"
  | "consistency"
  | "weak_keys"
  | "punctuation"
  | "code_structure";

export interface AdaptiveRecentResult {
  mode: TypingMode;
  modeValue: string;
  language: string;
  wpm: number;
  accuracy: number;
  consistency: number;
  keyMistakes?: Record<string, number>;
  createdAt: string;
}

export interface AdaptiveRecommendationRequest {
  recentResults: AdaptiveRecentResult[];
  currentSettings?: {
    preferredLanguage?: string;
    fontSize?: number;
  };
  availableModes?: TypingMode[];
  /** When repeating challenge generation — ask for a noticeably different drill. */
  regenerateFromContent?: string;
  /** Excerpt from user-owned material for a paraphrased drill (avoid long verbatim copying). */
  sourceMaterialExcerpt?: string;
}

export interface AdaptiveRecommendation {
  mode: TypingMode;
  modeValue: string;
  language: string;
  difficulty: AdaptiveDifficulty;
  focus: AdaptiveFocus[];
  weakKeys: string[];
  title: string;
  description: string;
  generatedContent?: string;
  customTextId?: number;
}
