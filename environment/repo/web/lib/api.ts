export type RunRow = {
  run_id: string;
  started_at: string | null;
  completed_at: string | null;
  status: string;
  files_processed: number | null;
  records_accepted: number | null;
  records_quarantined: number | null;
  error?: string | null;
};

export type IncomingFile = {
  filename: string;
  size: number;
  processed: boolean;
  content_hash: string | null;
  record_count: number | null;
  status?: string | null;
};

export type MetricRow = {
  metric_date: string;
  event_type: string;
  event_count: number;
  total_amount_minor_units: number;
};

export type QuarantineRow = {
  id: number;
  source_file: string;
  line_number: number;
  raw_record: string;
  error_reason: string;
  created_at: string;
};

export type StatusSnapshot = {
  total_processed_files: number;
  total_warehouse_events: number;
  quarantined_records: number;
  last_successful_run: RunRow | null;
  latest_run: RunRow | null;
  aggregate_totals: {
    event_count: number;
    total_amount_minor_units: number;
  };
  metrics: MetricRow[];
  database: string;
  database_exists: boolean;
};

export type RunResult = {
  run_id: string;
  files_discovered: number;
  files_processed: number;
  files_skipped: number;
  records_accepted: number;
  records_duplicated: number;
  records_quarantined: number;
  status: string;
  error: string | null;
};

function apiBase(): string {
  if (typeof window === "undefined") {
    return "";
  }
  if (window.location.port === "3000") {
    return "http://127.0.0.1:8000";
  }
  return "";
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, options);
  const data = (await response.json().catch(() => ({}))) as { detail?: string };
  if (!response.ok) {
    throw new Error(data.detail || `Request failed (${response.status})`);
  }
  return data as T;
}
