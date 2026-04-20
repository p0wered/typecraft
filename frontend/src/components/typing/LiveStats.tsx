import { motion, AnimatePresence } from "framer-motion";
import type { TypingMode } from "@typecraft/shared";
import styles from "./LiveStats.module.css";

interface LiveStatsProps {
  mode: TypingMode;
  isActive: boolean;
  wpm: number;
  elapsedSec: number;
  remainingTime: number;
  currentWordIndex: number;
  totalWords: number;
}

export function LiveStats({
  mode,
  isActive,
  wpm,
  remainingTime,
  currentWordIndex,
  totalWords,
}: LiveStatsProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className={styles.container}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {mode === "time" ? (
            <span className={styles.primary}>
              {Math.ceil(remainingTime)}
            </span>
          ) : (
            <span className={styles.primary}>
              {currentWordIndex} / {totalWords}
            </span>
          )}
          <span className={styles.secondary}>{Math.round(wpm)} wpm</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
