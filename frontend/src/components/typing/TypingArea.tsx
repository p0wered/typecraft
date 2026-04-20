import { useEffect, useRef } from "react";
import { Word } from "./Word";
import styles from "./TypingArea.module.css";

interface TypingAreaProps {
  words: string[];
  typedWords: string[];
  currentWordIndex: number;
}

const VISIBLE_LINES = 3;

export function TypingArea({
  words,
  typedWords,
  currentWordIndex,
}: TypingAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const lineHeightRef = useRef(0);
  const scrollOffsetRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    const wordsEl = wordsRef.current;
    if (!container || !wordsEl) return;

    const currentWordEl = wordsEl.children[currentWordIndex] as
      | HTMLElement
      | undefined;
    if (!currentWordEl) return;

    if (lineHeightRef.current === 0) {
      lineHeightRef.current = currentWordEl.offsetHeight;
    }
    const lineHeight = lineHeightRef.current || currentWordEl.offsetHeight;

    const wordTop = currentWordEl.offsetTop;
    const currentLine = Math.round(wordTop / lineHeight);

    const targetLine = currentLine > 0 ? currentLine - 1 : 0;
    const newOffset = targetLine * lineHeight;

    if (newOffset !== scrollOffsetRef.current) {
      scrollOffsetRef.current = newOffset;
      wordsEl.style.transform = `translateY(-${newOffset}px)`;
    }
  }, [currentWordIndex]);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{ ["--visible-lines" as string]: VISIBLE_LINES }}
    >
      <div ref={wordsRef} className={styles.words}>
        {words.map((word, i) => (
          <Word
            key={i}
            target={word}
            typed={typedWords[i] ?? ""}
            isCurrent={i === currentWordIndex}
          />
        ))}
      </div>
    </div>
  );
}
