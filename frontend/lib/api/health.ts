import { apiGet } from "./client";
import type { HealthSnapshot, SystemSnapshot } from "./types";

export function fetchHealth(): Promise<HealthSnapshot> {
  return apiGet<HealthSnapshot>("/api/health");
}

export function fetchSystem(): Promise<SystemSnapshot> {
  return apiGet<SystemSnapshot>("/api/system");
}
