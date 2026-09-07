"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { DemoTools } from "@/components/dashboard/demo-tools";
import { EventVolumeChart } from "@/components/charts/metrics-charts";
import { FadeIn, Reveal, Stagger } from "@/components/motion/fade-in";
import { PipelineFlow } from "@/components/pipeline/pipeline-flow";
import { RunPipelineButton } from "@/components/pipeline/run-pipeline-button";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatDuration, formatRelative } from "@/lib/format/dates";
import { formatMinorUnits } from "@/lib/format/money";
import { formatInteger } from "@/lib/format/numbers";
import { formatPercent } from "@/lib/format/rates";
import { usePipelineActions } from "@/providers/pipeline-provider";

export function OverviewPage() {
  const { status, insights, activity, alerts, metrics } = useDashboardData();
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
  const currencies = snapshot?.currency_totals ?? [];
  const money =
    currencies.length === 1
      ? formatMinorUnits(currencies[0].total_amount_minor_units, currencies[0].currency)
      : currencies.length > 1
        ? currencies
            .map((row) => `${row.currency} ${formatMinorUnits(row.total_amount_minor_units, row.currency)}`)
            .join("  ")
        : "—";

  return (
    <div className="space-y-[var(--space-section)]">
      <PageHeader
        title="Overview"
        description="Monitor warehouse health, inspect the last run, and execute incremental ingest."
        actions={
          <>
            <RunPipelineButton />
            <Link href="/runs">
              <Button type="button" variant="outline">
                View runs
              </Button>
            </Link>
          </>
        }
      />

      <FadeIn>
        <section className="hero-panel rounded-[1.6rem]">
          <div className="relative z-10 grid lg:grid-cols-[1.5fr_1fr]">
            <div className="border-b border-[#d8dee8]/80 p-6 md:p-8 lg:border-b-0 lg:border-r">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={runStatus === "idle" ? "never" : runStatus} />
                <span className="color-chip bg-[#eef2f8] text-[#3A5FCD]">Latest run</span>
              </div>
              <h2 className="mt-4 display text-[1.55rem] md:text-[1.8rem]">
                {latest ? latest.run_id : "No pipeline run yet"}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
                {latest
                  ? `${formatRelative(latest.completed_at ?? latest.started_at)} · ${formatDuration(latest.started_at, latest.completed_at)}`
                  : "Drop JSONL into incoming or generate a demo batch, then run the pipeline."}
              </p>

              {(lastResult || latest) && (
                <div className="mt-7 grid grid-cols-3 gap-3">
                  {[
                    ["Accepted", lastResult?.records_accepted ?? latest?.records_accepted ?? "—", "from-[#eef2f8] to-white"],
                    ["Quarantined", lastResult?.records_quarantined ?? latest?.records_quarantined ?? "—", "from-[#f4eee6] to-white"],
                    ["Files", lastResult?.files_processed ?? latest?.files_processed ?? "—", "from-[#e7f2ef] to-white"],
                  ].map(([label, value, wash]) => (
                    <div
                      key={String(label)}
                      className={`rounded-2xl border border-[#d8dee8]/80 bg-gradient-to-br ${wash} px-3.5 py-3 dark:border-border dark:from-tint dark:to-card`}
                    >
                      <p className="kicker">{label}</p>
                      <p className="mt-1.5 text-lg font-semibold tabular-nums tracking-tight">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-[#2c4a9e] via-[#3A5FCD] to-[#4a6bb8] p-6 text-white md:p-8">
              <div
                className="pointer-events-none absolute inset-0 opacity-40 motion-safe:animate-aurora"
                aria-hidden="true"
                style={{
                  background:
                    "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.22), transparent 45%), radial-gradient(circle at 85% 80%, rgba(196,181,160,0.28), transparent 40%)",
                }}
              />
              <div className="relative z-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">Warehouse volume</p>
                <p className="mt-3 text-[2.35rem] font-semibold tabular-nums tracking-tight">
                  {status.isPending ? "—" : money}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  Exact integer minor units across accepted events.
                </p>
                <div className="mt-8 flex flex-col gap-2">
                  <Link
                    href="/metrics"
                    className="group inline-flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold backdrop-blur-sm transition-colors duration-200 hover:bg-white/18"
                  >
                    Metrics
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                  <Link
                    href="/explorer"
                    className="group inline-flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold backdrop-blur-sm transition-colors duration-200 hover:bg-white/18"
                  >
                    Event explorer
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {(lastResult?.error || latest?.error) ? (
        <p className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {lastResult?.error || latest?.error}
        </p>
      ) : null}

      <AlertsPanel items={alerts.data?.items ?? []} />

      <section>
        <SectionHeading title="Warehouse snapshot" description="Live counts from the local SQLite warehouse." />
        <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <StatTile accent index={0} label="Events" value={formatInteger(snapshot?.total_warehouse_events)} loading={status.isPending} href="/explorer" />
          <StatTile index={1} label="Files" value={formatInteger(snapshot?.total_processed_files)} loading={status.isPending} href="/files" />
          <StatTile index={2} label="Quarantine" value={formatInteger(snapshot?.quarantined_records)} loading={status.isPending} href="/quarantine" />
          <StatTile index={3} label="Runs" value={formatInteger(snapshot?.total_runs)} loading={status.isPending} href="/runs" />
          <StatTile index={4} label="Logical" value={formatInteger(snapshot?.logical_warehouse_events)} loading={status.isPending} />
        </Stagger>
      </section>

      {insights.data ? (
        <Reveal>
          <section className="overflow-hidden rounded-[1.5rem] border border-[#d8dee8]/90 bg-white/75 shadow-card backdrop-blur-md dark:border-border dark:bg-card/80">
            <div className="flex items-center justify-between gap-3 border-b border-[#e4e9f0] px-5 py-4 md:px-6 dark:border-border">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Run quality</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Derived from completed warehouse runs.</p>
              </div>
              <Link href="/insights" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                Insights
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4">
              {[
                ["Success", formatPercent(insights.data.success_percent)],
                ["Duplicates", formatPercent(insights.data.duplicate_percent)],
                ["Quarantine rate", formatPercent(insights.data.quarantine_percent)],
                ["Pending files", formatInteger(insights.data.pending_files)],
              ].map(([label, value], index) => (
                <div
                  key={String(label)}
                  className={`px-5 py-5 ${index % 2 === 1 ? "border-l border-[#e4e9f0] dark:border-border" : ""} ${index > 1 ? "border-t border-[#e4e9f0] dark:border-border md:border-t-0" : ""} ${index > 0 ? "md:border-l" : ""}`}
                >
                  <p className="kicker">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
                    {insights.isPending ? "—" : value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Reveal delay={0.04}>
            <PipelineFlow running={isPending} status={runStatus === "idle" ? null : runStatus} />
          </Reveal>
          {(metrics.data ?? []).length > 0 ? (
            <Reveal delay={0.08}>
              <section>
                <SectionHeading
                  title="Event volume"
                  action={
                    <Link href="/metrics" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                      Open metrics
                    </Link>
                  }
                />
                <Panel className="p-4 md:p-5">
                  <EventVolumeChart rows={metrics.data ?? []} />
                </Panel>
              </section>
            </Reveal>
          ) : null}
        </div>

        {(activity.data?.items.length ?? 0) > 0 ? (
          <Reveal delay={0.1} className="lg:col-span-2">
            <section>
              <SectionHeading
                title="Recent activity"
                action={
                  <Link href="/activity" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                    Timeline
                  </Link>
                }
              />
              <Panel className="overflow-hidden">
                <ol>
                  {(activity.data?.items ?? []).slice(0, 7).map((item, index) => (
                    <li key={`${item.kind}-${item.id}`} className={index === 0 ? "" : "border-t border-border"}>
                      <Link
                        href={item.href}
                        className="group flex items-center justify-between gap-3 px-4 py-3.5 transition-colors duration-200 hover:bg-[#eef2f8]/70 dark:hover:bg-tint"
                      >
                        <span className="min-w-0">
                          <span className="kicker">{item.kind}</span>
                          <span className="mt-1 block truncate text-sm font-semibold tracking-tight group-hover:text-primary">
                            {item.title}
                          </span>
                        </span>
                        {item.status ? <StatusBadge status={item.status} /> : null}
                      </Link>
                    </li>
                  ))}
                </ol>
              </Panel>
            </section>
          </Reveal>
        ) : null}
      </div>

      <Reveal delay={0.12}>
        <DemoTools />
      </Reveal>
    </div>
  );
}
