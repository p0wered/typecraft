import styles from "./Word.module.css";

interface WordProps {
  target: string;
  typed: string;
  isCurrent: boolean;
}

export function Word({ target, typed, isCurrent }: WordProps) {
  const targetChars = target.split("");
  const typedLen = typed.length;
  const hasExtras = typedLen > target.length;
  const extraChars = hasExtras ? typed.slice(target.length).split("") : [];
  const endCaret = isCurrent && typedLen === target.length;

  return (
    <div className={styles.word}>
      {targetChars.map((char, i) => {
        let state: "untyped" | "correct" | "incorrect" = "untyped";
        if (i < typedLen) {
          state = typed[i] === char ? "correct" : "incorrect";
        }
        const showCaret = isCurrent && i === typedLen;

        return (
          <span
            key={i}
            className={`${styles.char} ${styles[state]} ${showCaret ? styles.caret : ""}`}
          >
            {char}
          </span>
        );
      })}

      {extraChars.map((char, i) => {
        const isLastExtra = i === extraChars.length - 1;
        return (
          <span
            key={`extra-${i}`}
            className={`${styles.char} ${styles.extra} ${isCurrent && isLastExtra ? styles.caretAfter : ""}`}
          >
            {char}
          </span>
        );
      })}

      {endCaret && <span className={styles.endCaret} />}
    </div>
  );
}
