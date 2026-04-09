import { motion } from "framer-motion";
import { staggerContainer, fadeSlideUp } from "../utils/motion";
import styles from "./ProfilePage.module.css";

export function ProfilePage() {
  return (
    <motion.div
      className={styles.container}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.h1 className={styles.title} variants={fadeSlideUp}>
        Profile
      </motion.h1>
      <motion.div className={styles.card} variants={fadeSlideUp}>
        <p className={styles.cardText}>
          Login to see your typing statistics and progress.
        </p>
      </motion.div>
    </motion.div>
  );
}
