import type { TypingMode } from "@typecraft/shared";
import { useI18n, type TranslationKey } from "../../utils/i18n";
import styles from "./ModeBar.module.css";

type BuiltInTypingMode = Exclude<TypingMode, "custom">;

const MODES: {
  id: BuiltInTypingMode;
  labelKey: `mode.${BuiltInTypingMode}`;
}[] = [
  { id: "words", labelKey: "mode.words" },
  { id: "time", labelKey: "mode.time" },
  { id: "quote", labelKey: "mode.quote" },
  { id: "code", labelKey: "mode.code" },
];

const MODE_OPTIONS: Record<BuiltInTypingMode, string[]> = {
  words: ["10", "25", "50", "100"],
  time: ["15", "30", "60", "120"],
  quote: ["short", "medium", "long"],
  code: ["javascript", "typescript", "python", "go", "rust"],
};

const LANGUAGE_OPTIONS = ["en", "ru"] as const;
const OPTION_LABELS: Record<string, TranslationKey> = {
  short: "mode.short",
  medium: "mode.medium",
  long: "mode.long",
};

interface ModeBarProps {
  mode: TypingMode;
  modeValue: string;
  typingLanguage: string;
  onModeChange: (mode: TypingMode) => void;
  onValueChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
}

export function ModeBar({
  mode,
  modeValue,
  typingLanguage,
  onModeChange,
  onValueChange,
  onLanguageChange,
}: ModeBarProps) {
  const { t } = useI18n();
  const builtInMode: BuiltInTypingMode = mode === "custom" ? "words" : mode;
  const options = MODE_OPTIONS[builtInMode];
  const showLanguage = mode === "words" || mode === "time" || mode === "quote";

  return (
    <div className={styles.modeBar}>
      <div className={styles.group}>
        {MODES.map(({ id, labelKey }) => (
          <button
            key={id}
            className={`${styles.btn} ${mode === id ? styles.active : ""}`}
            onClick={() => onModeChange(id)}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>
      <span className={styles.separator} />
      <div className={styles.group}>
        {options.map((option) => (
          <button
            key={option}
            className={`${styles.btn} ${modeValue === option ? styles.active : ""}`}
            onClick={() => onValueChange(option)}
          >
            {builtInMode === "quote" && OPTION_LABELS[option]
              ? t(OPTION_LABELS[option])
              : option}
          </button>
        ))}
      </div>
      {showLanguage && (
        <>
          <span className={styles.separator} />
          <div className={styles.group}>
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang}
                className={`${styles.btn} ${typingLanguage === lang ? styles.active : ""}`}
                onClick={() => onLanguageChange(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
