import type {
  AdaptiveRecommendation,
  AdaptiveRecommendationRequest,
} from "@typecraft/shared";
import { api } from "./api";

export const adaptiveApi = {
  recommendation: (data: AdaptiveRecommendationRequest) =>
    api.post<AdaptiveRecommendation>("/adaptive/recommendation", data),
};
