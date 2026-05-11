import { describe, expect, it } from "vitest";
import type { AdaptiveRecommendation } from "@typecraft/shared";
import {
  ephemeralCustomTextFromRecommendation,
  isAdaptiveChallengeCodeLike,
} from "./adaptiveChallenge";

describe("isAdaptiveChallengeCodeLike", () => {
  const baseRec: Pick<AdaptiveRecommendation, "mode" | "focus" | "weakKeys"> = {
    mode: "words",
    focus: ["accuracy"],
    weakKeys: [],
  };

  it("detects prose weak-key drills without symbol weak keys", () => {
    expect(
      isAdaptiveChallengeCodeLike({
        ...baseRec,
        mode: "words",
        focus: ["weak_keys", "accuracy"],
        weakKeys: ["r", "t"],
      }),
    ).toBe(false);
  });

  it("treats explicit code mode as code", () => {
    expect(
      isAdaptiveChallengeCodeLike({
        ...baseRec,
        mode: "code",
        focus: ["accuracy"],
        weakKeys: [],
      }),
    ).toBe(true);
  });

  it("treats punctuation drills with braces as code", () => {
    expect(
      isAdaptiveChallengeCodeLike({
        ...baseRec,
        mode: "time",
        focus: ["punctuation"],
        weakKeys: ["}"],
      }),
    ).toBe(true);
  });
});

describe("ephemeralCustomTextFromRecommendation", () => {
  it("builds a typed custom snapshot from generated content", () => {
    const custom = ephemeralCustomTextFromRecommendation({
      mode: "words",
      modeValue: "25",
      language: "en",
      difficulty: "normal",
      focus: ["weak_keys"],
      weakKeys: ["e"],
      title: "Key drill",
      description: "Focus on repeats.",
      generatedContent: "The eager bee sees three green trees.",
    });

    expect(custom.id).toBeLessThan(0);
    expect(custom.contentType).toBe("text");
    expect(custom.title).toBe("Key drill");
  });
});
