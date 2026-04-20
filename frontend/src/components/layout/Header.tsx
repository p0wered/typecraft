import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
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
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

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
        <AnimatePresence mode="wait" initial={false}>
          {isAuthenticated && user ? (
            <motion.div
              key="authed"
              className={styles.userGroup}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.18 }}
            >
              <span className={styles.username}>{user.username}</span>
              <button
                className={styles.logoutBtn}
                onClick={handleLogout}
                title="log out"
              >
                logout
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="guest"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.18 }}
            >
              <Link to="/login" className={styles.authLink}>
                login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.header>
  );
}
