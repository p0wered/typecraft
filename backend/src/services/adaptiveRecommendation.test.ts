import { describe, expect, it } from "vitest";
import { buildLocalAdaptiveRecommendation } from "./adaptiveRecommendation";

describe("buildLocalAdaptiveRecommendation", () => {
  it("starts with a baseline recommendation without history", () => {
    const recommendation = buildLocalAdaptiveRecommendation({
      recentResults: [],
      currentSettings: { preferredLanguage: "en" },
    });

    expect(recommendation.mode).toBe("words");
    expect(recommendation.modeValue).toBe("25");
    expect(recommendation.focus).toContain("accuracy");
  });

  it("recommends weak key recovery when mistakes are concentrated", () => {
    const recommendation = buildLocalAdaptiveRecommendation({
      recentResults: [
        {
          mode: "words",
          modeValue: "25",
          language: "en",
          wpm: 42,
          accuracy: 91,
          consistency: 80,
          keyMistakes: { r: 4, t: 2 },
          createdAt: "2026-05-09T12:00:00.000Z",
        },
      ],
    });

    expect(recommendation.mode).toBe("words");
    expect(recommendation.difficulty).toBe("easy");
    expect(recommendation.focus).toEqual(["weak_keys", "accuracy"]);
    expect(recommendation.weakKeys).toEqual(["r", "t"]);
  });

  it("pushes speed after accurate and consistent results", () => {
    const recommendation = buildLocalAdaptiveRecommendation({
      recentResults: [
        {
          mode: "time",
          modeValue: "30",
          language: "en",
          wpm: 80,
          accuracy: 98,
          consistency: 91,
          createdAt: "2026-05-09T12:00:00.000Z",
        },
      ],
    });

    expect(recommendation.mode).toBe("time");
    expect(recommendation.modeValue).toBe("60");
    expect(recommendation.difficulty).toBe("hard");
    expect(recommendation.focus).toEqual(["speed", "consistency"]);
  });
});
