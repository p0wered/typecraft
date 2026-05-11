import type { AdaptiveRecommendation, CustomText } from "@typecraft/shared";

const CODE_LIKE_KEYS = new Set([
  "{",
  "}",
  "(",
  ")",
  "[",
  "]",
  ";",
  ":",
  "'",
  '"',
  "`",
  "/",
  "\\",
]);

export function isAdaptiveChallengeCodeLike(
  rec: Pick<AdaptiveRecommendation, "mode" | "focus" | "weakKeys">,
): boolean {
  const codeLikeWeakKeys = rec.weakKeys.some((k) => CODE_LIKE_KEYS.has(k));
  return (
    rec.mode === "code" ||
    rec.focus.includes("code_structure") ||
    (rec.focus.includes("punctuation") && codeLikeWeakKeys)
  );
}

export function ephemeralCustomTextFromRecommendation(
  rec: AdaptiveRecommendation,
): CustomText {
  if (!rec.generatedContent?.trim()) {
    throw new Error("Recommendation has no generated content for typing");
  }

  const now = new Date().toISOString();
  const isCode = isAdaptiveChallengeCodeLike(rec);

  return {
    id: -Math.abs(Date.now()),
    userId: 0,
    title: rec.title.slice(0, 240),
    content: rec.generatedContent,
    contentType: isCode ? "code" : "text",
    language: rec.language,
    isPublic: false,
    createdAt: now,
    updatedAt: now,
  };
}
