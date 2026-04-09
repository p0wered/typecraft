import styles from "./SettingsPage.module.css";

export function SettingsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.subtitle}>Customize your typing experience.</p>
    </div>
  );
}
