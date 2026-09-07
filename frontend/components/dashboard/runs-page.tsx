"use client";

import { Activity } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { CopyButton } from "@/components/ui/copy-button";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { RunPipelineButton } from "@/components/pipeline/run-pipeline-button";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/ui/export-button";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useTableState } from "@/hooks/use-table-state";
import { formatDuration, formatRelative, formatTimestamp } from "@/lib/format/dates";
import type { RunRow } from "@/lib/api/types";
import { usePreferences } from "@/providers/preferences-provider";

export function RunsPage() {
  const { runs } = useDashboardData();
  const { preferences } = usePreferences();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<RunRow | null>(null);

  const rows = useMemo(() => {
    const list = runs.data ?? [];
    if (statusFilter === "all") {
      return list;
    }
    return list.filter((row) => row.status === statusFilter);
  }, [runs.data, statusFilter]);

  const table = useTableState<RunRow>(
    rows,
    (row, query) => !query || row.run_id.toLowerCase().includes(query),
    (row, key) => {
      if (key === "started") return row.started_at ?? "";
      if (key === "accepted") return row.records_accepted ?? 0;
      return row.run_id;
    },
  );

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
        title="Runs"
        description="Historical pipeline executions recorded in the warehouse."
        actions={
          <>
            <ExportButton kind="runs" />
            <Link href="/compare">
              <Button type="button" size="sm" variant="outline">
                Compare
              </Button>
            </Link>
            <RunPipelineButton />
          </>
        }
      />
      {runs.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : (runs.data ?? []).length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No pipeline runs yet"
          description="Run the pipeline to process incoming JSONL files."
          action={<RunPipelineButton />}
        />
      ) : (
        <>
          <TableToolbar
            query={table.query}
            onQuery={table.setQuery}
            placeholder="Search by run ID"
            filters={
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="running">Running</option>
              </Select>
            }
            resultCount={table.total}
            onClear={() => {
              table.setQuery("");
              setStatusFilter("all");
            }}
            page={table.page}
            pageCount={table.pageCount}
            onPage={table.setPage}
          />
          <div className="surface overflow-hidden rounded-[1.5rem]">
            <Table>
              <THead>
                <tr>
                  <Th>
                    <button type="button" onClick={() => table.setSort("id")}>
                      Run ID
                    </button>
                  </Th>
                  <Th>
                    <button type="button" onClick={() => table.setSort("started")}>
                      Started
                    </button>
                  </Th>
                  <Th>Finished</Th>
                  <Th>Duration</Th>
                  <Th>Status</Th>
                  <Th>Files</Th>
                  <Th>
                    <button type="button" onClick={() => table.setSort("accepted")}>
                      Accepted
                    </button>
                  </Th>
                  <Th>Quarantined</Th>
                  <Th>Error</Th>
                </tr>
              </THead>
              <tbody>
                {table.pageRows.map((row) => (
                  <tr
                    key={row.run_id}
                    className="cursor-pointer transition-colors duration-150 hover:bg-tint"
                    onClick={() => setSelected(row)}
                  >
                    <Td className="font-mono text-xs">
                      <Link
                        href={`/runs/${row.run_id}`}
                        className="underline-offset-4 hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {row.run_id}
                      </Link>
                    </Td>
                    <Td title={formatTimestamp(row.started_at, preferences.timeDisplay)}>
                      {formatRelative(row.started_at)}
                    </Td>
                    <Td>{formatTimestamp(row.completed_at, preferences.timeDisplay)}</Td>
                    <Td>{formatDuration(row.started_at, row.completed_at)}</Td>
                    <Td>
                      <StatusBadge status={row.status} />
                    </Td>
                    <Td>{row.files_processed ?? "—"}</Td>
                    <Td>{row.records_accepted ?? "—"}</Td>
                    <Td>{row.records_quarantined ?? "—"}</Td>
                    <Td className="max-w-[16rem] truncate text-destructive">{row.error ?? "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}
      <Drawer open={Boolean(selected)} title="Run detail" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs">{selected.run_id}</span>
              <CopyButton value={selected.run_id} label="Copy ID" />
            </div>
            <StatusBadge status={selected.status} />
            <p>Started: {formatTimestamp(selected.started_at, preferences.timeDisplay)}</p>
            <p>Finished: {formatTimestamp(selected.completed_at, preferences.timeDisplay)}</p>
            <p>Duration: {formatDuration(selected.started_at, selected.completed_at)}</p>
            <p>Files processed: {selected.files_processed ?? "—"}</p>
            <p>Accepted: {selected.records_accepted ?? "—"}</p>
            <p>Quarantined: {selected.records_quarantined ?? "—"}</p>
            {selected.error ? (
              <pre className="raw-block whitespace-pre-wrap rounded-md p-3 text-xs">{selected.error}</pre>
            ) : (
              <p className="text-muted-foreground">No error recorded for this run.</p>
            )}
            <Link href={`/runs/${selected.run_id}`} className="inline-flex text-xs text-primary underline-offset-4 hover:underline">
              Open run page
            </Link>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
