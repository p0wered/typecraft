import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { authApi } from "../services/auth";
import { ApiError } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { staggerContainer, fadeSlideUp } from "../utils/motion";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/profile", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister) {
      if (username.trim().length < 3) {
        setError("Username must be at least 3 characters");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = isRegister
        ? await authApi.register({ username: username.trim(), email, password })
        : await authApi.login({ email, password });
      setAuth(data.user, data.token);
      navigate("/profile", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsRegister((v) => !v);
    setError(null);
  };

  return (
    <motion.div
      className={styles.container}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.h1 className={styles.title} variants={fadeSlideUp}>
        {isRegister ? "Register" : "Login"}
      </motion.h1>
      <motion.div className={styles.card} variants={fadeSlideUp}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <AnimatePresence initial={false}>
            {isRegister && (
              <motion.input
                key="username"
                className={styles.input}
                type="text"
                placeholder="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>
          <input
            className={styles.input}
            type="email"
            placeholder="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={styles.input}
            type="password"
            placeholder="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <AnimatePresence>
            {error && (
              <motion.div
                className={styles.error}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            className={styles.submitBtn}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "..." : isRegister ? "sign up" : "sign in"}
          </button>
        </form>
        <button
          className={styles.toggleBtn}
          onClick={toggleMode}
          type="button"
        >
          {isRegister
            ? "already have an account? login"
            : "don't have an account? register"}
        </button>
      </motion.div>
    </motion.div>
  );
}
