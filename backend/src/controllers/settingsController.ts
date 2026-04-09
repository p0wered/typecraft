import type { Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { userSettings } from "../db/schema.js";
import type { AuthRequest } from "../middleware/auth.js";

const updateSettingsSchema = z.object({
  theme: z.enum(["dark", "light"]).optional(),
  language: z.enum(["ru", "en"]).optional(),
  fontSize: z.number().int().min(12).max(48).optional(),
  smoothCaret: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  customConfig: z.record(z.unknown()).optional(),
});

export function getSettings(req: AuthRequest, res: Response) {
  const settings = db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, req.userId!))
    .get();

  if (!settings) {
    res.status(404).json({ message: "Settings not found" });
    return;
  }

  res.json({
    ...settings,
    customConfig: JSON.parse(settings.customConfig),
  });
}

export function updateSettings(req: AuthRequest, res: Response) {
  const parsed = updateSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0].message });
    return;
  }

  const data = parsed.data;
  const update: Record<string, unknown> = {};

  if (data.theme !== undefined) update.theme = data.theme;
  if (data.language !== undefined) update.language = data.language;
  if (data.fontSize !== undefined) update.fontSize = data.fontSize;
  if (data.smoothCaret !== undefined) update.smoothCaret = data.smoothCaret;
  if (data.soundEnabled !== undefined) update.soundEnabled = data.soundEnabled;
  if (data.customConfig !== undefined)
    update.customConfig = JSON.stringify(data.customConfig);

  if (Object.keys(update).length === 0) {
    res.status(400).json({ message: "No fields to update" });
    return;
  }

  const updated = db
    .update(userSettings)
    .set(update)
    .where(eq(userSettings.userId, req.userId!))
    .returning()
    .get();

  res.json({
    ...updated,
    customConfig: JSON.parse(updated!.customConfig),
  });
}
