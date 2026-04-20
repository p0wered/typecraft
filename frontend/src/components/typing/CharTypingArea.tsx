import { useEffect, useRef } from "react";
import styles from "./CharTypingArea.module.css";

interface CharTypingAreaProps {
  target: string;
  typed: string;
  variant: "quote" | "code";
}

export function CharTypingArea({ target, typed, variant }: CharTypingAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement | null>(null);

  const position = typed.length;
  const lines = target.split("\n");

  useEffect(() => {
    const container = containerRef.current;
    const caret = caretRef.current;
    if (!container || !caret) return;

    const containerRect = container.getBoundingClientRect();
    const caretRect = caret.getBoundingClientRect();
    const relativeTop = caretRect.top - containerRect.top;
    const visibleHeight = container.clientHeight;
    const buffer = caretRect.height * 1.5;

    if (relativeTop > visibleHeight - buffer) {
      container.scrollTop += relativeTop - (visibleHeight - buffer);
    } else if (relativeTop < buffer) {
      container.scrollTop = Math.max(
        0,
        container.scrollTop + relativeTop - buffer,
      );
    }
  }, [position]);

  const renderCaret = () => (
    <span
      ref={(el) => {
        caretRef.current = el;
      }}
      className={styles.caret}
    />
  );

  let globalIndex = 0;

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${variant === "code" ? styles.code : styles.quote}`}
    >
      <div className={styles.content}>
        {lines.map((line, lineIdx) => {
          const isLastLine = lineIdx === lines.length - 1;
          const chars = line.split("");
          const lineStartIndex = globalIndex;

          const renderedChars = chars.map((ch, i) => {
            const charIdx = lineStartIndex + i;
            const state =
              charIdx < typed.length
                ? typed[charIdx] === ch
                  ? styles.correct
                  : styles.incorrect
                : styles.untyped;

            const showCaret = charIdx === position;
            const displayChar =
              ch === " " && charIdx < typed.length && typed[charIdx] !== ch
                ? "·"
                : ch;

            return (
              <span key={i} className={styles.charWrap}>
                {showCaret && renderCaret()}
                <span className={`${styles.char} ${state}`}>{displayChar}</span>
              </span>
            );
          });

          const endOfLineIdx = lineStartIndex + chars.length;
          const caretAtNewline = !isLastLine && position === endOfLineIdx;
          const caretAtEnd =
            isLastLine &&
            position === endOfLineIdx &&
            position < target.length + 1;

          globalIndex = endOfLineIdx;
          if (!isLastLine) globalIndex += 1;

          return (
            <div key={lineIdx} className={styles.line}>
              {renderedChars}
              {(caretAtNewline || caretAtEnd) && renderCaret()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
