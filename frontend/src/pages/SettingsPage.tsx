import { motion } from "framer-motion";
import { staggerContainer, fadeSlideUp } from "../utils/motion";
import styles from "./SettingsPage.module.css";

export function SettingsPage() {
  return (
    <motion.div
      className={styles.container}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.h1 className={styles.title} variants={fadeSlideUp}>
        Settings
      </motion.h1>
      <motion.div className={styles.card} variants={fadeSlideUp}>
        <p className={styles.cardText}>Customize your typing experience.</p>
      </motion.div>
    </motion.div>
  );
}
