import { z } from "zod";
import type {
  AdaptiveRecommendation,
  AdaptiveRecommendationRequest,
} from "@typecraft/shared";

const typingModeSchema = z.enum(["words", "time", "quote", "code", "custom"]);
const focusSchema = z.enum([
  "accuracy",
  "speed",
  "consistency",
  "weak_keys",
  "punctuation",
  "code_structure",
]);

const aiRecommendationSchema = z.object({
  mode: typingModeSchema,
  modeValue: z.string().min(1).max(80),
  language: z.string().min(1).max(40),
  difficulty: z.enum(["easy", "normal", "hard"]),
  focus: z.array(focusSchema).min(1).max(4),
  weakKeys: z.array(z.string().min(1).max(20)).max(8),
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(320),
  generatedContent: z.string().min(20).max(4000).optional(),
  customTextId: z.number().int().positive().optional(),
});

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

function getProviderConfig() {
  const provider = process.env.AI_PROVIDER ?? "openai-compatible";
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  const baseUrl =
    process.env.AI_BASE_URL ?? "https://api.openai.com/v1/chat/completions";

  if (provider !== "openai" && provider !== "openai-compatible") return null;
  if (!apiKey || !model) return null;
  return { apiKey, model, baseUrl };
}

function buildPrompt(
  request: AdaptiveRecommendationRequest,
  fallback: AdaptiveRecommendation,
) {
  return JSON.stringify({
    instruction:
      "Return only valid JSON for the next typing test recommendation. Do not include markdown. Keep difficulty changes gradual. Use only the allowed focus values and typing modes. Do not include personal data.",
    allowedModes: request.availableModes ?? [
      "words",
      "time",
      "quote",
      "code",
      "custom",
    ],
    allowedFocus: [
      "accuracy",
      "speed",
      "consistency",
      "weak_keys",
      "punctuation",
      "code_structure",
    ],
    outputShape: {
      mode: "words | time | quote | code | custom",
      modeValue: "string",
      language: "string",
      difficulty: "easy | normal | hard",
      focus: ["accuracy"],
      weakKeys: ["key"],
      title: "short title",
      description: "short explanation",
      generatedContent: "optional text, max 4000 chars",
      customTextId: "optional number",
    },
    fallback,
    input: request,
  });
}

function parseJsonObject(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed) as unknown;

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI response did not contain a JSON object");
  return JSON.parse(match[0]) as unknown;
}

export function validateAiRecommendation(
  value: unknown,
  request: AdaptiveRecommendationRequest,
): AdaptiveRecommendation | null {
  const parsed = aiRecommendationSchema.safeParse(value);
  if (!parsed.success) return null;

  const availableModes = request.availableModes;
  if (
    availableModes &&
    availableModes.length > 0 &&
    !availableModes.includes(parsed.data.mode)
  ) {
    return null;
  }

  return parsed.data;
}

export async function generateAiAdaptiveRecommendation(
  request: AdaptiveRecommendationRequest,
  fallback: AdaptiveRecommendation,
): Promise<AdaptiveRecommendation | null> {
  const config = getProviderConfig();
  if (!config) return null;

  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an adaptive typing coach for TypeCraft. Return only valid JSON matching the requested schema.",
        },
        {
          role: "user",
          content: buildPrompt(request, fallback),
        },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider failed with status ${response.status}`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  return validateAiRecommendation(parseJsonObject(content), request);
}
