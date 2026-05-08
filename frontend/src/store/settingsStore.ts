import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme, InterfaceLanguage } from "@typecraft/shared";

const themes = ["midnight", "amethyst", "ocean", "forest", "sunset", "latte"];

export function normalizeTheme(value: unknown): Theme {
  if (value === "dark") return "midnight";
  if (value === "light") return "latte";
  if (typeof value === "string" && themes.includes(value)) {
    return value as Theme;
  }
  return "midnight";
}

interface SettingsState {
  theme: Theme;
  language: InterfaceLanguage;
  fontSize: number;
  smoothCaret: boolean;
  soundEnabled: boolean;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: InterfaceLanguage) => void;
  setFontSize: (size: number) => void;
  setSmoothCaret: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "midnight",
      language: "en",
      fontSize: 24,
      smoothCaret: true,
      soundEnabled: false,
      setTheme: (theme) => set({ theme: normalizeTheme(theme) }),
      setLanguage: (language) => set({ language }),
      setFontSize: (fontSize) => set({ fontSize }),
      setSmoothCaret: (smoothCaret) => set({ smoothCaret }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
    }),
    {
      name: "typecraft-settings",
      merge: (persisted, current) => {
        const state = persisted as Partial<SettingsState> | undefined;
        return {
          ...current,
          ...state,
          theme: normalizeTheme(state?.theme),
        };
      },
    },
  ),
);
