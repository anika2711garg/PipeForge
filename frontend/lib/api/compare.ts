import { apiGet } from "./client";
import type { RunCompare } from "./types";

export function fetchRunCompare(left: string, right: string): Promise<RunCompare> {
  const params = new URLSearchParams({ left, right });
  return apiGet<RunCompare>(`/api/compare/runs?${params.toString()}`);
}
