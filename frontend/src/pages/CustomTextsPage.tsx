import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type {
  CustomText,
  CustomTextContentType,
  CreateCustomTextRequest,
} from "@typecraft/shared";
import { customTextsApi } from "../services/customTexts";
import { useAuthStore } from "../store/authStore";
import { useTypingStore } from "../store/typingStore";
import { useI18n } from "../utils/i18n";
import { fadeSlideUp, staggerContainer } from "../utils/motion";
import styles from "./CustomTextsPage.module.css";

const emptyForm: CreateCustomTextRequest = {
  title: "",
  content: "",
  contentType: "text",
  language: "en",
  isPublic: false,
};

const LAST_USED_STORAGE_KEY = "typecraft-custom-text-last-used";
const MAX_IMPORT_CHARS = 20000;

type TypeFilter = "all" | CustomTextContentType;
type SortMode = "lastUsed" | "updated" | "title";

const codeExtensions: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  go: "go",
  rs: "rust",
  json: "json",
};

function loadLastUsed(): Record<string, string> {
  try {
    return JSON.parse(
      localStorage.getItem(LAST_USED_STORAGE_KEY) ?? "{}",
    ) as Record<string, string>;
  } catch {
    return {};
  }
}

function getEstimatedDuration(content: string) {
  const estimatedWords = Math.max(1, Math.ceil(content.length / 5));
  const seconds = Math.max(1, Math.round((estimatedWords / 40) * 60));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function getTitleFromFileName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "").slice(0, 120);
}

export function CustomTextsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setCustomText = useTypingStore((s) => s.setCustomText);
  const [customTexts, setCustomTexts] = useState<CustomText[]>([]);
  const [form, setForm] = useState<CreateCustomTextRequest>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("lastUsed");
  const [lastUsed, setLastUsed] = useState<Record<string, string>>(() =>
    loadLastUsed(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredTexts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customTexts
      .filter((item) => {
        if (typeFilter !== "all" && item.contentType !== typeFilter) {
          return false;
        }
        if (!query) return true;
        return (
          item.title.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (sortMode === "title") return a.title.localeCompare(b.title);
        if (sortMode === "lastUsed") {
          const aUsed = lastUsed[String(a.id)] ?? "";
          const bUsed = lastUsed[String(b.id)] ?? "";
          if (aUsed || bUsed) return bUsed.localeCompare(aUsed);
        }
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [customTexts, lastUsed, search, sortMode, typeFilter]);

  const lastUsedText = useMemo(() => {
    const [lastId] = Object.entries(lastUsed).sort((a, b) =>
      b[1].localeCompare(a[1]),
    )[0] ?? [null];
    return lastId
      ? (customTexts.find((item) => String(item.id) === lastId) ?? null)
      : null;
  }, [customTexts, lastUsed]);

  const loadCustomTexts = useCallback(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    customTextsApi
      .list({ limit: 100 })
      .then((data) => setCustomTexts(data.customTexts))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load texts"),
      )
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    loadCustomTexts();
  }, [loadCustomTexts]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const handleEdit = (customText: CustomText) => {
    setEditingId(customText.id);
    setForm({
      title: customText.title,
      content: customText.content,
      contentType: customText.contentType,
      language: customText.language,
      isPublic: customText.isPublic,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (form.title.trim().length === 0 || form.content.length < 20) {
      setError(t("custom.validation"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const updated = await customTextsApi.update(editingId, form);
        setCustomTexts((items) =>
          items.map((item) => (item.id === updated.id ? updated : item)),
        );
      } else {
        const created = await customTextsApi.create(form);
        setCustomTexts((items) => [created, ...items]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save text");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this custom text?")) return;
    setError(null);
    try {
      await customTextsApi.delete(id);
      setCustomTexts((items) => items.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete text");
    }
  };

  const handleDuplicate = async (customText: CustomText) => {
    setError(null);
    try {
      const created = await customTextsApi.create({
        title: `${customText.title} copy`.slice(0, 120),
        content: customText.content,
        contentType: customText.contentType,
        language: customText.language,
        isPublic: customText.isPublic,
      });
      setCustomTexts((items) => [created, ...items]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate text");
    }
  };

  const handleFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    const content = await file.text();
    if (content.length > MAX_IMPORT_CHARS) {
      setError(t("custom.importTooLarge"));
      return;
    }

    const extension = getFileExtension(file.name);
    const language =
      codeExtensions[extension] ?? (extension === "md" ? "markdown" : "en");
    const contentType: CustomTextContentType =
      codeExtensions[extension] !== undefined ? "code" : "text";

    setEditingId(null);
    setForm({
      title: getTitleFromFileName(file.name),
      content,
      contentType,
      language,
      isPublic: false,
    });
  };

  const handleStart = (customText: CustomText) => {
    const nextLastUsed = {
      ...lastUsed,
      [String(customText.id)]: new Date().toISOString(),
    };
    setLastUsed(nextLastUsed);
    localStorage.setItem(LAST_USED_STORAGE_KEY, JSON.stringify(nextLastUsed));
    setCustomText(customText);
    navigate("/");
  };

  return (
    <motion.div
      className={styles.container}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div className={styles.header} variants={fadeSlideUp}>
        <h1>{t("custom.title")}</h1>
        <p>{t("custom.subtitle")}</p>
      </motion.div>

      {!isAuthenticated ? (
        <motion.div className={styles.card} variants={fadeSlideUp}>
          <p className={styles.loginText}>
            <Link to="/login">{t("custom.loginText")}</Link>
          </p>
        </motion.div>
      ) : (
        <>
          <motion.form
            className={styles.formCard}
            variants={fadeSlideUp}
            onSubmit={handleSubmit}
          >
            <div className={styles.formHeader}>
              <h2>
                {editingId ? t("custom.editTitle") : t("custom.newTitle")}
              </h2>
              <div className={styles.formHeaderActions}>
                <label className={styles.importBtn}>
                  {t("custom.importFile")}
                  <input
                    type="file"
                    accept=".txt,.md,.js,.jsx,.ts,.tsx,.py,.go,.rs,.json"
                    onChange={handleFileImport}
                  />
                </label>
                {editingId ? (
                  <button type="button" onClick={resetForm}>
                    {t("custom.cancel")}
                  </button>
                ) : null}
              </div>
            </div>

            <label>
              {t("custom.titleLabel")}
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                maxLength={120}
              />
            </label>

            <div className={styles.formGrid}>
              <label>
                {t("custom.languageLabel")}
                <input
                  value={form.language}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      language: event.target.value,
                    }))
                  }
                  maxLength={40}
                />
              </label>
              <label>
                {t("custom.typeLabel")}
                <select
                  value={form.contentType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contentType: event.target.value as CustomTextContentType,
                    }))
                  }
                >
                  <option value="text">{t("custom.textType")}</option>
                  <option value="code">{t("custom.codeType")}</option>
                </select>
              </label>
            </div>

            <label>
              {t("custom.contentLabel")}
              <span className={styles.contentMeta}>
                {form.content.length} chars · ~
                {getEstimatedDuration(form.content)}
              </span>
              <textarea
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                rows={10}
              />
            </label>

            {error ? <div className={styles.error}>{error}</div> : null}

            <button
              className={styles.submitBtn}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "..."
                : editingId
                  ? t("custom.save")
                  : t("custom.create")}
            </button>
          </motion.form>

          <motion.section className={styles.listCard} variants={fadeSlideUp}>
            {lastUsedText ? (
              <div className={styles.quickStart}>
                <div>
                  <span>{t("custom.lastUsed")}</span>
                  <strong>{lastUsedText.title}</strong>
                </div>
                <button type="button" onClick={() => handleStart(lastUsedText)}>
                  {t("custom.quickStart")}
                </button>
              </div>
            ) : null}

            <div className={styles.listHeader}>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("custom.search")}
              />
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as TypeFilter)
                }
              >
                <option value="all">{t("custom.allTypes")}</option>
                <option value="text">{t("custom.textType")}</option>
                <option value="code">{t("custom.codeType")}</option>
              </select>
              <select
                value={sortMode}
                onChange={(event) =>
                  setSortMode(event.target.value as SortMode)
                }
              >
                <option value="lastUsed">{t("custom.sortLastUsed")}</option>
                <option value="updated">{t("custom.sortUpdated")}</option>
                <option value="title">{t("custom.sortTitle")}</option>
              </select>
            </div>

            {isLoading ? (
              <p className={styles.empty}>{t("custom.loading")}</p>
            ) : filteredTexts.length === 0 ? (
              <p className={styles.empty}>{t("custom.empty")}</p>
            ) : (
              <div className={styles.list}>
                {filteredTexts.map((customText) => (
                  <article className={styles.item} key={customText.id}>
                    <div className={styles.itemMain}>
                      <span className={styles.itemTitle}>
                        {customText.title}
                      </span>
                      <span className={styles.itemMeta}>
                        {customText.contentType} · {customText.language} ·{" "}
                        {customText.content.length} chars · ~
                        {getEstimatedDuration(customText.content)}
                      </span>
                      <p>{customText.content.slice(0, 180)}</p>
                    </div>
                    <div className={styles.itemActions}>
                      <button
                        onClick={() => handleStart(customText)}
                        type="button"
                      >
                        {t("custom.start")}
                      </button>
                      <button
                        onClick={() => handleEdit(customText)}
                        type="button"
                      >
                        {t("custom.edit")}
                      </button>
                      <button
                        onClick={() => handleDuplicate(customText)}
                        type="button"
                      >
                        {t("custom.duplicate")}
                      </button>
                      <button
                        onClick={() => handleDelete(customText.id)}
                        type="button"
                      >
                        {t("custom.delete")}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </motion.section>
        </>
      )}
    </motion.div>
  );
}
