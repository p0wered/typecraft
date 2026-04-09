export type Theme = "dark" | "light";
export type InterfaceLanguage = "ru" | "en";

export interface UserSettings {
  id: number;
  userId: number;
  theme: Theme;
  language: InterfaceLanguage;
  fontSize: number;
  smoothCaret: boolean;
  soundEnabled: boolean;
  customConfig: Record<string, unknown>;
}

export interface UpdateSettingsRequest {
  theme?: Theme;
  language?: InterfaceLanguage;
  fontSize?: number;
  smoothCaret?: boolean;
  soundEnabled?: boolean;
  customConfig?: Record<string, unknown>;
}
