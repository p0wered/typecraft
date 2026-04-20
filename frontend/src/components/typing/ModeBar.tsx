import type { TypingMode } from "@typecraft/shared";
import styles from "./ModeBar.module.css";

const MODES: { id: TypingMode; label: string }[] = [
  { id: "words", label: "words" },
  { id: "time", label: "time" },
  { id: "quote", label: "quote" },
  { id: "code", label: "code" },
];

const MODE_OPTIONS: Record<TypingMode, string[]> = {
  words: ["10", "25", "50", "100"],
  time: ["15", "30", "60", "120"],
  quote: ["short", "medium", "long"],
  code: ["javascript", "typescript", "python", "go", "rust"],
};

const LANGUAGE_OPTIONS = ["en", "ru"] as const;

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
  const options = MODE_OPTIONS[mode];
  const showLanguage = mode === "words" || mode === "time" || mode === "quote";

  return (
    <div className={styles.modeBar}>
      <div className={styles.group}>
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            className={`${styles.btn} ${mode === id ? styles.active : ""}`}
            onClick={() => onModeChange(id)}
          >
            {label}
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
            {option}
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
