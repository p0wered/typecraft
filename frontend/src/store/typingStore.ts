import { create } from "zustand";
import type { CustomText, TypingMode } from "@typecraft/shared";

interface TypingState {
  mode: TypingMode;
  modeValue: string;
  typingLanguage: string;
  customText: CustomText | null;
  isActive: boolean;
  isFinished: boolean;
  setMode: (mode: TypingMode) => void;
  setModeValue: (value: string) => void;
  setTypingLanguage: (lang: string) => void;
  setCustomText: (customText: CustomText | null) => void;
  start: () => void;
  finish: () => void;
  reset: () => void;
}

const DEFAULT_MODE_VALUE: Record<TypingMode, string> = {
  words: "25",
  time: "30",
  quote: "medium",
  code: "javascript",
  custom: "",
};

const VALID_MODE_VALUES: Record<TypingMode, readonly string[]> = {
  words: ["10", "25", "50", "100"],
  time: ["15", "30", "60", "120"],
  quote: ["short", "medium", "long"],
  code: ["javascript", "typescript", "python", "go", "rust"],
  custom: [],
};

export const useTypingStore = create<TypingState>()((set) => ({
  mode: "words",
  modeValue: "25",
  typingLanguage: "en",
  customText: null,
  isActive: false,
  isFinished: false,
  setMode: (mode) =>
    set((state) => {
      const validValues = VALID_MODE_VALUES[mode];
      const nextValue = validValues.includes(state.modeValue)
        ? state.modeValue
        : DEFAULT_MODE_VALUE[mode];
      return {
        mode,
        modeValue: nextValue,
        isActive: false,
        isFinished: false,
      };
    }),
  setModeValue: (modeValue) =>
    set({ modeValue, isActive: false, isFinished: false }),
  setTypingLanguage: (typingLanguage) =>
    set({ typingLanguage, isActive: false, isFinished: false }),
  setCustomText: (customText) =>
    set({
      customText,
      mode: customText ? "custom" : "words",
      modeValue: customText ? String(customText.id) : "25",
      typingLanguage: customText?.language ?? "en",
      isActive: false,
      isFinished: false,
    }),
  start: () => set({ isActive: true, isFinished: false }),
  finish: () => set({ isActive: false, isFinished: true }),
  reset: () => set({ isActive: false, isFinished: false }),
}));
