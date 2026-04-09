import styles from "./HomePage.module.css";

export function HomePage() {
  return (
    <div className={styles.container}>
      <div className={styles.modeBar}>
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
      </div>

      <div className={styles.typingArea}>
        <p className={styles.placeholder}>
          Start typing to begin the test...
        </p>
      </div>
    </div>
  );
}
