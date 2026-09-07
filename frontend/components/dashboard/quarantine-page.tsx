"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { CopyButton } from "@/components/ui/copy-button";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { ExportButton } from "@/components/ui/export-button";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useTableState } from "@/hooks/use-table-state";
import { inspectRawRecord } from "@/lib/format/json";
import { formatTimestamp } from "@/lib/format/dates";
import type { QuarantineRow } from "@/lib/api/types";
import { usePreferences } from "@/providers/preferences-provider";

export function QuarantinePage() {
  const { quarantine } = useDashboardData();
  const { preferences } = usePreferences();
  const [reason, setReason] = useState("all");
  const [file, setFile] = useState("all");
  const [selected, setSelected] = useState<QuarantineRow | null>(null);

  const reasons = useMemo(
    () => [...new Set((quarantine.data ?? []).map((row) => row.error_reason))].sort(),
    [quarantine.data],
  );
  const files = useMemo(
    () => [...new Set((quarantine.data ?? []).map((row) => row.source_file))].sort(),
    [quarantine.data],
  );

  const rows = useMemo(() => {
    return (quarantine.data ?? []).filter((row) => {
      if (reason !== "all" && row.error_reason !== reason) return false;
      if (file !== "all" && row.source_file !== file) return false;
      return true;
    });
  }, [file, quarantine.data, reason]);

  const table = useTableState<QuarantineRow>(
    rows,
    (row, query) =>
      !query ||
      row.source_file.toLowerCase().includes(query) ||
      row.error_reason.toLowerCase().includes(query) ||
      row.raw_record.toLowerCase().includes(query),
    (row, key) => {
      if (key === "line") return row.line_number;
      if (key === "created") return row.created_at;
      return row.source_file;
    },
  );

  if (quarantine.isError) {
    return (
      <ErrorState
        message={quarantine.error instanceof Error ? quarantine.error.message : "Unable to load quarantine."}
        onRetry={() => void quarantine.refetch()}
      />
    );
  }

  const parsed = selected ? inspectRawRecord(selected.raw_record) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quarantine"
        description="Rejected lines kept for inspection. Raw content is rendered as text, never as HTML."
        actions={<ExportButton kind="quarantine" />}
      />
      {quarantine.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : (quarantine.data ?? []).length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No quarantined records"
          description="Invalid or conflicting input lines will appear here after a pipeline run."
        />
      ) : (
        <>
          <TableToolbar
            query={table.query}
            onQuery={table.setQuery}
            placeholder="Search file, reason, or raw text"
            filters={
              <>
                <Select value={reason} onChange={(event) => setReason(event.target.value)}>
                  <option value="all">All reasons</option>
                  {reasons.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
                <Select value={file} onChange={(event) => setFile(event.target.value)}>
                  <option value="all">All files</option>
                  {files.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </>
            }
            resultCount={table.total}
            onClear={() => {
              table.setQuery("");
              setReason("all");
              setFile("all");
            }}
            page={table.page}
            pageCount={table.pageCount}
            onPage={table.setPage}
          />
          <div className="surface overflow-hidden rounded-[1.5rem]">
            <Table>
              <THead>
                <tr>
                  <Th>Source file</Th>
                  <Th>
                    <button type="button" onClick={() => table.setSort("line")}>
                      Line
                    </button>
                  </Th>
                  <Th>Reason</Th>
                  <Th>
                    <button type="button" onClick={() => table.setSort("created")}>
                      Created
                    </button>
                  </Th>
                  <Th>Raw</Th>
                </tr>
              </THead>
              <tbody>
                {table.pageRows.map((row) => {
                  const raw = row.raw_record || "";
                  return (
                    <tr
                      key={row.id}
                      className="cursor-pointer transition-colors duration-150 hover:bg-tint"
                      onClick={() => setSelected(row)}
                    >
                      <Td>
                        <Link
                          href={`/quarantine/${row.id}`}
                          className="underline-offset-4 hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {row.source_file}
                        </Link>
                      </Td>
                      <Td>{row.line_number}</Td>
                      <Td className="max-w-[18rem] truncate">{row.error_reason}</Td>
                      <Td>{formatTimestamp(row.created_at, preferences.timeDisplay)}</Td>
                      <Td className="max-w-[20rem] truncate font-mono text-xs">
                        {raw.length > 80 ? `${raw.slice(0, 80)}…` : raw}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </>
      )}
      <Drawer open={Boolean(selected)} title="Quarantine detail" onClose={() => setSelected(null)}>
        {selected && parsed ? (
          <div className="space-y-3 text-sm">
            <p>
              {selected.source_file}:{selected.line_number}
            </p>
            <p className="text-warning">{selected.error_reason}</p>
            <p>{formatTimestamp(selected.created_at, preferences.timeDisplay)}</p>
            <div className="flex flex-wrap gap-2">
              <CopyButton value={selected.raw_record} label="Copy raw record" />
              <CopyButton value={selected.error_reason} label="Copy error" />
            </div>
            <pre className="raw-block max-h-[50vh] overflow-auto whitespace-pre-wrap break-all rounded-md p-3 font-mono text-xs">
              {parsed.text}
            </pre>
            <p className="text-xs text-muted-foreground">
              {parsed.kind === "json" ? "Valid JSON (pretty-printed)." : "Malformed text (shown as-is)."}
            </p>
            <Link href={`/quarantine/${selected.id}`} className="inline-flex text-xs text-primary underline-offset-4 hover:underline">
              Open record page
            </Link>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
