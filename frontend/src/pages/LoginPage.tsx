import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, fadeSlideUp } from "../utils/motion";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);

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
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <AnimatePresence>
            {isRegister && (
              <motion.input
                className={styles.input}
                type="text"
                placeholder="username"
                autoComplete="username"
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
          />
          <input
            className={styles.input}
            type="password"
            placeholder="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
          <button className={styles.submitBtn} type="submit">
            {isRegister ? "sign up" : "sign in"}
          </button>
        </form>
        <button
          className={styles.toggleBtn}
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister
            ? "already have an account? login"
            : "don't have an account? register"}
        </button>
      </motion.div>
    </motion.div>
  );
}
