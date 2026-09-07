import { apiGet } from "./client";
import type { AlertsSnapshot } from "./types";

export function fetchAlerts(): Promise<AlertsSnapshot> {
  return apiGet<AlertsSnapshot>("/api/alerts");
}
