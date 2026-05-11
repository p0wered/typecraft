import type { Response } from "express";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { customTexts } from "../db/schema.js";
import type { AuthRequest } from "../middleware/auth.js";

const contentTypeSchema = z.enum(["text", "code"]);

const createCustomTextSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().min(20).max(20000),
  contentType: contentTypeSchema,
  language: z.string().trim().min(1).max(40),
  isPublic: z.boolean().optional().default(false),
});

const updateCustomTextSchema = createCustomTextSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update",
  });

function parsePagination(req: AuthRequest) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  return { page, limit };
}

export function createCustomText(req: AuthRequest, res: Response) {
  const parsed = createCustomTextSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0].message });
    return;
  }

  const created = db
    .insert(customTexts)
    .values({ userId: req.userId!, ...parsed.data })
    .returning()
    .get();

  res.status(201).json(created);
}

export function listCustomTexts(req: AuthRequest, res: Response) {
  const { page, limit } = parsePagination(req);
  const contentType = req.query.contentType as string | undefined;
  const language = req.query.language as string | undefined;
  const search = (req.query.search as string | undefined)?.trim();

  const conditions = [eq(customTexts.userId, req.userId!)];
  if (contentType) {
    conditions.push(eq(customTexts.contentType, contentType));
  }
  if (language) {
    conditions.push(eq(customTexts.language, language));
  }
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(like(customTexts.title, pattern), like(customTexts.content, pattern))!,
    );
  }

  const rows = db
    .select()
    .from(customTexts)
    .where(and(...conditions))
    .orderBy(desc(customTexts.updatedAt))
    .limit(limit)
    .offset((page - 1) * limit)
    .all();

  res.json({ customTexts: rows, page, limit });
}

export function getCustomText(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(404).json({ message: "Custom text not found" });
    return;
  }

  const row = db
    .select()
    .from(customTexts)
    .where(and(eq(customTexts.id, id), eq(customTexts.userId, req.userId!)))
    .get();

  if (!row) {
    res.status(404).json({ message: "Custom text not found" });
    return;
  }

  res.json(row);
}

export function updateCustomText(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(404).json({ message: "Custom text not found" });
    return;
  }

  const parsed = updateCustomTextSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0].message });
    return;
  }

  const updated = db
    .update(customTexts)
    .set({ ...parsed.data, updatedAt: sql`datetime('now')` })
    .where(and(eq(customTexts.id, id), eq(customTexts.userId, req.userId!)))
    .returning()
    .get();

  if (!updated) {
    res.status(404).json({ message: "Custom text not found" });
    return;
  }

  res.json(updated);
}

export function deleteCustomText(req: AuthRequest, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(404).json({ message: "Custom text not found" });
    return;
  }

  const deleted = db
    .delete(customTexts)
    .where(and(eq(customTexts.id, id), eq(customTexts.userId, req.userId!)))
    .returning({ id: customTexts.id })
    .get();

  if (!deleted) {
    res.status(404).json({ message: "Custom text not found" });
    return;
  }

  res.status(204).send();
}
