import type {
  CreateCustomTextRequest,
  CustomText,
  CustomTextsQuery,
  UpdateCustomTextRequest,
} from "@typecraft/shared";
import { api } from "./api";

function buildCustomTextsQuery(query: CustomTextsQuery = {}) {
  const params = new URLSearchParams();
  if (query.contentType) params.set("contentType", query.contentType);
  if (query.language) params.set("language", query.language);
  if (query.search) params.set("search", query.search);
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const customTextsApi = {
  create: (data: CreateCustomTextRequest) =>
    api.post<CustomText>("/custom-texts", data),
  list: (query: CustomTextsQuery = {}) =>
    api.get<{ customTexts: CustomText[]; page: number; limit: number }>(
      `/custom-texts${buildCustomTextsQuery(query)}`,
    ),
  get: (id: number) => api.get<CustomText>(`/custom-texts/${id}`),
  update: (id: number, data: UpdateCustomTextRequest) =>
    api.put<CustomText>(`/custom-texts/${id}`, data),
  delete: (id: number) => api.delete<void>(`/custom-texts/${id}`),
};
