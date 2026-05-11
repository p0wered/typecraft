import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LeaderboardEntry, LeaderboardQuery } from "@typecraft/shared";
import { leaderboardsApi } from "../services/leaderboards";
import { useI18n } from "../utils/i18n";
import { fadeSlideUp, staggerContainer } from "../utils/motion";
import styles from "./LeaderboardsPage.module.css";

type LeaderboardMode = "words" | "time" | "quote" | "code";

const MODE_VALUES: Record<LeaderboardMode, string[]> = {
  words: ["10", "25", "50", "100"],
  time: ["15", "30", "60", "120"],
  quote: ["short", "medium", "long"],
  code: ["typescript", "javascript", "python"],
};

const LANGUAGES = ["en", "ru", "de", "fr", "es"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

type FilterState = {
  mode: LeaderboardMode;
  modeValue: string;
  language: string;
};

export function LeaderboardsPage() {
  const { t } = useI18n();

  const [filter, setFilter] = useState<FilterState>({
    mode: "time",
    modeValue: "60",
    language: "en",
  });

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [weekStartsAt, setWeekStartsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { mode, modeValue, language } = filter;

  function handleModeChange(newMode: LeaderboardMode) {
    setFilter({ mode: newMode, modeValue: MODE_VALUES[newMode][0], language });
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const query: LeaderboardQuery = { mode, limit: 50 };
    if (modeValue) query.modeValue = modeValue;
    if (language) query.language = language;

    leaderboardsApi
      .weekly(query)
      .then((data) => {
        if (cancelled) return;
        setEntries(data.entries);
        setWeekStartsAt(data.weekStartsAt);
      })
      .catch(() => {
        if (!cancelled) setError("load_error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, modeValue, language]);

  const modeValues = MODE_VALUES[mode];

  return (
    <motion.div
      className={styles.container}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div className={styles.header} variants={fadeSlideUp}>
        <h1>{t("lb.title")}</h1>
        <p>{t("lb.subtitle")}</p>
        {weekStartsAt && (
          <span className={styles.weekLabel}>
            {t("lb.weekOf")} {formatDate(weekStartsAt)}
          </span>
        )}
      </motion.div>

      <motion.div className={styles.filters} variants={fadeSlideUp}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>{t("lb.mode")}</label>
          <div className={styles.pills}>
            {(["words", "time", "quote", "code"] as LeaderboardMode[]).map(
              (m) => (
                <button
                  key={m}
                  className={`${styles.pill} ${mode === m ? styles.pillActive : ""}`}
                  onClick={() => handleModeChange(m)}
                >
                  {t(`mode.${m}` as Parameters<typeof t>[0])}
                </button>
              ),
            )}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>{t("lb.value")}</label>
          <div className={styles.pills}>
            {modeValues.map((v) => (
              <button
                key={v}
                className={`${styles.pill} ${modeValue === v ? styles.pillActive : ""}`}
                onClick={() => setFilter((f) => ({ ...f, modeValue: v }))}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>{t("lb.language")}</label>
          <div className={styles.pills}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                className={`${styles.pill} ${language === lang ? styles.pillActive : ""}`}
                onClick={() => setFilter((f) => ({ ...f, language: lang }))}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div className={styles.tableCard} variants={fadeSlideUp}>
        {loading && entries.length === 0 && (
          <p className={styles.state}>{t("lb.loading")}</p>
        )}
        {!loading && error && (
          <p className={styles.stateError}>{t("lb.error")}</p>
        )}

        {!loading && !error && entries.length === 0 && (
          <p className={styles.state}>{t("lb.empty")}</p>
        )}

        {entries.length > 0 && (
          <div className={`${styles.tableWrapper} ${loading ? styles.tableRefreshing : ""}`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thRank}>#</th>
                  <th className={styles.thUser}>{t("lb.colUser")}</th>
                  <th>{t("lb.colWpm")}</th>
                  <th>{t("lb.colAccuracy")}</th>
                  <th>{t("lb.colConsistency")}</th>
                  <th>{t("lb.colScore")}</th>
                  <th className={styles.thDate}>{t("lb.colDate")}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={`${entry.userId}-${entry.createdAt}`} className={styles.row}>
                    <td className={styles.tdRank}>
                      {entry.rank <= 3 ? (
                        <span className={styles[`medal${entry.rank}` as keyof typeof styles]}>
                          {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                        </span>
                      ) : (
                        entry.rank
                      )}
                    </td>
                    <td className={styles.tdUser}>{entry.username}</td>
                    <td className={styles.tdWpm}>{entry.wpm}</td>
                    <td>{entry.accuracy}%</td>
                    <td>{entry.consistency}%</td>
                    <td className={styles.tdScore}>{entry.score}</td>
                    <td className={styles.tdDate}>{formatDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
