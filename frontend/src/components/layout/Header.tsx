import { Link, useLocation } from "react-router-dom";
import styles from "./Header.module.css";

const NAV_ITEMS = [
  { path: "/", label: "typing" },
  { path: "/profile", label: "profile" },
  { path: "/settings", label: "settings" },
] as const;

export function Header() {
  const location = useLocation();

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        <span className={styles.logoAccent}>type</span>craft
      </Link>
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ path, label }) => (
          <Link
            key={path}
            to={path}
            className={`${styles.navLink} ${location.pathname === path ? styles.active : ""}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className={styles.actions}>
        <Link to="/login" className={styles.authLink}>
          login
        </Link>
      </div>
    </header>
  );
}
