export type TypingMode = "words" | "time" | "quote" | "code";

export interface TypingResult {
  id: number;
  userId: number;
  mode: TypingMode;
  modeValue: string;
  language: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  testDurationSec: number;
  createdAt: string;
}

export interface CreateResultRequest {
  mode: TypingMode;
  modeValue: string;
  language: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  testDurationSec: number;
}

export interface ResultsQuery {
  mode?: TypingMode;
  language?: string;
  page?: number;
  limit?: number;
}

export interface PersonalBest {
  mode: TypingMode;
  modeValue: string;
  language: string;
  wpm: number;
  accuracy: number;
  createdAt: string;
}

export interface AggregatedStats {
  totalTests: number;
  averageWpm: number;
  averageAccuracy: number;
  totalTimeTypedSec: number;
  bestWpm: number;
  last10AverageWpm: number;
}
