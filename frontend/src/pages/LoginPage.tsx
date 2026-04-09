import { useState } from "react";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{isRegister ? "Register" : "Login"}</h1>
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        {isRegister && (
          <input
            className={styles.input}
            type="text"
            placeholder="username"
            autoComplete="username"
          />
        )}
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
    </div>
  );
}
