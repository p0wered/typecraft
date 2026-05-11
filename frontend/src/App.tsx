import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "./components/layout/Layout";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { LoginPage } from "./pages/LoginPage";
import { CustomTextsPage } from "./pages/CustomTextsPage";
import { LeaderboardsPage } from "./pages/LeaderboardsPage";
import { useAuthBootstrap } from "./hooks/useAuthBootstrap";
import { useSettingsSync } from "./hooks/useSettingsSync";
import { useSettingsStore } from "./store/settingsStore";

export function App() {
  useAuthBootstrap();
  useSettingsSync();
  const theme = useSettingsStore((s) => s.theme);
  const fontSize = useSettingsStore((s) => s.fontSize);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty(
      "--typing-font-size",
      `${fontSize}px`,
    );
  }, [theme, fontSize]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/custom" element={<CustomTextsPage />} />
        <Route path="/leaderboards" element={<LeaderboardsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>
    </Routes>
  );
}
