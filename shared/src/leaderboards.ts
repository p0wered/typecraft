import type { TypingMode } from "./results";

export interface LeaderboardQuery {
  mode: TypingMode;
  modeValue?: string;
  language?: string;
  limit?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  mode: TypingMode;
  modeValue: string;
  language: string;
  wpm: number;
  accuracy: number;
  consistency: number;
  score: number;
  createdAt: string;
}

export interface WeeklyLeaderboardResponse {
  entries: LeaderboardEntry[];
  weekStartsAt: string;
  weekEndsAt: string;
}
