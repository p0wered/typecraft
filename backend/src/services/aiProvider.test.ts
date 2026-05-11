import { describe, expect, it } from "vitest";
import { validateAiRecommendation } from "./aiProvider";

describe("validateAiRecommendation", () => {
  it("accepts a valid structured recommendation", () => {
    const recommendation = validateAiRecommendation(
      {
        mode: "words",
        modeValue: "25",
        language: "en",
        difficulty: "normal",
        focus: ["accuracy", "weak_keys"],
        weakKeys: ["r", "t"],
        title: "Weak key drill",
        description: "Practice weak keys with a short words test.",
      },
      { recentResults: [], availableModes: ["words", "time"] },
    );

    expect(recommendation?.mode).toBe("words");
    expect(recommendation?.focus).toEqual(["accuracy", "weak_keys"]);
  });

  it("rejects unavailable modes", () => {
    const recommendation = validateAiRecommendation(
      {
        mode: "code",
        modeValue: "typescript",
        language: "typescript",
        difficulty: "normal",
        focus: ["code_structure"],
        weakKeys: [],
        title: "Code drill",
        description: "Practice code structure.",
      },
      { recentResults: [], availableModes: ["words", "time"] },
    );

    expect(recommendation).toBeNull();
  });

  it("rejects malformed recommendations", () => {
    const recommendation = validateAiRecommendation(
      {
        mode: "words",
        modeValue: "",
        language: "en",
        difficulty: "extreme",
        focus: [],
        weakKeys: [],
        title: "",
        description: "",
      },
      { recentResults: [] },
    );

    expect(recommendation).toBeNull();
  });

  it("accepts optional generatedContent within limits", () => {
    const recommendation = validateAiRecommendation(
      {
        mode: "code",
        modeValue: "typescript",
        language: "typescript",
        difficulty: "normal",
        focus: ["punctuation"],
        weakKeys: [";", "}"],
        title: "Punctuation snippet",
        description: "Type a short punctuation-heavy snippet.",
        generatedContent:
          "// drill\nexport function ping() {\n  return `{ok:true}`;\n}\nfunction x() {}",
      },
      { recentResults: [] },
    );

    expect(recommendation?.generatedContent).toContain("function");
  });
});
