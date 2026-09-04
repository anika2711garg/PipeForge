import { apiGet } from "./client";
import type { QuarantineRow } from "./types";

export function fetchQuarantine(): Promise<QuarantineRow[]> {
  return apiGet<QuarantineRow[]>("/api/quarantine");
}

export function fetchQuarantineRecord(id: number): Promise<QuarantineRow> {
  return apiGet<QuarantineRow>(`/api/quarantine/${id}`);
}
