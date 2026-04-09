import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import styles from "./Header.module.css";

const NAV_ITEMS = [
  { path: "/", label: "typing" },
  { path: "/profile", label: "profile" },
  { path: "/settings", label: "settings" },
] as const;

const headerVariants = {
  initial: { opacity: 0, y: -16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const, staggerChildren: 0.06 },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
};

export function Header() {
  const location = useLocation();

  return (
    <motion.header
      className={styles.header}
      variants={headerVariants}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={itemVariants}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoAccent}>type</span>craft
        </Link>
      </motion.div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ path, label }) => (
          <motion.div key={path} variants={itemVariants}>
            <Link
              to={path}
              className={`${styles.navLink} ${location.pathname === path ? styles.active : ""}`}
            >
              {label}
              {location.pathname === path && (
                <motion.div
                  className={styles.activeIndicator}
                  layoutId="nav-indicator"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          </motion.div>
        ))}
      </nav>
      <motion.div className={styles.actions} variants={itemVariants}>
        <Link to="/login" className={styles.authLink}>
          login
        </Link>
      </motion.div>
    </motion.header>
  );
}
