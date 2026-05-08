import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TypingTestResult } from "../../hooks/useTyping";
import type { KeyMistakes } from "../../utils/typing";
import { staggerContainer, fadeSlideUp } from "../../utils/motion";
import styles from "./Results.module.css";

interface ResultsProps {
  result: TypingTestResult;
  onRestart: () => void;
}

const KEYBOARD_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
  ["space", "enter"],
];

export function Results({ result, onRestart }: ResultsProps) {
  const {
    wpm,
    rawWpm,
    accuracy,
    consistency,
    correctChars,
    incorrectChars,
    extraChars,
    missedChars,
    testDurationSec,
    wpmHistory,
    keyMistakes,
  } = result;

  return (
    <motion.div
      className={styles.container}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div className={styles.primaryStats} variants={fadeSlideUp}>
        <div className={styles.primaryStat}>
          <span className={styles.primaryLabel}>wpm</span>
          <span className={styles.primaryValue}>{Math.round(wpm)}</span>
        </div>
        <div className={styles.primaryStat}>
          <span className={styles.primaryLabel}>acc</span>
          <span className={styles.primaryValue}>{Math.round(accuracy)}%</span>
        </div>
      </motion.div>

      <motion.div className={styles.chartWrapper} variants={fadeSlideUp}>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart
            data={wpmHistory}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="wpmGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="sec"
              tick={{ fill: "#5a5a6e", fontSize: 12 }}
              stroke="rgba(255,255,255,0.08)"
            />
            <YAxis
              tick={{ fill: "#5a5a6e", fontSize: 12 }}
              stroke="rgba(255,255,255,0.08)"
            />
            <Tooltip
              contentStyle={{
                background: "#1a1a23",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
              }}
              labelStyle={{ color: "#5a5a6e" }}
              itemStyle={{ color: "#e2e0dc" }}
              labelFormatter={(v) => `${v}s`}
              formatter={(value: number) => [Math.round(value), "wpm"]}
            />
            <Area
              type="monotone"
              dataKey="wpm"
              stroke="#7c3aed"
              strokeWidth={2}
              fill="url(#wpmGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div className={styles.keyboardPanel} variants={fadeSlideUp}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>problem keys</span>
          <span className={styles.panelHint}>
            darker red means more missed hits
          </span>
        </div>
        <KeyboardHeatmap mistakes={keyMistakes} />
      </motion.div>

      <motion.div className={styles.grid} variants={fadeSlideUp}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>raw wpm</span>
          <span className={styles.statValue}>{Math.round(rawWpm)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>consistency</span>
          <span className={styles.statValue}>{Math.round(consistency)}%</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>characters</span>
          <span className={styles.statValue}>
            <span className={styles.correctCount}>{correctChars}</span>
            <span className={styles.sep}>/</span>
            <span className={styles.incorrectCount}>{incorrectChars}</span>
            <span className={styles.sep}>/</span>
            <span className={styles.extraCount}>{extraChars}</span>
            <span className={styles.sep}>/</span>
            <span className={styles.missedCount}>{missedChars}</span>
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>time</span>
          <span className={styles.statValue}>{testDurationSec}s</span>
        </div>
      </motion.div>

      <motion.div className={styles.actions} variants={fadeSlideUp}>
        <button className={styles.restartBtn} onClick={onRestart}>
          next test
        </button>
      </motion.div>
    </motion.div>
  );
}

function KeyboardHeatmap({ mistakes }: { mistakes: KeyMistakes }) {
  const maxMistakes = Math.max(0, ...Object.values(mistakes));
  const knownKeys = new Set(KEYBOARD_ROWS.flat());
  const extraKeys = Object.keys(mistakes)
    .filter((key) => !knownKeys.has(key))
    .sort((a, b) => mistakes[b] - mistakes[a]);

  if (maxMistakes === 0) {
    return <p className={styles.noMistakes}>No problem keys this time.</p>;
  }

  return (
    <div className={styles.keyboard}>
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div className={styles.keyRow} key={rowIndex}>
          {row.map((key) => (
            <HeatKey
              key={key}
              label={key}
              count={mistakes[key] ?? 0}
              max={maxMistakes}
            />
          ))}
        </div>
      ))}
      {extraKeys.length > 0 ? (
        <div className={styles.keyRow}>
          {extraKeys.map((key) => (
            <HeatKey
              key={key}
              label={key}
              count={mistakes[key]}
              max={maxMistakes}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function HeatKey({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const intensity = max > 0 ? count / max : 0;
  const alpha = count > 0 ? 0.18 + intensity * 0.62 : 0;

  return (
    <div
      className={`${styles.key} ${label === "space" ? styles.spaceKey : ""}`}
      style={{
        backgroundColor:
          count > 0 ? `rgba(239, 68, 68, ${alpha.toFixed(2)})` : undefined,
        borderColor:
          count > 0
            ? `rgba(239, 68, 68, ${Math.min(0.9, alpha + 0.18)})`
            : undefined,
      }}
      title={count > 0 ? `${label}: ${count}` : label}
    >
      <span>{label}</span>
      {count > 0 ? <small>{count}</small> : null}
    </div>
  );
}
