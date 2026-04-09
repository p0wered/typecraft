import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import styles from "./Layout.module.css";

export function Layout() {
  return (
    <div className={styles.layout}>
      <div className={styles.bgGlow} />
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <span className={styles.footerText}>typecraft</span>
      </footer>
    </div>
  );
}
