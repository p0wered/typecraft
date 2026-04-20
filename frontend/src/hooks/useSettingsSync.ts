import { useEffect, useRef } from "react";
import type { UpdateSettingsRequest } from "@typecraft/shared";
import { useAuthStore } from "../store/authStore";
import { useSettingsStore } from "../store/settingsStore";
import { settingsApi } from "../services/settings";

const PUSH_DEBOUNCE_MS = 400;

export function useSettingsSync() {
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);

  const suppressPushRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isBootstrapped) return;
    if (!isAuthenticated || userId === undefined) {
      lastSyncedUserIdRef.current = null;
      return;
    }
    if (lastSyncedUserIdRef.current === userId) return;
    lastSyncedUserIdRef.current = userId;

    settingsApi
      .get()
      .then((settings) => {
        suppressPushRef.current = true;
        useSettingsStore.setState({
          theme: settings.theme,
          language: settings.language,
          fontSize: settings.fontSize,
          smoothCaret: settings.smoothCaret,
          soundEnabled: settings.soundEnabled,
        });
        queueMicrotask(() => {
          suppressPushRef.current = false;
        });
      })
      .catch((err) => {
        console.error("Failed to pull settings:", err);
      });
  }, [isBootstrapped, isAuthenticated, userId]);

  useEffect(() => {
    return useSettingsStore.subscribe((state, prev) => {
      if (suppressPushRef.current) return;
      if (!useAuthStore.getState().isAuthenticated) return;

      const patch: UpdateSettingsRequest = {};
      if (state.theme !== prev.theme) patch.theme = state.theme;
      if (state.language !== prev.language) patch.language = state.language;
      if (state.fontSize !== prev.fontSize) patch.fontSize = state.fontSize;
      if (state.smoothCaret !== prev.smoothCaret)
        patch.smoothCaret = state.smoothCaret;
      if (state.soundEnabled !== prev.soundEnabled)
        patch.soundEnabled = state.soundEnabled;

      if (Object.keys(patch).length === 0) return;

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        settingsApi.update(patch).catch((err) => {
          console.error("Failed to push settings:", err);
        });
      }, PUSH_DEBOUNCE_MS);
    });
  }, []);
}
