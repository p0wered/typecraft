import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type {
  AdaptiveRecommendation,
  AdaptiveRecommendationRequest,
  CustomText,
  TypingMode,
} from "@typecraft/shared";
import { Link } from "react-router-dom";
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
import { adaptiveApi } from "../services/adaptive";
import { customTextsApi } from "../services/customTexts";
import { useI18n } from "../utils/i18n";
import {
  ephemeralCustomTextFromRecommendation,
  isAdaptiveChallengeCodeLike,
} from "../utils/adaptiveChallenge";
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
  const customText = useTypingStore((s) => s.customText);
  const setMode = useTypingStore((s) => s.setMode);
  const setModeValue = useTypingStore((s) => s.setModeValue);
  const setTypingLanguage = useTypingStore((s) => s.setTypingLanguage);
  const setCustomText = useTypingStore((s) => s.setCustomText);

  const addResult = useResultsStore((s) => s.addResult);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [finalResult, setFinalResult] = useState<TypingTestResult | null>(null);
  const [recommendation, setRecommendation] =
    useState<AdaptiveRecommendation | null>(null);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [isChallengeRegenerating, setIsChallengeRegenerating] = useState(false);
  const [isSavingChallenge, setIsSavingChallenge] = useState(false);
  const [adaptiveFeedback, setAdaptiveFeedback] = useState<string | null>(null);

  const resetRef = useRef<() => void>(() => {});
  const lastAdaptiveRequestRef = useRef<AdaptiveRecommendationRequest | null>(
    null,
  );

  const handleFinish = useCallback(
    (result: TypingTestResult) => {
      setFinalResult(result);
      setRecommendation(null);
      setAdaptiveFeedback(null);
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
      setIsRecommendationLoading(true);

      const sourceMaterialExcerpt =
        mode === "custom" && customText?.content
          ? customText.content.slice(0, 8000)
          : undefined;

      const adaptiveBody: AdaptiveRecommendationRequest = {
        recentResults: [
          {
            mode,
            modeValue,
            language: payload.language,
            wpm: result.wpm,
            accuracy: result.accuracy,
            consistency: result.consistency,
            keyMistakes: result.keyMistakes,
            createdAt: new Date().toISOString(),
          },
        ],
        currentSettings: { preferredLanguage: typingLanguage },
        availableModes: ["words", "time", "quote", "code"],
        sourceMaterialExcerpt,
      };

      lastAdaptiveRequestRef.current = adaptiveBody;

      adaptiveApi
        .recommendation(adaptiveBody)
        .then(setRecommendation)
        .catch((err) => {
          console.error("Failed to get adaptive recommendation:", err);
        })
        .finally(() => setIsRecommendationLoading(false));
    },
    [mode, modeValue, typingLanguage, customText, addResult, isAuthenticated],
  );

  const testKey = useMemo(
    () => `${mode}-${modeValue}-${typingLanguage}`,
    [mode, modeValue, typingLanguage],
  );

  const handleRestart = useCallback(() => {
    setFinalResult(null);
    setRecommendation(null);
    setAdaptiveFeedback(null);
    setIsChallengeRegenerating(false);
    setIsSavingChallenge(false);
    lastAdaptiveRequestRef.current = null;
    resetRef.current();
  }, []);

  const handleRegenerateChallenge = useCallback(() => {
    const base = lastAdaptiveRequestRef.current;
    if (!base || !recommendation?.generatedContent?.trim()) return;
    const priorContent = recommendation.generatedContent;
    setIsChallengeRegenerating(true);
    setAdaptiveFeedback(null);
    adaptiveApi
      .recommendation({
        ...base,
        regenerateFromContent: priorContent,
      })
      .then((next) => {
        setRecommendation((prev) => ({
          ...next,
          generatedContent: next.generatedContent ?? prev?.generatedContent,
        }));
      })
      .catch((err) => {
        console.error("Failed to regenerate adaptive challenge:", err);
        setAdaptiveFeedback(t("results.adaptiveSaveError"));
      })
      .finally(() => setIsChallengeRegenerating(false));
  }, [recommendation, t]);

  const handleSaveChallengeAsCustomText = useCallback(
    async (next: AdaptiveRecommendation) => {
      const content = next.generatedContent?.trim();
      if (!content) return;
      if (!isAuthenticated) {
        setAdaptiveFeedback(t("results.adaptiveNeedLogin"));
        return;
      }
      setAdaptiveFeedback(null);
      setIsSavingChallenge(true);

      const isCode = isAdaptiveChallengeCodeLike(next);

      try {
        await customTextsApi.create({
          title: next.title.slice(0, 200),
          content,
          contentType: isCode ? "code" : "text",
          language: next.language,
          isPublic: false,
        });
        setAdaptiveFeedback(t("results.adaptiveSaved"));
      } catch (error) {
        console.error("Failed to save adaptive challenge:", error);
        setAdaptiveFeedback(t("results.adaptiveSaveError"));
      } finally {
        setIsSavingChallenge(false);
      }
    },
    [isAuthenticated, t],
  );

  const handleStartRecommendation = useCallback(
    (next: AdaptiveRecommendation) => {
      setRecommendation(null);
      setFinalResult(null);
      setAdaptiveFeedback(null);
      const inline = next.generatedContent?.trim();
      if (inline) {
        setCustomText(ephemeralCustomTextFromRecommendation(next));
        return;
      }
      setCustomText(null);
      setMode(next.mode);
      setModeValue(next.modeValue);
      setTypingLanguage(next.language);
    },
    [setCustomText, setMode, setModeValue, setTypingLanguage],
  );

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

  const isCharMode = mode === "quote" || mode === "code" || mode === "custom";

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
            <Results
              result={finalResult}
              onRestart={handleRestart}
              recommendation={recommendation}
              isRecommendationLoading={isRecommendationLoading}
              onStartRecommendation={handleStartRecommendation}
              onRegenerateChallenge={
                recommendation?.generatedContent?.trim()
                  ? handleRegenerateChallenge
                  : undefined
              }
              isRegeneratingChallenge={isChallengeRegenerating}
              onSaveChallengeAsCustomText={handleSaveChallengeAsCustomText}
              isSavingChallenge={isSavingChallenge}
              adaptiveFeedback={adaptiveFeedback}
            />
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
            {mode === "custom" && !customText ? (
              <motion.div
                className={styles.customMissing}
                variants={fadeSlideUp}
              >
                <p>Select a custom text before starting this mode.</p>
                <Link to="/custom">open custom texts</Link>
              </motion.div>
            ) : isCharMode ? (
              <CharBasedTest
                key={testKey}
                mode={mode}
                modeValue={modeValue}
                typingLanguage={typingLanguage}
                customText={customText}
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
  customText?: CustomText | null;
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
  customText,
}: BaseTestProps) {
  const { target, meta } = useMemo(() => {
    if (mode === "custom" && customText) {
      return {
        target: customText.content,
        meta: `${customText.title} · ${customText.language}`,
      };
    }
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
  }, [mode, modeValue, typingLanguage, customText]);

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
          variant={
            mode === "code" || customText?.contentType === "code"
              ? "code"
              : "quote"
          }
        />
        <p className={styles.meta}>{meta}</p>
      </motion.div>
    </div>
  );
}
