"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ErrorState } from "@/components/feedback/error-state";
import { CopyButton } from "@/components/ui/copy-button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { fetchQuarantineRecord } from "@/lib/api/quarantine";
import { inspectRawRecord } from "@/lib/format/json";
import { formatTimestamp } from "@/lib/format/dates";
import { queryKeys } from "@/lib/utils/query-keys";
import { usePreferences } from "@/providers/preferences-provider";

export function QuarantineDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { preferences } = usePreferences();
  const record = useQuery({
    queryKey: queryKeys.quarantineRecord(id),
    queryFn: () => fetchQuarantineRecord(id),
    enabled: Number.isFinite(id),
  });

  if (!Number.isFinite(id) || record.isError) {
    return (
      <ErrorState
        title="Quarantine record not found"
        message={record.error instanceof Error ? record.error.message : "Unable to load this record."}
        onRetry={() => void record.refetch()}
      />
    );
  }

  const row = record.data;
  const parsed = row ? inspectRawRecord(row.raw_record) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quarantine"
        description={Number.isFinite(id) ? `Record ${id}` : "Record"}
        actions={
          <Link href="/quarantine">
            <Button type="button" variant="outline" size="sm">
              All records
            </Button>
          </Link>
        }
      />
      {record.isPending || !row || !parsed ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <article className="space-y-3 border-t border-border pt-6 text-sm">
          <p>
            {row.source_file}:{row.line_number}
          </p>
          <p className="text-warning">{row.error_reason}</p>
          <p>{formatTimestamp(row.created_at, preferences.timeDisplay)}</p>
          <div className="flex flex-wrap gap-2">
            <CopyButton value={row.raw_record} label="Copy raw record" />
            <CopyButton value={row.error_reason} label="Copy error" />
          </div>
          <pre className="raw-block max-h-[50vh] overflow-auto whitespace-pre-wrap break-all rounded-md p-3 font-mono text-xs">
            {parsed.text}
          </pre>
          <p className="text-xs text-muted-foreground">
            {parsed.kind === "json" ? "Valid JSON (pretty-printed)." : "Malformed text (shown as-is)."}
          </p>
        </article>
      )}
    </div>
  );
}
