export type ProgrammingLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "go"
  | "rust";

export type ContentLength = "short" | "medium" | "long";

export type QuoteLanguage = "en" | "ru";

export interface Quote {
  id: number;
  text: string;
  source: string;
  language: QuoteLanguage;
  length: ContentLength;
}

export interface CodeSnippet {
  id: number;
  title: string;
  code: string;
  length: ContentLength;
}
