import { apiGet } from "./client";
import type { ActivitySnapshot } from "./types";

export function fetchActivity(limit = 40): Promise<ActivitySnapshot> {
  return apiGet<ActivitySnapshot>(`/api/activity?limit=${limit}`);
}
