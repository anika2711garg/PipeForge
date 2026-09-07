"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GitCompare } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { fetchRunCompare } from "@/lib/api/compare";
import { formatTimestamp } from "@/lib/format/dates";
import { formatInteger } from "@/lib/format/numbers";
import { queryKeys } from "@/lib/utils/query-keys";
import { usePreferences } from "@/providers/preferences-provider";

export function ComparePage() {
  const search = useSearchParams();
  const { runs } = useDashboardData();
  const { preferences } = usePreferences();
  const [left, setLeft] = useState(search.get("left") ?? "");
  const [right, setRight] = useState(search.get("right") ?? "");

  useEffect(() => {
    const nextLeft = search.get("left") ?? "";
    const nextRight = search.get("right") ?? "";
    if (nextLeft) setLeft(nextLeft);
    if (nextRight) setRight(nextRight);
  }, [search]);

  const list = runs.data ?? [];
  const ready = Boolean(left && right && left !== right);
  const compare = useQuery({
    queryKey: queryKeys.compare(left, right),
    queryFn: () => fetchRunCompare(left, right),
    enabled: ready,
  });

  if (runs.isError) {
    return (
      <ErrorState
        message={runs.error instanceof Error ? runs.error.message : "Unable to load runs."}
        onRetry={() => void runs.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compare"
        description="Difference between two recorded pipeline runs. Counts come from the warehouse."
      />
      {runs.isPending ? (
        <Skeleton className="h-20 w-full" />
      ) : list.length < 2 ? (
        <EmptyState
          icon={GitCompare}
          title="Need two runs"
          description="Run the pipeline at least twice to compare accepted and quarantined counts."
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Select value={left} onChange={(event) => setLeft(event.target.value)}>
              <option value="">Left run</option>
              {list.map((row) => (
                <option key={`l-${row.run_id}`} value={row.run_id}>
                  {row.run_id}
                </option>
              ))}
            </Select>
            <Select value={right} onChange={(event) => setRight(event.target.value)}>
              <option value="">Right run</option>
              {list.map((row) => (
                <option key={`r-${row.run_id}`} value={row.run_id}>
                  {row.run_id}
                </option>
              ))}
            </Select>
          </div>
          {!ready ? (
            <p className="text-sm text-muted-foreground">Choose two different run IDs.</p>
          ) : compare.isError ? (
            <ErrorState
              message={compare.error instanceof Error ? compare.error.message : "Unable to compare runs."}
              onRetry={() => void compare.refetch()}
            />
          ) : compare.isPending || !compare.data ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <RunColumn
                label="Left"
                row={compare.data.left}
                timeDisplay={preferences.timeDisplay}
              />
              <article className="surface rounded-lg p-5 text-sm">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Delta (right − left)</p>
                <p className="mt-3">Files: {formatSigned(compare.data.delta.files_processed)}</p>
                <p>Accepted: {formatSigned(compare.data.delta.records_accepted)}</p>
                <p>Quarantined: {formatSigned(compare.data.delta.records_quarantined)}</p>
              </article>
              <RunColumn
                label="Right"
                row={compare.data.right}
                timeDisplay={preferences.timeDisplay}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatSigned(value: number): string {
  const formatted = formatInteger(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}

function RunColumn({
  label,
  row,
  timeDisplay,
}: {
  label: string;
  row: { run_id: string; status: string; started_at: string | null; completed_at: string | null; files_processed: number | null; records_accepted: number | null; records_quarantined: number | null };
  timeDisplay: "utc" | "local";
}) {
  return (
    <article className="surface rounded-lg p-5 text-sm">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <Link href={`/runs/${row.run_id}`} className="mt-2 block font-mono text-xs underline-offset-4 hover:underline">
        {row.run_id}
      </Link>
      <div className="mt-2">
        <StatusBadge status={row.status} />
      </div>
      <p className="mt-3">{formatTimestamp(row.started_at, timeDisplay)}</p>
      <p>Files: {row.files_processed ?? "—"}</p>
      <p>Accepted: {row.records_accepted ?? "—"}</p>
      <p>Quarantined: {row.records_quarantined ?? "—"}</p>
    </article>
  );
}
