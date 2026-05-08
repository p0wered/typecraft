import { motion } from "framer-motion";
import type { InterfaceLanguage, Theme } from "@typecraft/shared";
import { useAuthStore } from "../store/authStore";
import { useSettingsStore } from "../store/settingsStore";
import { useI18n, type TranslationKey } from "../utils/i18n";
import { staggerContainer, fadeSlideUp } from "../utils/motion";
import styles from "./SettingsPage.module.css";

const PALETTES: Array<{
  value: Theme;
  labelKey: TranslationKey;
  colors: [string, string, string, string];
}> = [
  {
    value: "midnight",
    labelKey: "settings.midnight",
    colors: ["#131313", "#1a1a23", "#7c3aed", "#e2e0dc"],
  },
  {
    value: "amethyst",
    labelKey: "settings.amethyst",
    colors: ["#15111f", "#211832", "#a78bfa", "#f0eaff"],
  },
  {
    value: "ocean",
    labelKey: "settings.ocean",
    colors: ["#071923", "#0c2734", "#38bdf8", "#d8f3ff"],
  },
  {
    value: "forest",
    labelKey: "settings.forest",
    colors: ["#10180f", "#172617", "#84cc16", "#e7f4df"],
  },
  {
    value: "sunset",
    labelKey: "settings.sunset",
    colors: ["#20100f", "#321817", "#f97316", "#fff1e8"],
  },
  {
    value: "latte",
    labelKey: "settings.latte",
    colors: ["#f3eee6", "#e7ded2", "#b45309", "#2a211c"],
  },
];

export function SettingsPage() {
  const { t } = useI18n();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const smoothCaret = useSettingsStore((s) => s.smoothCaret);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const setSmoothCaret = useSettingsStore((s) => s.setSmoothCaret);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);

  return (
    <motion.div
      className={styles.container}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.h1 className={styles.title} variants={fadeSlideUp}>
        {t("settings.title")}
      </motion.h1>
      <motion.p className={styles.subtitle} variants={fadeSlideUp}>
        {t("settings.subtitle")}
      </motion.p>

      <motion.section className={styles.card} variants={fadeSlideUp}>
        <SettingRow
          title={t("settings.theme")}
          description={t("settings.themeHelp")}
        >
          <div className={styles.paletteGrid}>
            {PALETTES.map((palette) => (
              <button
                key={palette.value}
                className={`${styles.paletteCard} ${
                  theme === palette.value ? styles.paletteActive : ""
                }`}
                type="button"
                onClick={() => setTheme(palette.value)}
              >
                <span className={styles.paletteSwatches}>
                  {palette.colors.map((color) => (
                    <span key={color} style={{ backgroundColor: color }} />
                  ))}
                </span>
                <span>{t(palette.labelKey)}</span>
              </button>
            ))}
          </div>
        </SettingRow>

        <SettingRow
          title={t("settings.language")}
          description={t("settings.languageHelp")}
        >
          <SegmentedControl
            value={language}
            options={[
              { value: "en", label: t("settings.english") },
              { value: "ru", label: t("settings.russian") },
            ]}
            onChange={(value) => setLanguage(value as InterfaceLanguage)}
          />
        </SettingRow>

        <SettingRow
          title={t("settings.fontSize")}
          description={t("settings.fontSizeHelp")}
        >
          <div className={styles.rangeControl}>
            <input
              type="range"
              min="18"
              max="36"
              step="1"
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
            />
            <span>{fontSize}px</span>
          </div>
        </SettingRow>

        <SettingRow
          title={t("settings.smoothCaret")}
          description={t("settings.smoothCaretHelp")}
        >
          <Switch checked={smoothCaret} onChange={setSmoothCaret} />
        </SettingRow>

        <SettingRow
          title={t("settings.sound")}
          description={t("settings.soundHelp")}
        >
          <Switch checked={soundEnabled} onChange={setSoundEnabled} />
        </SettingRow>
      </motion.section>

      <motion.p className={styles.note} variants={fadeSlideUp}>
        {t("settings.localNote")}{" "}
        {isAuthenticated ? t("settings.syncNote") : ""}
      </motion.p>
    </motion.div>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.row}>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.segmented}>
      {options.map((option) => (
        <button
          key={option.value}
          className={value === option.value ? styles.active : ""}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      className={`${styles.switch} ${checked ? styles.switchOn : ""}`}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}
