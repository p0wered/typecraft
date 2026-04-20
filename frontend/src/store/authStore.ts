import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@typecraft/shared";
import { api } from "../services/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isBootstrapped: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  setBootstrapped: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isBootstrapped: false,
      setAuth: (user, token) => {
        api.setToken(token);
        set({ user, token, isAuthenticated: true });
      },
      setUser: (user) => set({ user }),
      setBootstrapped: () => set({ isBootstrapped: true }),
      logout: () => {
        api.setToken(null);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isBootstrapped: true,
        });
      },
    }),
    {
      name: "typecraft-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.setToken(state.token);
        }
      },
    },
  ),
);

api.setUnauthorizedHandler(() => {
  const { isAuthenticated, logout } = useAuthStore.getState();
  if (isAuthenticated) {
    logout();
  }
});
