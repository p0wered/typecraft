import type {
  LeaderboardQuery,
  WeeklyLeaderboardResponse,
} from "@typecraft/shared";
import { api } from "./api";

function buildLeaderboardQuery(query: LeaderboardQuery) {
  const params = new URLSearchParams();
  params.set("mode", query.mode);
  if (query.modeValue) params.set("modeValue", query.modeValue);
  if (query.language) params.set("language", query.language);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  return params.toString();
}

export const leaderboardsApi = {
  weekly: (query: LeaderboardQuery) =>
    api.get<WeeklyLeaderboardResponse>(
      `/leaderboards/weekly?${buildLeaderboardQuery(query)}`,
    ),
};
