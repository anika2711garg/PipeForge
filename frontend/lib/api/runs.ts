import { apiGet, apiPost } from "./client";
import type { RunResult, RunRow } from "./types";

export function fetchRuns(): Promise<RunRow[]> {
  return apiGet<RunRow[]>("/api/runs");
}

export function fetchRun(runId: string): Promise<RunRow> {
  return apiGet<RunRow>(`/api/runs/${encodeURIComponent(runId)}`);
}

export function startPipelineRun(): Promise<RunResult> {
  return apiPost<RunResult>("/api/run");
}
