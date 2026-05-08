import { useCallback, useEffect, useRef, useState } from "react";
import {
  calculateAccuracy,
  calculateConsistency,
  calculateRawWpm,
  calculateWpm,
  recordKeyMistake,
} from "../utils/typing";
import type { KeyMistakes } from "../utils/typing";
import { useSettingsStore } from "../store/settingsStore";
import { playKeySound } from "../utils/sound";
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
  incorrectAttempts: number,
  extraAttempts: number,
): TypingStats {
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) correct++;
  }
  const missed = isFinished ? 0 : Math.max(0, target.length - typed.length);
  const typedTotal = correct + incorrectAttempts + extraAttempts;

  return {
    wpm: calculateWpm(correct, durationSec),
    rawWpm: calculateRawWpm(typedTotal, durationSec),
    accuracy: calculateAccuracy(correct, typedTotal),
    consistency: calculateConsistency(wpmHistory.map((s) => s.wpm)),
    correctChars: correct,
    incorrectChars: incorrectAttempts,
    extraChars: extraAttempts,
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
  const incorrectAttemptsRef = useRef(0);
  const extraAttemptsRef = useRef(0);
  const keyMistakesRef = useRef<KeyMistakes>({});
  onFinishRef.current = onFinish;

  const reset = useCallback(() => {
    setTyped("");
    setStartedAt(null);
    setElapsedSec(0);
    setIsFinished(false);
    setWpmHistory([]);
    startedAtRef.current = null;
    finishedRef.current = false;
    incorrectAttemptsRef.current = 0;
    extraAttemptsRef.current = 0;
    keyMistakesRef.current = {};
  }, []);

  const finish = useCallback(
    (finalTyped: string) => {
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
          incorrectAttemptsRef.current,
          extraAttemptsRef.current,
        );
        onFinishRef.current({
          ...stats,
          testDurationSec: Math.max(1, Math.round(duration)),
          wpmHistory: history,
          keyMistakes: { ...keyMistakesRef.current },
        });
        return history;
      });
    },
    [target],
  );

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
        const rawWpm = calculateRawWpm(
          correct + incorrectAttemptsRef.current + extraAttemptsRef.current,
          elapsed,
        );
        setWpmHistory((h) => [...h, { sec: Math.round(elapsed), wpm, rawWpm }]);
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
      if (useSettingsStore.getState().soundEnabled) {
        playKeySound();
      }

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
          for (let i = prev.length; i < next.length; i++) {
            const expectedChar = target[i];
            if (expectedChar !== " ") {
              incorrectAttemptsRef.current += 1;
              recordKeyMistake(keyMistakesRef.current, expectedChar, " ");
            }
          }
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
        const expectedChar = target[prev.length];
        if (expectedChar === undefined) {
          extraAttemptsRef.current += 1;
          recordKeyMistake(keyMistakesRef.current, undefined, appended);
        } else if (appended !== expectedChar) {
          incorrectAttemptsRef.current += 1;
          recordKeyMistake(keyMistakesRef.current, expectedChar, appended);
        }
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
    incorrectAttemptsRef.current,
    extraAttemptsRef.current,
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
