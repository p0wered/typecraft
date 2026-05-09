import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import type {
  AggregatedStats,
  PersonalBest,
  ProgressPoint,
  TypingMode,
  TypingResult,
} from "@typecraft/shared";
import { useAuthStore } from "../store/authStore";
import { resultsApi } from "../services/results";
import { useI18n } from "../utils/i18n";
import { staggerContainer, fadeSlideUp } from "../utils/motion";
import styles from "./ProfilePage.module.css";

const HISTORY_LIMIT = 12;

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Could not load profile data";
}

export function ProfilePage() {
  const { language, t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([]);
  const [history, setHistory] = useState<TypingResult[]>([]);
  const [selectedMode, setSelectedMode] = useState<TypingMode | "">("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const locale = language === "ru" ? "ru" : "en";
  const modeOptions: Array<{ value: TypingMode | ""; label: string }> = [
    { value: "", label: t("profile.allModes") },
    { value: "words", label: t("mode.words") },
    { value: "time", label: t("mode.time") },
    { value: "quote", label: t("mode.quote") },
    { value: "code", label: t("mode.code") },
    { value: "custom", label: t("mode.custom") },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      resultsApi.stats(),
      resultsApi.progress(30),
      resultsApi.personalBest(),
    ])
      .then(([statsData, progressData, bestsData]) => {
        if (!cancelled) {
          setStats(statsData);
          setProgress(progressData);
          setPersonalBests(bestsData);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    setPage(1);
  }, [selectedMode, languageFilter]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let cancelled = false;
    setIsHistoryLoading(true);
    setHistoryError(null);

    resultsApi
      .list({
        page,
        limit: HISTORY_LIMIT,
        mode: selectedMode || undefined,
        language: languageFilter.trim() || undefined,
      })
      .then((data) => {
        if (!cancelled) {
          setHistory(data.results);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setHistoryError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsHistoryLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, page, selectedMode, languageFilter]);

  const chartData = useMemo(
    () =>
      progress.map((point, index) => ({
        ...point,
        label: `${index + 1}`,
        wpm: Math.round(point.wpm),
        accuracy: Math.round(point.accuracy),
      })),
    [progress],
  );

  return (
    <motion.div
      className={styles.container}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.h1 className={styles.title} variants={fadeSlideUp}>
        {isAuthenticated && user ? user.username : t("profile.title")}
      </motion.h1>

      {!isAuthenticated || !user ? (
        <motion.div className={styles.card} variants={fadeSlideUp}>
          <p className={styles.cardText}>
            <Link to="/login" className={styles.accent}>
              {t("profile.loginCta")}
            </Link>{" "}
            {t("profile.loginText")}
          </p>
        </motion.div>
      ) : (
        <>
          <motion.section className={styles.hero} variants={fadeSlideUp}>
            <div>
              <span className={styles.eyebrow}>{t("profile.signedInAs")}</span>
              <p className={styles.email}>{user.email}</p>
            </div>
            <div className={styles.heroStats}>
              <div>
                <span className={styles.metricValue}>
                  {stats?.totalTests ?? 0}
                </span>
                <span className={styles.metricLabel}>{t("profile.tests")}</span>
              </div>
              <div>
                <span className={styles.metricValue}>
                  {Math.round(stats?.bestWpm ?? 0)}
                </span>
                <span className={styles.metricLabel}>
                  {t("profile.bestWpm")}
                </span>
              </div>
            </div>
          </motion.section>

          {error ? (
            <motion.div className={styles.error} variants={fadeSlideUp}>
              {error}
            </motion.div>
          ) : null}

          <motion.section className={styles.statsGrid} variants={fadeSlideUp}>
            <StatCard
              label={t("profile.averageWpm")}
              value={stats ? Math.round(stats.averageWpm) : "0"}
              loading={isLoading}
            />
            <StatCard
              label={t("profile.last10")}
              value={stats ? Math.round(stats.last10AverageWpm) : "0"}
              loading={isLoading}
            />
            <StatCard
              label={t("profile.accuracy")}
              value={`${Math.round(stats?.averageAccuracy ?? 0)}%`}
              loading={isLoading}
            />
            <StatCard
              label={t("profile.timeTyped")}
              value={formatDuration(stats?.totalTimeTypedSec ?? 0)}
              loading={isLoading}
            />
          </motion.section>

          <motion.section className={styles.panel} variants={fadeSlideUp}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>{t("profile.progress")}</h2>
                <p>
                  {chartData.length || 0} {t("profile.savedTests")}
                </p>
              </div>
            </div>
            {chartData.length > 0 ? (
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="profileWpmGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#7c3aed"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="#7c3aed"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="label"
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
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.createdAt
                          ? formatDate(payload[0].payload.createdAt, locale)
                          : "test"
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="wpm"
                      name="wpm"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      fill="url(#profileWpmGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="accuracy"
                      name="accuracy"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text={t("profile.noProgress")} />
            )}
          </motion.section>

          <motion.section className={styles.panel} variants={fadeSlideUp}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>{t("profile.bests")}</h2>
                <p>{t("profile.bestsHelp")}</p>
              </div>
            </div>
            {personalBests.length > 0 ? (
              <div className={styles.bestsGrid}>
                {personalBests.map((best) => (
                  <div className={styles.bestCard} key={best.mode}>
                    <span className={styles.bestMode}>
                      {t(`mode.${best.mode}`)}
                    </span>
                    <span className={styles.bestWpm}>
                      {Math.round(best.wpm)}
                    </span>
                    <span className={styles.bestMeta}>
                      {Math.round(best.accuracy)}% acc · {best.language}
                    </span>
                    <span className={styles.bestDate}>
                      {formatDate(best.createdAt, locale)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text={t("profile.noBests")} />
            )}
          </motion.section>

          <motion.section className={styles.panel} variants={fadeSlideUp}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>{t("profile.history")}</h2>
                <p>{t("profile.historyHelp")}</p>
              </div>
              <div className={styles.filters}>
                <select
                  value={selectedMode}
                  onChange={(event) =>
                    setSelectedMode(event.target.value as TypingMode | "")
                  }
                >
                  {modeOptions.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  value={languageFilter}
                  onChange={(event) => setLanguageFilter(event.target.value)}
                  placeholder={t("profile.languagePlaceholder")}
                />
              </div>
            </div>
            {historyError ? (
              <div className={styles.error}>{historyError}</div>
            ) : null}
            {history.length > 0 ? (
              <>
                <div className={styles.historyList}>
                  {history.map((item) => (
                    <article className={styles.historyItem} key={item.id}>
                      <div>
                        <span className={styles.historyMode}>
                          {t(`mode.${item.mode}`)}
                        </span>
                        <span className={styles.historyMeta}>
                          {item.language} · {item.modeValue}
                        </span>
                      </div>
                      <div className={styles.historyStats}>
                        <span>{Math.round(item.wpm)} wpm</span>
                        <span>{Math.round(item.accuracy)}% acc</span>
                        <span>{formatDate(item.createdAt, locale)}</span>
                      </div>
                    </article>
                  ))}
                </div>
                <div className={styles.pagination}>
                  <button
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    disabled={page === 1 || isHistoryLoading}
                  >
                    {t("profile.newer")}
                  </button>
                  <span>
                    {t("profile.page")} {page}
                  </span>
                  <button
                    onClick={() => setPage((current) => current + 1)}
                    disabled={
                      history.length < HISTORY_LIMIT || isHistoryLoading
                    }
                  >
                    {t("profile.older")}
                  </button>
                </div>
              </>
            ) : (
              <EmptyState
                text={
                  isHistoryLoading
                    ? t("profile.loadingHistory")
                    : t("profile.noHistory")
                }
              />
            )}
          </motion.section>
        </>
      )}
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | number;
  loading: boolean;
}) {
  return (
    <div className={styles.statCard}>
      <span className={styles.metricValue}>{loading ? "..." : value}</span>
      <span className={styles.metricLabel}>{label}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className={styles.empty}>{text}</p>;
}
