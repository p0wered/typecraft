import { describe, expect, it } from "vitest";
import { normalizeTheme } from "./settingsStore";

describe("normalizeTheme", () => {
  it("keeps supported palette names", () => {
    expect(normalizeTheme("ocean")).toBe("ocean");
    expect(normalizeTheme("forest")).toBe("forest");
    expect(normalizeTheme("latte")).toBe("latte");
  });

  it("maps legacy theme names to palettes", () => {
    expect(normalizeTheme("dark")).toBe("midnight");
    expect(normalizeTheme("light")).toBe("latte");
  });

  it("falls back to midnight for unknown values", () => {
    expect(normalizeTheme("neon")).toBe("midnight");
    expect(normalizeTheme(null)).toBe("midnight");
  });
});
