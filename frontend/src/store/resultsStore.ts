import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TypingMode } from "@typecraft/shared";

export interface LocalResult {
  id: string;
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

interface ResultsState {
  results: LocalResult[];
  addResult: (result: Omit<LocalResult, "id" | "createdAt">) => void;
  clear: () => void;
}

export const useResultsStore = create<ResultsState>()(
  persist(
    (set) => ({
      results: [],
      addResult: (result) =>
        set((state) => ({
          results: [
            {
              ...result,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
            ...state.results,
          ].slice(0, 500),
        })),
      clear: () => set({ results: [] }),
    }),
    { name: "typecraft-results" },
  ),
);
