import { apiDownload } from "./client";

export const EXPORT_PATHS = {
  runs: { path: "/api/export/runs", filename: "pipeforge-runs.csv" },
  metrics: { path: "/api/export/metrics", filename: "pipeforge-metrics.csv" },
  quarantine: { path: "/api/export/quarantine", filename: "pipeforge-quarantine.csv" },
  events: { path: "/api/export/events", filename: "pipeforge-events.csv" },
} as const;

export type ExportKind = keyof typeof EXPORT_PATHS;

export function downloadExport(kind: ExportKind): Promise<void> {
  const target = EXPORT_PATHS[kind];
  return apiDownload(target.path, target.filename);
}
