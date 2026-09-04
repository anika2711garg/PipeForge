import { apiPost } from "./client";
import type { DemoGenerateResult, DemoResetResult } from "./types";

export function generateDemoBatch(): Promise<DemoGenerateResult> {
  return apiPost<DemoGenerateResult>("/api/demo/generate");
}

export function resetDemoData(): Promise<DemoResetResult> {
  return apiPost<DemoResetResult>("/api/demo/reset");
}
