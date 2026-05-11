import type {
  AdaptiveFocus,
  AdaptiveRecommendation,
  AdaptiveRecommendationRequest,
  TypingMode,
} from "@typecraft/shared";

const punctuationKeys = new Set([
  ";",
  ":",
  "(",
  ")",
  "{",
  "}",
  "[",
  "]",
  "enter",
  "tab",
]);

function topWeakKeys(keyMistakes: Record<string, number> | undefined) {
  return Object.entries(keyMistakes ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => key);
}

function firstAvailableMode(
  availableModes: TypingMode[] | undefined,
  preferred: TypingMode,
  fallback: TypingMode,
) {
  if (!availableModes || availableModes.length === 0) return preferred;
  if (availableModes.includes(preferred)) return preferred;
  if (availableModes.includes(fallback)) return fallback;
  return availableModes[0];
}

function buildRecommendation({
  mode,
  modeValue,
  language,
  difficulty,
  focus,
  weakKeys,
  title,
  description,
}: AdaptiveRecommendation) {
  return {
    mode,
    modeValue,
    language,
    difficulty,
    focus,
    weakKeys,
    title,
    description,
  };
}

export function buildLocalAdaptiveRecommendation(
  request: AdaptiveRecommendationRequest,
): AdaptiveRecommendation {
  const latest = [...request.recentResults].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];

  const language =
    latest?.language ?? request.currentSettings?.preferredLanguage ?? "en";
  const weakKeys = topWeakKeys(latest?.keyMistakes);
  const hasPunctuationWeakness = weakKeys.some((key) =>
    punctuationKeys.has(key),
  );

  if (!latest) {
    return buildRecommendation({
      mode: firstAvailableMode(request.availableModes, "words", "time"),
      modeValue: "25",
      language,
      difficulty: "normal",
      focus: ["accuracy"],
      weakKeys: [],
      title: "Baseline practice",
      description:
        "Start with a short words test so TypeCraft can learn your current level.",
    });
  }

  if (latest.mode === "code" && hasPunctuationWeakness) {
    return buildRecommendation({
      mode: firstAvailableMode(request.availableModes, "code", "words"),
      modeValue: latest.modeValue || "typescript",
      language: latest.modeValue || language,
      difficulty: "normal",
      focus: ["punctuation", "code_structure"],
      weakKeys,
      title: "Code punctuation drill",
      description:
        "Your recent errors cluster around code punctuation and structure, so the next drill keeps focus on code symbols.",
    });
  }

  if (weakKeys.length > 0 && latest.accuracy < 97) {
    return buildRecommendation({
      mode: firstAvailableMode(request.availableModes, "words", "time"),
      modeValue: latest.accuracy < 92 ? "25" : "50",
      language,
      difficulty: latest.accuracy < 92 ? "easy" : "normal",
      focus: ["weak_keys", "accuracy"],
      weakKeys,
      title: "Weak keys recovery",
      description: `Focus on ${weakKeys.join(", ")} while keeping accuracy steady before pushing speed.`,
    });
  }

  if (latest.accuracy < 92) {
    return buildRecommendation({
      mode: firstAvailableMode(request.availableModes, "words", "time"),
      modeValue: "25",
      language,
      difficulty: "easy",
      focus: ["accuracy"],
      weakKeys,
      title: "Accuracy reset",
      description:
        "Take a shorter test and prioritize clean keystrokes before increasing pace.",
    });
  }

  if (latest.accuracy >= 97 && latest.consistency >= 85) {
    return buildRecommendation({
      mode: firstAvailableMode(request.availableModes, "time", "words"),
      modeValue: "60",
      language,
      difficulty: "hard",
      focus: ["speed", "consistency"],
      weakKeys,
      title: "Speed push",
      description:
        "Your accuracy and consistency are strong, so the next step is a longer timed run.",
    });
  }

  const focus: AdaptiveFocus[] =
    latest.consistency < 75 ? ["consistency"] : ["speed"];

  return buildRecommendation({
    mode: firstAvailableMode(request.availableModes, "time", "words"),
    modeValue: "30",
    language,
    difficulty: "normal",
    focus,
    weakKeys,
    title: latest.consistency < 75 ? "Stability run" : "Balanced practice",
    description:
      latest.consistency < 75
        ? "Keep a steadier rhythm over a short timed run."
        : "Run a balanced test to build speed without sacrificing accuracy.",
  });
}
