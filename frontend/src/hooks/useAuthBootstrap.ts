import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { authApi } from "../services/auth";

export function useAuthBootstrap() {
  useEffect(() => {
    const { token, isBootstrapped, setUser, setBootstrapped, logout } =
      useAuthStore.getState();

    if (isBootstrapped) return;

    if (!token) {
      setBootstrapped();
      return;
    }

    authApi
      .me()
      .then((user) => {
        setUser(user);
        setBootstrapped();
      })
      .catch(() => {
        logout();
      });
  }, []);
}
