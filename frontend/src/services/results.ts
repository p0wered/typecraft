import type {
  AggregatedStats,
  CreateResultRequest,
  PersonalBest,
  ProgressPoint,
  ResultsQuery,
  TypingResult,
} from "@typecraft/shared";
import { api } from "./api";

export const resultsApi = {
  create: (data: CreateResultRequest) =>
    api.post<TypingResult>("/results", data),
  list: (query: ResultsQuery = {}) => {
    const params = new URLSearchParams();
    if (query.mode) params.set("mode", query.mode);
    if (query.language) params.set("language", query.language);
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    const qs = params.toString();
    return api.get<{ results: TypingResult[]; page: number; limit: number }>(
      `/results${qs ? `?${qs}` : ""}`,
    );
  },
  stats: () => api.get<AggregatedStats>("/results/stats"),
  progress: (limit = 30) =>
    api.get<ProgressPoint[]>(`/results/progress?limit=${limit}`),
  personalBest: () => api.get<PersonalBest[]>("/results/personal-best"),
};
