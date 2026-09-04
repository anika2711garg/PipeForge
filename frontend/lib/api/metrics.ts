import { apiGet } from "./client";
import type { MetricRow } from "./types";

export function fetchMetrics(): Promise<MetricRow[]> {
  return apiGet<MetricRow[]>("/api/metrics");
}
