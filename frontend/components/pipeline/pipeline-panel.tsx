"use client";

import Link from "next/link";

import { FadeIn, Reveal } from "@/components/motion/fade-in";
import { PageHeader } from "@/components/ui/page-header";
import { formatDuration, formatTimestamp } from "@/lib/format/dates";
import type { StatusSnapshot } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { usePreferences } from "@/providers/preferences-provider";
import { usePipelineActions } from "@/providers/pipeline-provider";

import { PipelineFlow } from "./pipeline-flow";
import { RunPipelineButton } from "./run-pipeline-button";

export function PipelinePanel({
  status,
}: {
  status: StatusSnapshot | undefined;
}) {
  const { preferences } = usePreferences();
  const { isPending, lastResult } = usePipelineActions();
  const latest = status?.latest_run ?? null;
  const runStatus = isPending ? "running" : lastResult?.status ?? latest?.status ?? null;

  return (
    <div className="space-y-[var(--space-section)]">
      <PageHeader
        title="Pipeline"
        description={
          latest
            ? `${latest.status} · ${formatTimestamp(latest.started_at, preferences.timeDisplay)} · ${formatDuration(latest.started_at, latest.completed_at)}`
            : "Incoming files are validated, de-duplicated, and written to the warehouse."
        }
        actions={
          <>
            <RunPipelineButton />
            <Link href="/runs">
              <Button type="button" variant="outline">
                History
              </Button>
            </Link>
          </>
        }
      />

      <FadeIn>
        <section className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-card">
          <div className="grid sm:grid-cols-[1.4fr_1fr]">
            <div className="border-b border-border p-5 md:p-6 sm:border-b-0 sm:border-r">
              <p className="kicker">Current state</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={runStatus ?? "never"} />
                <span className="font-mono text-xs text-muted-foreground">
                  {latest ? latest.run_id : "No runs recorded yet"}
                </span>
              </div>
              <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                {isPending
                  ? "Incremental ingest is in progress. Refresh to watch counters update."
                  : "Run the pipeline when new JSONL arrives or after generating a demo batch."}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 bg-tint/70 p-5 md:p-6">
              {[
                ["Events", status?.total_warehouse_events ?? "—"],
                ["Files", status?.total_processed_files ?? "—"],
                ["Quarantine", status?.quarantined_records ?? "—"],
              ].map(([label, value]) => (
                <div key={String(label)} className="text-center sm:text-left">
                  <p className="kicker">{label}</p>
                  <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {(lastResult?.error || latest?.error) ? (
        <p className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {lastResult?.error || latest?.error}
        </p>
      ) : null}

      <Reveal>
        <PipelineFlow running={isPending} status={runStatus} />
      </Reveal>
    </div>
  );
}
