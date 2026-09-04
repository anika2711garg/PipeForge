"use client";

import Link from "next/link";

import { DemoTools } from "@/components/dashboard/demo-tools";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/fade-in";
import { PipelineFlow } from "@/components/pipeline/pipeline-flow";
import { RunPipelineButton } from "@/components/pipeline/run-pipeline-button";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatDuration, formatRelative } from "@/lib/format/dates";
import { formatMinorUnits } from "@/lib/format/money";
import { formatInteger } from "@/lib/format/numbers";
import { usePipelineActions } from "@/providers/pipeline-provider";

export function OverviewPage() {
  const { status } = useDashboardData();
  const { isPending, lastResult } = usePipelineActions();
  const snapshot = status.data;

  if (status.isError) {
    return (
      <ErrorState
        title="PipeForge API is currently unavailable."
        message={status.error instanceof Error ? status.error.message : "Unable to load overview."}
        onRetry={() => void status.refetch()}
      />
    );
  }

  const latest = snapshot?.latest_run ?? null;
  const runStatus = isPending ? "running" : lastResult?.status ?? latest?.status ?? "idle";
  const headline =
    runStatus === "running"
      ? "Running"
      : runStatus === "failed"
        ? "Failed"
        : runStatus === "completed"
          ? "Live"
          : "Idle";
  const currencies = snapshot?.currency_totals ?? [];
  const money =
    currencies.length === 1
      ? formatMinorUnits(currencies[0].total_amount_minor_units, currencies[0].currency)
      : currencies.length > 1
        ? currencies.map((row) => `${row.currency} ${formatMinorUnits(row.total_amount_minor_units, row.currency)}`).join("  ")
        : "—";

  return (
    <div className="space-y-8">
      <FadeIn className="glass overflow-hidden rounded-3xl border border-border p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Incremental ETL</p>
            <h1 className="display mt-3 text-6xl sm:text-7xl md:text-8xl">{headline}</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
              {latest
                ? `${latest.run_id} · ${formatRelative(latest.completed_at ?? latest.started_at)} · ${formatDuration(latest.started_at, latest.completed_at)}`
                : "No pipeline run yet. Incoming JSONL stays on disk until you execute."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RunPipelineButton />
            <Link href="/runs">
              <Button type="button" variant="outline">
                Runs
              </Button>
            </Link>
            <Link href="/quarantine">
              <Button type="button" variant="ghost">
                Quarantine
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>

      <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Events" value={formatInteger(snapshot?.total_warehouse_events)} loading={status.isPending} />
        <StatCard label="Logical" value={formatInteger(snapshot?.logical_warehouse_events)} loading={status.isPending} />
        <StatCard label="Files" value={formatInteger(snapshot?.total_processed_files)} loading={status.isPending} />
        <StatCard label="Quarantine" value={formatInteger(snapshot?.quarantined_records)} loading={status.isPending} />
        <StatCard label="Runs" value={formatInteger(snapshot?.total_runs)} loading={status.isPending} />
        <StatCard label="Volume" value={money} loading={status.isPending} />
      </Stagger>

      {(lastResult?.error || latest?.error) ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {lastResult?.error || latest?.error}
        </p>
      ) : null}

      <FadeIn delay={0.12}>
        <PipelineFlow running={isPending} status={runStatus === "idle" ? null : runStatus} />
      </FadeIn>

      {lastResult ? (
        <Stagger className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Discovered" value={String(lastResult.files_discovered)} />
          <StatCard label="Processed" value={String(lastResult.files_processed)} />
          <StatCard label="Skipped" value={String(lastResult.files_skipped)} />
          <StatCard label="Accepted" value={String(lastResult.records_accepted)} />
          <StatCard label="Duplicated" value={String(lastResult.records_duplicated)} />
          <StatCard label="Quarantined" value={String(lastResult.records_quarantined)} />
        </Stagger>
      ) : null}

      <FadeIn delay={0.18}>
        <DemoTools />
      </FadeIn>
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <StaggerItem>
      <article className="glass rounded-2xl border border-border px-4 py-4 transition-transform duration-300 hover:-translate-y-0.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p className="mt-2 truncate text-2xl font-semibold tabular-nums tracking-tight">{loading ? "—" : value}</p>
      </article>
    </StaggerItem>
  );
}
