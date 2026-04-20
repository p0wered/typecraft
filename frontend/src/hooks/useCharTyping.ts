import { useCallback, useEffect, useRef, useState } from "react";
import {
  calculateAccuracy,
  calculateConsistency,
  calculateRawWpm,
  calculateWpm,
} from "../utils/typing";
import type { TypingStats, TypingTestResult, WpmSample } from "./useTyping";

interface UseCharTypingOptions {
  target: string;
  onFinish: (result: TypingTestResult) => void;
}

function computeCharStats(
  target: string,
  typed: string,
  isFinished: boolean,
  wpmHistory: WpmSample[],
  durationSec: number,
): TypingStats {
  let correct = 0;
  let incorrect = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) correct++;
    else incorrect++;
  }
  const missed = isFinished ? 0 : Math.max(0, target.length - typed.length);
  const typedTotal = typed.length;

  return {
    wpm: calculateWpm(correct, durationSec),
    rawWpm: calculateRawWpm(typedTotal, durationSec),
    accuracy: calculateAccuracy(correct, typedTotal),
    consistency: calculateConsistency(wpmHistory.map((s) => s.wpm)),
    correctChars: correct,
    incorrectChars: incorrect,
    extraChars: 0,
    missedChars: missed,
  };
}

export function useCharTyping({ target, onFinish }: UseCharTypingOptions) {
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [wpmHistory, setWpmHistory] = useState<WpmSample[]>([]);

  const startedAtRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const reset = useCallback(() => {
    setTyped("");
    setStartedAt(null);
    setElapsedSec(0);
    setIsFinished(false);
    setWpmHistory([]);
    startedAtRef.current = null;
    finishedRef.current = false;
  }, []);

  const finish = useCallback((finalTyped: string) => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const started = startedAtRef.current ?? Date.now();
    const duration = (Date.now() - started) / 1000;
    setIsFinished(true);

    setWpmHistory((history) => {
      const stats = computeCharStats(
        target,
        finalTyped,
        true,
        history,
        Math.max(duration, 0.01),
      );
      onFinishRef.current({
        ...stats,
        testDurationSec: Math.max(1, Math.round(duration)),
        wpmHistory: history,
      });
      return history;
    });
  }, [target]);

  useEffect(() => {
    if (startedAt === null || isFinished) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - startedAt) / 1000;
      setElapsedSec(elapsed);

      setTyped((currentTyped) => {
        let correct = 0;
        for (let i = 0; i < currentTyped.length; i++) {
          if (currentTyped[i] === target[i]) correct++;
        }
        const wpm = calculateWpm(correct, elapsed);
        const rawWpm = calculateRawWpm(currentTyped.length, elapsed);
        setWpmHistory((h) => [
          ...h,
          { sec: Math.round(elapsed), wpm, rawWpm },
        ]);
        return currentTyped;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, isFinished, target]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (finishedRef.current) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;
      const isPrintable = key.length === 1;
      const isBackspace = key === "Backspace";
      const isEnter = key === "Enter";
      const isTab = key === "Tab";

      if (!isPrintable && !isBackspace && !isEnter && !isTab) return;

      e.preventDefault();

      if (startedAtRef.current === null && (isPrintable || isEnter || isTab)) {
        const now = Date.now();
        startedAtRef.current = now;
        setStartedAt(now);
      }

      if (isBackspace) {
        setTyped((prev) => prev.slice(0, -1));
        return;
      }

      if (isTab) {
        setTyped((prev) => {
          if (prev.length >= target.length) return prev;
          const room = target.length - prev.length;
          const next = prev + "  ".slice(0, Math.min(2, room));
          if (next.length >= target.length) {
            setTimeout(() => finish(next), 0);
          }
          return next;
        });
        return;
      }

      const appended = isEnter ? "\n" : key;

      setTyped((prev) => {
        if (prev.length >= target.length) return prev;
        const next = prev + appended;
        if (next.length >= target.length) {
          setTimeout(() => finish(next), 0);
        }
        return next;
      });
    },
    [target, finish],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const liveStats = computeCharStats(
    target,
    typed,
    false,
    wpmHistory,
    Math.max(elapsedSec, 0.01),
  );

  return {
    target,
    typed,
    position: typed.length,
    isActive: startedAt !== null && !isFinished,
    isFinished,
    elapsedSec,
    liveStats,
    reset,
  };
}
