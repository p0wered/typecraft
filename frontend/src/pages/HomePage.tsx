import { motion } from "framer-motion";
import { staggerContainer, fadeSlideUp, fadeScale } from "../utils/motion";
import styles from "./HomePage.module.css";

export function HomePage() {
  return (
    <motion.div
      className={styles.container}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div className={styles.modeBar} variants={fadeScale}>
        <div className={styles.modeGroup}>
          <button className={`${styles.modeBtn} ${styles.active}`}>words</button>
          <button className={styles.modeBtn}>time</button>
          <button className={styles.modeBtn}>quote</button>
          <button className={styles.modeBtn}>code</button>
        </div>
        <span className={styles.separator} />
        <div className={styles.modeGroup}>
          <button className={`${styles.optionBtn} ${styles.active}`}>25</button>
          <button className={styles.optionBtn}>50</button>
          <button className={styles.optionBtn}>100</button>
        </div>
      </motion.div>

      <motion.div className={styles.typingArea} variants={fadeSlideUp}>
        <p className={styles.placeholder}>
          Start typing to begin the test...
        </p>
      </motion.div>
    </motion.div>
  );
}
