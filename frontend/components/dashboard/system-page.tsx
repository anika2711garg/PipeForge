"use client";

import { useQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { getApiBaseUrl } from "@/lib/api/client";
import { fetchSystem } from "@/lib/api/health";
import { formatTimestamp } from "@/lib/format/dates";
import { formatInteger } from "@/lib/format/numbers";
import { queryKeys } from "@/lib/utils/query-keys";
import { usePreferences } from "@/providers/preferences-provider";

function HealthRow({
  title,
  status,
  detail,
}: {
  title: string;
  status: string;
  detail: string;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <div className="mt-3">
        <StatusBadge status={status} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

export function SystemPage() {
  const { preferences } = usePreferences();
  const system = useQuery({
    queryKey: queryKeys.system,
    queryFn: fetchSystem,
    refetchInterval: preferences.autoRefresh ? preferences.refreshIntervalMs : false,
  });

  if (system.isError) {
    return (
      <ErrorState
        title="PipeForge API is currently unavailable."
        message={system.error instanceof Error ? system.error.message : "Unable to load system status."}
        onRetry={() => void system.refetch()}
      />
    );
  }

  const data = system.data;

  return (
    <div className="space-y-10">
      <PageHeader
        title="System"
        description="Read-only health and inventory. Filesystem locations are shown as names only."
      />
      {system.isPending ? (
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : data ? (
        <>
          <section className="glass grid gap-8 rounded-3xl border border-border p-6 md:grid-cols-3">
            <HealthRow
              title="FastAPI"
              status={data.api === "healthy" ? "healthy" : data.api}
              detail={`Control API at ${getApiBaseUrl()}`}
            />
            <HealthRow
              title="SQLite"
              status={data.database.status}
              detail={`Database file ${data.database.name}`}
            />
            <HealthRow
              title="Incoming directory"
              status={data.incoming.status}
              detail={`${data.incoming.name} · ${formatInteger(data.incoming.file_count)} JSONL files`}
            />
          </section>
          <section className="grid gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
            <p>Backend version: {data.backend_version}</p>
            <p>Frontend version: 1.0.0</p>
            <p>Warehouse events: {formatInteger(data.total_events)}</p>
            <p>Logical events: {formatInteger(data.logical_events)}</p>
            <p>Processed files: {formatInteger(data.total_processed_files)}</p>
            <p>Quarantine: {formatInteger(data.quarantined_records)}</p>
            <p>Total runs: {formatInteger(data.total_runs)}</p>
            <p>Checked: {formatTimestamp(data.checked_at, preferences.timeDisplay)}</p>
            <p>
              Last successful run:{" "}
              {data.last_successful_run
                ? `${data.last_successful_run.run_id} · ${formatTimestamp(data.last_successful_run.completed_at, preferences.timeDisplay)}`
                : "None"}
            </p>
            <p>
              Last failed run:{" "}
              {data.last_failed_run
                ? `${data.last_failed_run.run_id} · ${formatTimestamp(data.last_failed_run.completed_at, preferences.timeDisplay)}`
                : "None"}
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}
