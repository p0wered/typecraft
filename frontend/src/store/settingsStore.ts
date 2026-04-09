import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme, InterfaceLanguage } from "@typecraft/shared";

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
      theme: "dark",
      language: "en",
      fontSize: 24,
      smoothCaret: true,
      soundEnabled: false,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setFontSize: (fontSize) => set({ fontSize }),
      setSmoothCaret: (smoothCaret) => set({ smoothCaret }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
    }),
    { name: "typecraft-settings" },
  ),
);
