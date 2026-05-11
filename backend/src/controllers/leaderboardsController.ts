import type { Response } from "express";
import { z } from "zod";
import { rawSqlite } from "../db/index.js";
import type { AuthRequest } from "../middleware/auth.js";
import type { LeaderboardEntry, WeeklyLeaderboardResponse } from "@typecraft/shared";

const weeklyQuerySchema = z.object({
  mode: z.enum(["words", "time", "quote", "code"]),
  modeValue: z.string().optional(),
  language: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

function getWeekBoundaries() {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sunday
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - daysSinceMonday);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);
  return { weekStart, weekEnd };
}

export function getWeeklyLeaderboard(req: AuthRequest, res: Response) {
  const parsed = weeklyQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0].message });
    return;
  }

  const { mode, modeValue, language, limit } = parsed.data;
  const { weekStart, weekEnd } = getWeekBoundaries();
  const weekStartStr = weekStart.toISOString().replace("T", " ").substring(0, 19);

  const whereParts = [
    `r.created_at >= ?`,
    `r.accuracy >= 90`,
    `r.test_duration_sec >= 10`,
    `r.mode = ?`,
  ];
  const params: (string | number)[] = [weekStartStr, mode];

  if (modeValue) {
    whereParts.push(`r.mode_value = ?`);
    params.push(modeValue);
  }
  if (language) {
    whereParts.push(`r.language = ?`);
    params.push(language);
  }

  params.push(limit);

  const whereClause = whereParts.join(" AND ");

  const query = `
    WITH scored AS (
      SELECT
        r.user_id,
        r.mode,
        r.mode_value,
        r.language,
        r.wpm,
        r.accuracy,
        r.consistency,
        r.created_at,
        r.wpm * (r.accuracy / 100.0) * (r.accuracy / 100.0) AS score,
        ROW_NUMBER() OVER (
          PARTITION BY r.user_id
          ORDER BY r.wpm * (r.accuracy / 100.0) * (r.accuracy / 100.0) DESC
        ) AS rn
      FROM results r
      WHERE ${whereClause}
    )
    SELECT
      ROW_NUMBER() OVER (ORDER BY s.score DESC) AS rank,
      s.user_id AS userId,
      u.username,
      s.mode,
      s.mode_value AS modeValue,
      s.language,
      ROUND(s.wpm, 1) AS wpm,
      ROUND(s.accuracy, 1) AS accuracy,
      ROUND(s.consistency, 1) AS consistency,
      ROUND(s.score, 1) AS score,
      s.created_at AS createdAt
    FROM scored s
    JOIN users u ON u.id = s.user_id
    WHERE s.rn = 1
    ORDER BY s.score DESC
    LIMIT ?
  `;

  const entries = rawSqlite.prepare(query).all(...params) as LeaderboardEntry[];

  const response: WeeklyLeaderboardResponse = {
    entries,
    weekStartsAt: weekStart.toISOString(),
    weekEndsAt: weekEnd.toISOString(),
  };

  res.json(response);
}
