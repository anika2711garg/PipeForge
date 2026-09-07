export type RunStatus = "completed" | "failed" | "running" | string;

export type RunRow = {
  run_id: string;
  started_at: string | null;
  completed_at: string | null;
  status: RunStatus;
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
  current_hash?: string | null;
  record_count: number | null;
  status?: string | null;
  processed_at?: string | null;
  content_changed?: boolean;
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

export type CurrencyTotal = {
  currency: string;
  event_count: number;
  total_amount_minor_units: number;
};

export type StatusSnapshot = {
  total_processed_files: number;
  total_warehouse_events: number;
  logical_warehouse_events?: number;
  duplicate_event_rows?: number;
  quarantined_records: number;
  total_runs?: number;
  total_accepted_records?: number;
  incoming_file_count?: number;
  last_successful_run: RunRow | null;
  last_failed_run?: RunRow | null;
  latest_run: RunRow | null;
  aggregate_totals: {
    event_count: number;
    total_amount_minor_units: number;
  };
  currency_totals?: CurrencyTotal[];
  metrics: MetricRow[];
  database: string;
  incoming_dir?: string;
  database_exists: boolean;
  backend_version?: string;
};

export type RunResult = {
  run_id: string;
  files_discovered: number;
  files_processed: number;
  files_skipped: number;
  records_accepted: number;
  records_duplicated: number;
  records_quarantined: number;
  status: RunStatus;
  error: string | null;
  started_at?: string | null;
  completed_at?: string | null;
};

export type HealthSnapshot = {
  status: "healthy" | "degraded" | "offline" | string;
  api: string;
  database: string;
  incoming_dir: string;
  database_name?: string;
  incoming_name?: string;
  backend_version?: string;
  checked_at?: string;
};

export type SystemSnapshot = {
  api: string;
  database: { status: string; name: string };
  incoming: { status: string; name: string; file_count: number };
  backend_version: string;
  total_events: number;
  logical_events: number;
  total_processed_files: number;
  quarantined_records: number;
  total_runs: number;
  last_successful_run: RunRow | null;
  last_failed_run: RunRow | null;
  latest_run: RunRow | null;
  checked_at: string;
  database_exists: boolean;
};

export type WarehouseEvent = {
  id: number;
  event_id: string;
  user_id: string;
  event_type: string;
  amount_minor_units: number | null;
  currency: string | null;
  occurred_at_utc: string;
  source: string | null;
  ingested_at: string;
  source_file: string;
};

export type EventsPage = {
  items: WarehouseEvent[];
  total: number;
  limit: number;
  offset: number;
};

export type EventFacets = {
  event_types: string[];
  currencies: string[];
  sources: string[];
};

export type SearchResults = {
  q: string;
  runs: RunRow[];
  files: IncomingFile[];
  events: WarehouseEvent[];
  quarantine: Array<Pick<QuarantineRow, "id" | "source_file" | "line_number" | "error_reason" | "created_at">>;
};

export type DemoGenerateResult = {
  files: string[];
};

export type DemoResetResult = {
  files: string[];
  warehouse: string;
};

export type InsightsSnapshot = {
  total_runs: number;
  completed_runs: number;
  failed_runs: number;
  success_percent: number | null;
  total_events: number;
  logical_events: number;
  duplicate_event_rows: number;
  duplicate_percent: number | null;
  quarantined_records: number;
  quarantine_percent: number | null;
  pending_files: number;
  changed_files: number;
  incoming_files: number;
  latest_run: RunRow | null;
  last_failed_run: RunRow | null;
};

export type ActivityItem = {
  kind: "run" | "quarantine" | "file" | string;
  id: string;
  at: string | null;
  title: string;
  detail: string | null;
  status: string | null;
  href: string;
};

export type ActivitySnapshot = {
  items: ActivityItem[];
  total: number;
};

export type AlertItem = {
  id: string;
  severity: "error" | "warning" | "info" | string;
  title: string;
  detail: string;
  href: string;
};

export type AlertsSnapshot = {
  items: AlertItem[];
  count: number;
};

export type FilePreviewLine = {
  line_number: number;
  text: string;
};

export type FilePreview = {
  filename: string;
  lines: FilePreviewLine[];
};

export type RunCompare = {
  left: RunRow;
  right: RunRow;
  delta: {
    files_processed: number;
    records_accepted: number;
    records_quarantined: number;
  };
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
