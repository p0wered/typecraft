import type { Response } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { results } from "../db/schema.js";
import type { AuthRequest } from "../middleware/auth.js";

const createResultSchema = z.object({
  mode: z.enum(["words", "time", "quote", "code"]),
  modeValue: z.string(),
  language: z.string(),
  wpm: z.number().min(0),
  rawWpm: z.number().min(0),
  accuracy: z.number().min(0).max(100),
  consistency: z.number().min(0).max(100),
  correctChars: z.number().int().min(0),
  incorrectChars: z.number().int().min(0),
  extraChars: z.number().int().min(0),
  missedChars: z.number().int().min(0),
  testDurationSec: z.number().int().min(1),
});

export function createResult(req: AuthRequest, res: Response) {
  const parsed = createResultSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0].message });
    return;
  }

  const result = db
    .insert(results)
    .values({ userId: req.userId!, ...parsed.data })
    .returning()
    .get();

  res.status(201).json(result);
}

export function getResults(req: AuthRequest, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const mode = req.query.mode as string | undefined;

  const conditions = [eq(results.userId, req.userId!)];
  if (mode) {
    conditions.push(eq(results.mode, mode));
  }

  const rows = db
    .select()
    .from(results)
    .where(and(...conditions))
    .orderBy(desc(results.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)
    .all();

  res.json({ results: rows, page, limit });
}

export function getStats(req: AuthRequest, res: Response) {
  const row = db
    .select({
      totalTests: sql<number>`count(*)`,
      averageWpm: sql<number>`round(avg(${results.wpm}), 1)`,
      averageAccuracy: sql<number>`round(avg(${results.accuracy}), 1)`,
      totalTimeTypedSec: sql<number>`coalesce(sum(${results.testDurationSec}), 0)`,
      bestWpm: sql<number>`coalesce(max(${results.wpm}), 0)`,
    })
    .from(results)
    .where(eq(results.userId, req.userId!))
    .get();

  const last10 = db
    .select({ wpm: results.wpm })
    .from(results)
    .where(eq(results.userId, req.userId!))
    .orderBy(desc(results.createdAt))
    .limit(10)
    .all();

  const last10Avg =
    last10.length > 0
      ? Math.round(
          (last10.reduce((sum, r) => sum + r.wpm, 0) / last10.length) * 10,
        ) / 10
      : 0;

  res.json({ ...row, last10AverageWpm: last10Avg });
}

export function getPersonalBest(req: AuthRequest, res: Response) {
  const modes = ["words", "time", "quote", "code"] as const;
  const personalBests = [];

  for (const mode of modes) {
    const best = db
      .select()
      .from(results)
      .where(and(eq(results.userId, req.userId!), eq(results.mode, mode)))
      .orderBy(desc(results.wpm))
      .limit(1)
      .get();

    if (best) {
      personalBests.push({
        mode: best.mode,
        modeValue: best.modeValue,
        language: best.language,
        wpm: best.wpm,
        accuracy: best.accuracy,
        createdAt: best.createdAt,
      });
    }
  }

  res.json(personalBests);
}
