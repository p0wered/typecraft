export type ProgrammingLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "go"
  | "rust"
  | "java"
  | "cpp";

export interface Quote {
  id: number;
  text: string;
  source: string;
  length: "short" | "medium" | "long";
}

export interface CodeSnippet {
  id: number;
  code: string;
  language: ProgrammingLanguage;
  title: string;
}
