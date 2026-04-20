import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { staggerContainer, fadeSlideUp } from "../utils/motion";
import styles from "./ProfilePage.module.css";

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <motion.div
      className={styles.container}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.h1 className={styles.title} variants={fadeSlideUp}>
        {isAuthenticated && user ? user.username : "Profile"}
      </motion.h1>
      <motion.div className={styles.card} variants={fadeSlideUp}>
        {isAuthenticated && user ? (
          <p className={styles.cardText}>
            Signed in as <span className={styles.accent}>{user.email}</span>.
            Detailed statistics coming soon.
          </p>
        ) : (
          <p className={styles.cardText}>
            <Link to="/login" className={styles.accent}>
              Log in
            </Link>{" "}
            to see your typing statistics and progress.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
