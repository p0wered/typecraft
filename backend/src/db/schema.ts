import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const results = sqliteTable("results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mode: text("mode").notNull(),
  modeValue: text("mode_value").notNull(),
  language: text("language").notNull(),
  wpm: real("wpm").notNull(),
  rawWpm: real("raw_wpm").notNull(),
  accuracy: real("accuracy").notNull(),
  consistency: real("consistency").notNull(),
  correctChars: integer("correct_chars").notNull(),
  incorrectChars: integer("incorrect_chars").notNull(),
  extraChars: integer("extra_chars").notNull(),
  missedChars: integer("missed_chars").notNull(),
  testDurationSec: integer("test_duration_sec").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const userSettings = sqliteTable("user_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default("dark"),
  language: text("language").notNull().default("en"),
  fontSize: integer("font_size").notNull().default(24),
  smoothCaret: integer("smooth_caret", { mode: "boolean" })
    .notNull()
    .default(true),
  soundEnabled: integer("sound_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  customConfig: text("custom_config").notNull().default("{}"),
});
