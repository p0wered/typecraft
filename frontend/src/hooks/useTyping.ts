import { useCallback, useEffect, useRef, useState } from "react";
import type { TypingMode } from "@typecraft/shared";
import {
  analyzeWord,
  calculateAccuracy,
  calculateConsistency,
  calculateRawWpm,
  calculateWpm,
  generateWords,
} from "../utils/typing";

export interface WpmSample {
  sec: number;
  wpm: number;
  rawWpm: number;
}

export interface TypingStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
}

export interface TypingTestResult extends TypingStats {
  testDurationSec: number;
  wpmHistory: WpmSample[];
}

interface UseTypingOptions {
  mode: TypingMode;
  modeValue: string;
  language: string;
  onFinish: (result: TypingTestResult) => void;
}

const TIME_BUFFER_WORDS = 80;
const TIME_REFILL_THRESHOLD = 30;

function getInitialWords(
  mode: TypingMode,
  modeValue: string,
  language: string,
): string[] {
  if (mode === "words") {
    return generateWords(language, Math.max(1, Number(modeValue) || 25));
  }
  if (mode === "time") {
    return generateWords(language, TIME_BUFFER_WORDS);
  }
  return generateWords(language, 25);
}

export function useTyping({
  mode,
  modeValue,
  language,
  onFinish,
}: UseTypingOptions) {
  const [words, setWords] = useState<string[]>(() =>
    getInitialWords(mode, modeValue, language),
  );
  const [typedWords, setTypedWords] = useState<string[]>([""]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [wpmHistory, setWpmHistory] = useState<WpmSample[]>([]);

  const startedAtRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const timeLimit = mode === "time" ? Math.max(1, Number(modeValue) || 30) : 0;

  const reset = useCallback(() => {
    setWords(getInitialWords(mode, modeValue, language));
    setTypedWords([""]);
    setCurrentWordIndex(0);
    setStartedAt(null);
    setElapsedSec(0);
    setIsFinished(false);
    setWpmHistory([]);
    startedAtRef.current = null;
    finishedRef.current = false;
  }, [mode, modeValue, language]);

  const computeStats = useCallback(
    (
      wordsArr: string[],
      typedArr: string[],
      finishedWordCount: number,
      durationSec: number,
    ): TypingStats => {
      let correct = 0;
      let incorrect = 0;
      let extra = 0;
      let missed = 0;

      for (let i = 0; i < typedArr.length; i++) {
        const isFinishedWord = i < finishedWordCount;
        const stats = analyzeWord(
          wordsArr[i] ?? "",
          typedArr[i] ?? "",
          isFinishedWord,
        );
        correct += stats.correct;
        incorrect += stats.incorrect;
        extra += stats.extra;
        missed += stats.missed;
      }

      const typedTotal = correct + incorrect + extra;
      const wpm = calculateWpm(correct, durationSec);
      const rawWpm = calculateRawWpm(typedTotal, durationSec);
      const accuracy = calculateAccuracy(correct, typedTotal);
      const consistency = calculateConsistency(wpmHistory.map((s) => s.wpm));

      return {
        wpm,
        rawWpm,
        accuracy,
        consistency,
        correctChars: correct,
        incorrectChars: incorrect,
        extraChars: extra,
        missedChars: missed,
      };
    },
    [wpmHistory],
  );

  const finish = useCallback(
    (wordsArr: string[], typedArr: string[], advancedWords: number) => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      const started = startedAtRef.current ?? Date.now();
      const duration = (Date.now() - started) / 1000;
      const stats = computeStats(wordsArr, typedArr, advancedWords, duration);

      setIsFinished(true);

      onFinishRef.current({
        ...stats,
        testDurationSec: Math.round(duration),
        wpmHistory,
      });
    },
    [computeStats, wpmHistory],
  );

  useEffect(() => {
    if (startedAt === null || isFinished) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - startedAt) / 1000;
      setElapsedSec(elapsed);

      setTypedWords((currentTyped) => {
        setCurrentWordIndex((currentIdx) => {
          setWords((currentWords) => {
            let correctSoFar = 0;
            let totalTyped = 0;
            for (let i = 0; i < currentTyped.length; i++) {
              const stats = analyzeWord(
                currentWords[i] ?? "",
                currentTyped[i] ?? "",
                false,
              );
              correctSoFar += stats.correct;
              totalTyped += stats.correct + stats.incorrect + stats.extra;
            }
            const wpm = calculateWpm(correctSoFar, elapsed);
            const rawWpm = calculateRawWpm(totalTyped, elapsed);
            setWpmHistory((h) => [
              ...h,
              { sec: Math.round(elapsed), wpm, rawWpm },
            ]);

            if (mode === "time" && elapsed >= timeLimit) {
              finish(currentWords, currentTyped, currentIdx);
            }
            return currentWords;
          });
          return currentIdx;
        });
        return currentTyped;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, isFinished, mode, timeLimit, finish]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (finishedRef.current) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;

      const isPrintable = key.length === 1 && key !== " ";
      const isSpace = key === " ";
      const isBackspace = key === "Backspace";

      if (!isPrintable && !isSpace && !isBackspace) return;

      e.preventDefault();

      if (startedAtRef.current === null) {
        const now = Date.now();
        startedAtRef.current = now;
        setStartedAt(now);
      }

      if (isBackspace) {
        setTypedWords((prev) => {
          const next = [...prev];
          const currentTyped = next[currentWordIndex] ?? "";
          if (currentTyped.length > 0) {
            next[currentWordIndex] = currentTyped.slice(0, -1);
            return next;
          }
          if (currentWordIndex > 0) {
            setCurrentWordIndex(currentWordIndex - 1);
          }
          return next;
        });
        return;
      }

      if (isSpace) {
        const currentTyped = typedWords[currentWordIndex] ?? "";
        if (currentTyped.length === 0) return;

        const isLastWord = currentWordIndex === words.length - 1;
        if (mode === "words" && isLastWord) {
          finish(words, typedWords, currentWordIndex + 1);
          return;
        }

        const newIndex = currentWordIndex + 1;
        setCurrentWordIndex(newIndex);
        setTypedWords((prev) => {
          if (prev.length <= newIndex) {
            return [...prev, ""];
          }
          return prev;
        });

        if (
          mode === "time" &&
          words.length - newIndex <= TIME_REFILL_THRESHOLD
        ) {
          setWords((prev) => [
            ...prev,
            ...generateWords(language, TIME_BUFFER_WORDS),
          ]);
        }
        return;
      }

      if (isPrintable) {
        setTypedWords((prev) => {
          const next = [...prev];
          next[currentWordIndex] = (next[currentWordIndex] ?? "") + key;
          return next;
        });

        const currentTarget = words[currentWordIndex] ?? "";
        const currentTyped = (typedWords[currentWordIndex] ?? "") + key;

        if (
          mode === "words" &&
          currentWordIndex === words.length - 1 &&
          currentTyped === currentTarget
        ) {
          setTimeout(() => {
            finish(
              words,
              typedWords.map((w, i) =>
                i === currentWordIndex ? currentTyped : w,
              ),
              currentWordIndex + 1,
            );
          }, 0);
        }
      }
    },
    [currentWordIndex, typedWords, words, mode, language, finish],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const liveStats = computeStats(
    words,
    typedWords,
    currentWordIndex,
    elapsedSec || 0.01,
  );

  const remainingTime =
    mode === "time" ? Math.max(0, timeLimit - elapsedSec) : 0;

  return {
    words,
    typedWords,
    currentWordIndex,
    currentCharIndex: (typedWords[currentWordIndex] ?? "").length,
    isActive: startedAt !== null && !isFinished,
    isFinished,
    elapsedSec,
    remainingTime,
    liveStats,
    reset,
  };
}
