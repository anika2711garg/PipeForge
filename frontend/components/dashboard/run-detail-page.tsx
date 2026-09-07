"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ErrorState } from "@/components/feedback/error-state";
import { CopyButton } from "@/components/ui/copy-button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { fetchRun } from "@/lib/api/runs";
import { formatDuration, formatTimestamp } from "@/lib/format/dates";
import { queryKeys } from "@/lib/utils/query-keys";
import { usePreferences } from "@/providers/preferences-provider";

export function RunDetailPage() {
  const params = useParams<{ runId: string }>();
  const runId = String(params.runId ?? "");
  const { preferences } = usePreferences();
  const run = useQuery({
    queryKey: queryKeys.run(runId),
    queryFn: () => fetchRun(runId),
    enabled: Boolean(runId),
  });

  if (run.isError) {
    return (
      <ErrorState
        title="Run not found"
        message={run.error instanceof Error ? run.error.message : "Unable to load this run."}
        onRetry={() => void run.refetch()}
      />
    );
  }

  const row = run.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Run"
        description={runId}
        actions={
          <>
            <Link href="/runs">
              <Button type="button" variant="outline" size="sm">
                All runs
              </Button>
            </Link>
            <Link href={`/compare?left=${encodeURIComponent(runId)}`}>
              <Button type="button" variant="ghost" size="sm">
                Compare
              </Button>
            </Link>
          </>
        }
      />
      {run.isPending || !row ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <article className="space-y-4 border-t border-border pt-6 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs">{row.run_id}</span>
            <CopyButton value={row.run_id} label="Copy ID" />
          </div>
          <StatusBadge status={row.status} />
          <p>Started: {formatTimestamp(row.started_at, preferences.timeDisplay)}</p>
          <p>Finished: {formatTimestamp(row.completed_at, preferences.timeDisplay)}</p>
          <p>Duration: {formatDuration(row.started_at, row.completed_at)}</p>
          <p>Files processed: {row.files_processed ?? "—"}</p>
          <p>Accepted: {row.records_accepted ?? "—"}</p>
          <p>Quarantined: {row.records_quarantined ?? "—"}</p>
          {row.error ? (
            <pre className="raw-block whitespace-pre-wrap rounded-md p-3 text-xs">{row.error}</pre>
          ) : (
            <p className="text-muted-foreground">No error recorded for this run.</p>
          )}
        </article>
      )}
    </div>
  );
}
