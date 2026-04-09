import { create } from "zustand";
import type { TypingMode } from "@typecraft/shared";

interface TypingState {
  mode: TypingMode;
  modeValue: string;
  typingLanguage: string;
  isActive: boolean;
  isFinished: boolean;
  setMode: (mode: TypingMode) => void;
  setModeValue: (value: string) => void;
  setTypingLanguage: (lang: string) => void;
  start: () => void;
  finish: () => void;
  reset: () => void;
}

export const useTypingStore = create<TypingState>()((set) => ({
  mode: "words",
  modeValue: "25",
  typingLanguage: "en",
  isActive: false,
  isFinished: false,
  setMode: (mode) => set({ mode, isActive: false, isFinished: false }),
  setModeValue: (modeValue) =>
    set({ modeValue, isActive: false, isFinished: false }),
  setTypingLanguage: (typingLanguage) => set({ typingLanguage }),
  start: () => set({ isActive: true, isFinished: false }),
  finish: () => set({ isActive: false, isFinished: true }),
  reset: () => set({ isActive: false, isFinished: false }),
}));
