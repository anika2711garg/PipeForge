"use client";

import { FolderInput } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { CopyButton } from "@/components/ui/copy-button";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { Tooltip } from "@/components/ui/tooltip";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useTableState } from "@/hooks/use-table-state";
import { formatBytes, formatTimestamp } from "@/lib/format/dates";
import { shortenHash } from "@/lib/format/numbers";
import type { IncomingFile } from "@/lib/api/types";
import { usePreferences } from "@/providers/preferences-provider";

export function FilesPage() {
  const { files } = useDashboardData();
  const { preferences } = usePreferences();
  const [filter, setFilter] = useState("all");
  const [openName, setOpenName] = useState<string | null>(null);

  const rows = useMemo(() => {
    const list = files.data ?? [];
    if (filter === "processed") return list.filter((row) => row.processed);
    if (filter === "unprocessed") return list.filter((row) => !row.processed);
    if (filter === "changed") return list.filter((row) => row.content_changed);
    if (filter === "failed") return list.filter((row) => row.status === "failed");
    return list;
  }, [files.data, filter]);

  const table = useTableState<IncomingFile>(
    rows,
    (row, query) => !query || row.filename.toLowerCase().includes(query),
    (row, key) => {
      if (key === "size") return row.size;
      if (key === "name") return row.filename;
      return row.filename;
    },
  );

  if (files.isError) {
    return (
      <ErrorState
        message={files.error instanceof Error ? files.error.message : "Unable to load files."}
        onRetry={() => void files.refetch()}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Files"
        description="Incoming JSONL batches and the latest processed-file checkpoint for each name."
      />
      {files.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : (files.data ?? []).length === 0 ? (
        <EmptyState
          icon={FolderInput}
          title="No incoming files"
          description="Place JSONL files in the incoming directory or generate a demo batch."
        />
      ) : (
        <>
          <TableToolbar
            query={table.query}
            onQuery={table.setQuery}
            placeholder="Search filename"
            filters={
              <Select value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option value="all">All files</option>
                <option value="processed">Processed</option>
                <option value="unprocessed">Unprocessed</option>
                <option value="changed">Changed content</option>
                <option value="failed">Failed</option>
              </Select>
            }
            resultCount={table.total}
            onClear={() => {
              table.setQuery("");
              setFilter("all");
            }}
            page={table.page}
            pageCount={table.pageCount}
            onPage={table.setPage}
          />
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <THead>
                <tr>
                  <Th>
                    <button type="button" onClick={() => table.setSort("name")}>
                      Filename
                    </button>
                  </Th>
                  <Th>
                    <button type="button" onClick={() => table.setSort("size")}>
                      Size
                    </button>
                  </Th>
                  <Th>Status</Th>
                  <Th>Processed</Th>
                  <Th>Content hash</Th>
                  <Th>Records</Th>
                  <Th>Processed at</Th>
                </tr>
              </THead>
              <tbody>
                {table.pageRows.map((row) => (
                  <tr
                    key={row.filename}
                    className="cursor-pointer hover:bg-muted/60"
                    onClick={() => setOpenName(openName === row.filename ? null : row.filename)}
                  >
                    <Td className="font-medium">
                      {row.filename}
                      {row.content_changed ? (
                        <span className="ml-2 text-xs text-warning">changed</span>
                      ) : null}
                    </Td>
                    <Td>{formatBytes(row.size)}</Td>
                    <Td>
                      <StatusBadge status={row.status ?? (row.processed ? "completed" : "never")} />
                    </Td>
                    <Td>{row.processed ? "Yes" : "No"}</Td>
                    <Td>
                      <Tooltip content={row.content_hash ?? "No hash recorded"}>
                        <span className="font-mono text-xs">{shortenHash(row.content_hash)}</span>
                      </Tooltip>
                    </Td>
                    <Td>{row.record_count ?? "—"}</Td>
                    <Td>{formatTimestamp(row.processed_at, preferences.timeDisplay)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          {table.pageRows
            .filter((row) => row.filename === openName)
            .map((row) => (
              <div key={`${row.filename}-detail`} className="mt-3 rounded-lg border border-border bg-card p-4 text-sm">
                <p className="font-medium">{row.filename}</p>
                <p className="mt-2 font-mono text-xs break-all">Stored hash: {row.content_hash ?? "—"}</p>
                <p className="mt-1 font-mono text-xs break-all">Current hash: {row.current_hash ?? "—"}</p>
                {row.content_hash ? <CopyButton value={row.content_hash} label="Copy stored hash" /> : null}
              </div>
            ))}
        </>
      )}
    </div>
  );
}
