import type { UpdateSettingsRequest, UserSettings } from "@typecraft/shared";
import { api } from "./api";

export const settingsApi = {
  get: () => api.get<UserSettings>("/settings"),
  update: (data: UpdateSettingsRequest) =>
    api.put<UserSettings>("/settings", data),
};
