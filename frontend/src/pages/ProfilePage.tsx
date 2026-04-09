import styles from "./ProfilePage.module.css";

export function ProfilePage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Profile</h1>
      <p className={styles.subtitle}>
        Login to see your typing statistics and progress.
      </p>
    </div>
  );
}
