import { apiGet } from "./client";
import type { StatusSnapshot } from "./types";

export function fetchStatus(): Promise<StatusSnapshot> {
  return apiGet<StatusSnapshot>("/api/status");
}
