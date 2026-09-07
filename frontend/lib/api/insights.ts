import { apiGet } from "./client";
import type { InsightsSnapshot } from "./types";

export function fetchInsights(): Promise<InsightsSnapshot> {
  return apiGet<InsightsSnapshot>("/api/insights");
}
