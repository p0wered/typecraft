import "dotenv/config";

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import resultsRoutes from "./routes/results.js";
import settingsRoutes from "./routes/settings.js";
import customTextsRoutes from "./routes/customTexts.js";
import adaptiveRoutes from "./routes/adaptive.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { db } from "./db/index.js";
import { sql } from "drizzle-orm";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/custom-texts", customTextsRoutes);
app.use("/api/adaptive", adaptiveRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

function ensureTables() {
  db.run(
    sql.raw(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`),
  );

  db.run(
    sql.raw(`CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL,
    mode_value TEXT NOT NULL,
    language TEXT NOT NULL,
    wpm REAL NOT NULL,
    raw_wpm REAL NOT NULL,
    accuracy REAL NOT NULL,
    consistency REAL NOT NULL,
    correct_chars INTEGER NOT NULL,
    incorrect_chars INTEGER NOT NULL,
    extra_chars INTEGER NOT NULL,
    missed_chars INTEGER NOT NULL,
    test_duration_sec INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`),
  );

  db.run(
    sql.raw(`CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'midnight',
    language TEXT NOT NULL DEFAULT 'en',
    font_size INTEGER NOT NULL DEFAULT 24,
    smooth_caret INTEGER NOT NULL DEFAULT 1,
    sound_enabled INTEGER NOT NULL DEFAULT 0,
    custom_config TEXT NOT NULL DEFAULT '{}'
  )`),
  );

  db.run(
    sql.raw(`CREATE TABLE IF NOT EXISTS custom_texts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL,
    language TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`),
  );
}

ensureTables();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
