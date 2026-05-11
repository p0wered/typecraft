import type { Response } from "express";
import { z } from "zod";
import { buildLocalAdaptiveRecommendation } from "../services/adaptiveRecommendation.js";
import { generateAiAdaptiveRecommendation } from "../services/aiProvider.js";
import type { AuthRequest } from "../middleware/auth.js";

const typingModeSchema = z.enum(["words", "time", "quote", "code", "custom"]);

const adaptiveRequestSchema = z.object({
  recentResults: z
    .array(
      z.object({
        mode: typingModeSchema,
        modeValue: z.string(),
        language: z.string(),
        wpm: z.number().min(0),
        accuracy: z.number().min(0).max(100),
        consistency: z.number().min(0).max(100),
        keyMistakes: z.record(z.number().int().min(0)).optional(),
        createdAt: z.string(),
      }),
    )
    .default([]),
  currentSettings: z
    .object({
      preferredLanguage: z.string().optional(),
      fontSize: z.number().optional(),
    })
    .optional(),
  availableModes: z.array(typingModeSchema).optional(),
  regenerateFromContent: z.string().max(4000).optional(),
  sourceMaterialExcerpt: z.string().max(12000).optional(),
});

export async function getAdaptiveRecommendation(
  req: AuthRequest,
  res: Response,
) {
  const parsed = adaptiveRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0].message });
    return;
  }

  const fallback = buildLocalAdaptiveRecommendation(parsed.data);

  try {
    const aiRecommendation = await generateAiAdaptiveRecommendation(
      parsed.data,
      fallback,
    );
    res.json(aiRecommendation ?? fallback);
  } catch (error) {
    console.error("Adaptive AI recommendation failed:", error);
    res.json(fallback);
  }
}
