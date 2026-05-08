import { describe, expect, it, vi } from "vitest";
import {
  analyzeWord,
  calculateAccuracy,
  calculateConsistency,
  calculateRawWpm,
  calculateWpm,
  generateWords,
  normalizeKeyLabel,
  recordKeyMistake,
} from "./typing";

describe("typing utils", () => {
  it("analyzes correct, incorrect, extra, and missed characters", () => {
    expect(analyzeWord("craft", "crxfts", true)).toEqual({
      correct: 4,
      incorrect: 1,
      extra: 1,
      missed: 0,
    });

    expect(analyzeWord("craft", "cra", true)).toEqual({
      correct: 3,
      incorrect: 0,
      extra: 0,
      missed: 2,
    });
  });

  it("calculates speed and accuracy metrics", () => {
    expect(calculateWpm(25, 30)).toBe(10);
    expect(calculateRawWpm(50, 60)).toBe(10);
    expect(calculateAccuracy(8, 10)).toBe(80);
    expect(calculateAccuracy(4, 5)).toBe(80);
    expect(calculateAccuracy(0, 0)).toBe(100);
  });

  it("calculates consistency from WPM samples", () => {
    expect(calculateConsistency([60])).toBe(100);
    expect(calculateConsistency([50, 50, 50])).toBe(100);
    expect(calculateConsistency([0, 0])).toBe(0);
    expect(calculateConsistency([40, 60])).toBe(80);
  });

  it("generates requested words and avoids immediate duplicates", () => {
    const randomSpy = vi
      .spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.5);

    const words = generateWords("en", 3);

    expect(words).toHaveLength(3);
    expect(words[1]).not.toBe(words[0]);
    randomSpy.mockRestore();
  });

  it("normalizes and records problem keys for the heatmap", () => {
    const mistakes: Record<string, number> = {};

    expect(normalizeKeyLabel(" ")).toBe("space");
    expect(normalizeKeyLabel("\n")).toBe("enter");
    expect(normalizeKeyLabel("A")).toBe("a");

    recordKeyMistake(mistakes, "A", "s");
    recordKeyMistake(mistakes, " ", "x");
    recordKeyMistake(mistakes, undefined, "x");
    recordKeyMistake(mistakes, "A", "d");

    expect(mistakes).toEqual({ a: 2, space: 1, x: 1 });
  });
});
