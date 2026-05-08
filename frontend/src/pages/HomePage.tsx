import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TypingMode } from "@typecraft/shared";
import { useTyping } from "../hooks/useTyping";
import { useCharTyping } from "../hooks/useCharTyping";
import type { TypingTestResult } from "../hooks/useTyping";
import { ModeBar } from "../components/typing/ModeBar";
import { TypingArea } from "../components/typing/TypingArea";
import { CharTypingArea } from "../components/typing/CharTypingArea";
import { LiveStats } from "../components/typing/LiveStats";
import { Results } from "../components/typing/Results";
import { useTypingStore } from "../store/typingStore";
import { useResultsStore } from "../store/resultsStore";
import { useAuthStore } from "../store/authStore";
import { resultsApi } from "../services/results";
import { useI18n } from "../utils/i18n";
import {
  isContentLength,
  isProgrammingLanguage,
  pickRandomQuote,
  pickRandomSnippet,
} from "../utils/content";
import { staggerContainer, fadeSlideUp, fadeScale } from "../utils/motion";
import styles from "./HomePage.module.css";

function resolveResultLanguage(
  mode: TypingMode,
  modeValue: string,
  typingLanguage: string,
): string {
  if (mode === "code") return modeValue;
  return typingLanguage;
}

export function HomePage() {
  const { t } = useI18n();
  const mode = useTypingStore((s) => s.mode);
  const modeValue = useTypingStore((s) => s.modeValue);
  const typingLanguage = useTypingStore((s) => s.typingLanguage);
  const setMode = useTypingStore((s) => s.setMode);
  const setModeValue = useTypingStore((s) => s.setModeValue);
  const setTypingLanguage = useTypingStore((s) => s.setTypingLanguage);

  const addResult = useResultsStore((s) => s.addResult);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [finalResult, setFinalResult] = useState<TypingTestResult | null>(null);

  const resetRef = useRef<() => void>(() => {});

  const handleFinish = useCallback(
    (result: TypingTestResult) => {
      setFinalResult(result);
      const payload = {
        mode,
        modeValue,
        language: resolveResultLanguage(mode, modeValue, typingLanguage),
        wpm: result.wpm,
        rawWpm: result.rawWpm,
        accuracy: result.accuracy,
        consistency: result.consistency,
        correctChars: result.correctChars,
        incorrectChars: result.incorrectChars,
        extraChars: result.extraChars,
        missedChars: result.missedChars,
        testDurationSec: result.testDurationSec,
      };
      addResult(payload);
      if (isAuthenticated) {
        resultsApi.create(payload).catch((err) => {
          console.error("Failed to sync result:", err);
        });
      }
    },
    [mode, modeValue, typingLanguage, addResult, isAuthenticated],
  );

  const testKey = useMemo(
    () => `${mode}-${modeValue}-${typingLanguage}`,
    [mode, modeValue, typingLanguage],
  );

  const handleRestart = useCallback(() => {
    setFinalResult(null);
    resetRef.current();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleRestart();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleRestart]);

  const isCharMode = mode === "quote" || mode === "code";

  return (
    <div className={styles.container}>
      <AnimatePresence mode="wait">
        {finalResult ? (
          <motion.div
            key="results"
            className={styles.fullWidth}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <Results result={finalResult} onRestart={handleRestart} />
          </motion.div>
        ) : (
          <motion.div
            key="test"
            className={styles.fullWidth}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            {isCharMode ? (
              <CharBasedTest
                key={testKey}
                mode={mode}
                modeValue={modeValue}
                typingLanguage={typingLanguage}
                onFinish={handleFinish}
                onModeChange={setMode}
                onValueChange={setModeValue}
                onLanguageChange={setTypingLanguage}
                resetRef={resetRef}
              />
            ) : (
              <WordBasedTest
                key={testKey}
                mode={mode}
                modeValue={modeValue}
                typingLanguage={typingLanguage}
                onFinish={handleFinish}
                onModeChange={setMode}
                onValueChange={setModeValue}
                onLanguageChange={setTypingLanguage}
                resetRef={resetRef}
              />
            )}
            <motion.p className={styles.hint} variants={fadeSlideUp}>
              {t("home.restartHint")} <kbd>esc</kbd> {t("home.restartAction")}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface BaseTestProps {
  mode: TypingMode;
  modeValue: string;
  typingLanguage: string;
  onFinish: (result: TypingTestResult) => void;
  onModeChange: (mode: TypingMode) => void;
  onValueChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  resetRef: React.MutableRefObject<() => void>;
}

function WordBasedTest({
  mode,
  modeValue,
  typingLanguage,
  onFinish,
  onModeChange,
  onValueChange,
  onLanguageChange,
  resetRef,
}: BaseTestProps) {
  const {
    words,
    typedWords,
    currentWordIndex,
    isActive,
    liveStats,
    elapsedSec,
    remainingTime,
    reset,
  } = useTyping({
    mode,
    modeValue,
    language: typingLanguage,
    onFinish,
  });

  useEffect(() => {
    resetRef.current = reset;
  }, [reset, resetRef]);

  return (
    <div className={styles.testWrapper}>
      <motion.div className={styles.topBar} variants={fadeScale}>
        {isActive ? (
          <LiveStats
            mode={mode}
            isActive={isActive}
            wpm={liveStats.wpm}
            elapsedSec={elapsedSec}
            remainingTime={remainingTime}
            currentWordIndex={currentWordIndex}
            totalWords={mode === "words" ? words.length : 0}
          />
        ) : (
          <ModeBar
            mode={mode}
            modeValue={modeValue}
            typingLanguage={typingLanguage}
            onModeChange={onModeChange}
            onValueChange={onValueChange}
            onLanguageChange={onLanguageChange}
          />
        )}
      </motion.div>

      <motion.div className={styles.typingArea} variants={fadeSlideUp}>
        <TypingArea
          words={words}
          typedWords={typedWords}
          currentWordIndex={currentWordIndex}
        />
      </motion.div>
    </div>
  );
}

function CharBasedTest({
  mode,
  modeValue,
  typingLanguage,
  onFinish,
  onModeChange,
  onValueChange,
  onLanguageChange,
  resetRef,
}: BaseTestProps) {
  const { target, meta } = useMemo(() => {
    if (mode === "quote") {
      const lang = typingLanguage === "ru" ? "ru" : "en";
      const length = isContentLength(modeValue) ? modeValue : "medium";
      const quote = pickRandomQuote(lang, length);
      return {
        target: quote.text,
        meta: `— ${quote.source}`,
      };
    }
    const lang = isProgrammingLanguage(modeValue) ? modeValue : "javascript";
    const snippet = pickRandomSnippet(lang);
    return {
      target: snippet.code,
      meta: `${lang} · ${snippet.title}`,
    };
  }, [mode, modeValue, typingLanguage]);

  const { typed, position, isActive, liveStats, elapsedSec, reset } =
    useCharTyping({ target, onFinish });

  useEffect(() => {
    resetRef.current = reset;
  }, [reset, resetRef]);

  return (
    <div className={styles.testWrapper}>
      <motion.div className={styles.topBar} variants={fadeScale}>
        {isActive ? (
          <LiveStats
            mode={mode}
            isActive={isActive}
            wpm={liveStats.wpm}
            elapsedSec={elapsedSec}
            remainingTime={0}
            currentWordIndex={position}
            totalWords={target.length}
          />
        ) : (
          <ModeBar
            mode={mode}
            modeValue={modeValue}
            typingLanguage={typingLanguage}
            onModeChange={onModeChange}
            onValueChange={onValueChange}
            onLanguageChange={onLanguageChange}
          />
        )}
      </motion.div>

      <motion.div className={styles.typingArea} variants={fadeSlideUp}>
        <CharTypingArea
          target={target}
          typed={typed}
          variant={mode === "code" ? "code" : "quote"}
        />
        <p className={styles.meta}>{meta}</p>
      </motion.div>
    </div>
  );
}
