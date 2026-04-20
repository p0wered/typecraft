import wordsEn from "../data/words/en.json";
import wordsRu from "../data/words/ru.json";

const DICTIONARIES: Record<string, string[]> = {
  en: wordsEn,
  ru: wordsRu,
};

export function generateWords(language: string, count: number): string[] {
  const list = DICTIONARIES[language] ?? DICTIONARIES.en;
  const result: string[] = [];
  let lastIdx = -1;
  for (let i = 0; i < count; i++) {
    let idx = Math.floor(Math.random() * list.length);
    if (idx === lastIdx) idx = (idx + 1) % list.length;
    result.push(list[idx]);
    lastIdx = idx;
  }
  return result;
}

export interface WordStats {
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
}

export function analyzeWord(
  target: string,
  typed: string,
  includeMissed: boolean,
): WordStats {
  let correct = 0;
  let incorrect = 0;
  let extra = 0;
  let missed = 0;

  for (let i = 0; i < typed.length; i++) {
    if (i >= target.length) {
      extra++;
    } else if (typed[i] === target[i]) {
      correct++;
    } else {
      incorrect++;
    }
  }

  if (includeMissed && typed.length < target.length) {
    missed = target.length - typed.length;
  }

  return { correct, incorrect, extra, missed };
}

export function calculateWpm(correctChars: number, elapsedSec: number): number {
  if (elapsedSec <= 0) return 0;
  return (correctChars / 5) / (elapsedSec / 60);
}

export function calculateRawWpm(
  typedChars: number,
  elapsedSec: number,
): number {
  if (elapsedSec <= 0) return 0;
  return (typedChars / 5) / (elapsedSec / 60);
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 100;
  return (correct / total) * 100;
}

export function calculateConsistency(wpmSamples: number[]): number {
  if (wpmSamples.length < 2) return 100;
  const mean = wpmSamples.reduce((a, b) => a + b, 0) / wpmSamples.length;
  if (mean === 0) return 0;
  const variance =
    wpmSamples.reduce((acc, v) => acc + (v - mean) ** 2, 0) /
    wpmSamples.length;
  const stdev = Math.sqrt(variance);
  const cov = stdev / mean;
  return Math.max(0, Math.min(100, (1 - cov) * 100));
}
