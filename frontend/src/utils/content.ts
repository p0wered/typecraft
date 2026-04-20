import type {
  CodeSnippet,
  ContentLength,
  ProgrammingLanguage,
  Quote,
  QuoteLanguage,
} from "@typecraft/shared";
import quotesData from "../data/quotes.json";
import javascriptSnippets from "../data/snippets/javascript.json";
import typescriptSnippets from "../data/snippets/typescript.json";
import pythonSnippets from "../data/snippets/python.json";
import goSnippets from "../data/snippets/go.json";
import rustSnippets from "../data/snippets/rust.json";

const QUOTES = quotesData as Quote[];

const SNIPPETS: Record<ProgrammingLanguage, CodeSnippet[]> = {
  javascript: javascriptSnippets as CodeSnippet[],
  typescript: typescriptSnippets as CodeSnippet[],
  python: pythonSnippets as CodeSnippet[],
  go: goSnippets as CodeSnippet[],
  rust: rustSnippets as CodeSnippet[],
};

export const PROGRAMMING_LANGUAGES: ProgrammingLanguage[] = [
  "javascript",
  "typescript",
  "python",
  "go",
  "rust",
];

function pickRandom<T>(list: T[], fallback: T): T {
  if (list.length === 0) return fallback;
  return list[Math.floor(Math.random() * list.length)];
}

export function pickRandomQuote(
  language: QuoteLanguage,
  length: ContentLength,
): Quote {
  const matching = QUOTES.filter(
    (q) => q.language === language && q.length === length,
  );
  if (matching.length > 0) return pickRandom(matching, QUOTES[0]);

  const byLang = QUOTES.filter((q) => q.language === language);
  if (byLang.length > 0) return pickRandom(byLang, QUOTES[0]);

  return pickRandom(QUOTES, QUOTES[0]);
}

export function pickRandomSnippet(
  language: ProgrammingLanguage,
  length?: ContentLength,
): CodeSnippet {
  const pool = SNIPPETS[language] ?? SNIPPETS.javascript;
  if (length) {
    const matching = pool.filter((s) => s.length === length);
    if (matching.length > 0) return pickRandom(matching, pool[0]);
  }
  return pickRandom(pool, pool[0]);
}

export function isProgrammingLanguage(
  value: string,
): value is ProgrammingLanguage {
  return (PROGRAMMING_LANGUAGES as string[]).includes(value);
}

export function isContentLength(value: string): value is ContentLength {
  return value === "short" || value === "medium" || value === "long";
}
