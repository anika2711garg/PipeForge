"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

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
        <section className="hero-panel rounded-[1.75rem]">
          <div className="relative z-10 grid lg:grid-cols-[1.45fr_1fr]">
            <div className="border-b border-blue-200/70 p-6 md:p-8 lg:border-b-0 lg:border-r">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={runStatus === "idle" ? "never" : runStatus} />
                <span className="color-chip bg-blue-100 text-blue-700">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Live warehouse
                </span>
              </div>
              <h2 className="mt-4 display text-[1.6rem] md:text-[1.95rem]">
                {latest ? latest.run_id : "No pipeline run yet"}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-300">
                {latest
                  ? `${formatRelative(latest.completed_at ?? latest.started_at)} · ${formatDuration(latest.started_at, latest.completed_at)}`
                  : "Drop JSONL into incoming or generate a demo batch, then run the pipeline."}
              </p>

              {(lastResult || latest) && (
                <div className="mt-7 grid grid-cols-3 gap-3">
                  {[
                    ["Accepted", lastResult?.records_accepted ?? latest?.records_accepted ?? "—", "from-blue-500 to-indigo-600"],
                    ["Quarantined", lastResult?.records_quarantined ?? latest?.records_quarantined ?? "—", "from-orange-400 to-rose-500"],
                    ["Files", lastResult?.files_processed ?? latest?.files_processed ?? "—", "from-teal-400 to-emerald-500"],
                  ].map(([label, value, wash]) => (
                    <div
                      key={String(label)}
                      className={`rounded-2xl bg-gradient-to-br ${wash} px-3.5 py-3 text-white shadow-lg`}
                    >
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/80">{label}</p>
                      <p className="mt-1.5 text-lg font-extrabold tabular-nums tracking-tight">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-500 via-violet-600 to-indigo-700 p-6 text-white md:p-8">
              <div
                className="pointer-events-none absolute inset-0 opacity-50 motion-safe:animate-gradient"
                aria-hidden="true"
                style={{
                  background:
                    "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.35), transparent 42%), radial-gradient(circle at 85% 75%, rgba(45,212,191,0.45), transparent 40%)",
                }}
              />
              <div className="relative z-10">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-fuchsia-100">Warehouse volume</p>
                <p className="mt-3 text-[2.45rem] font-extrabold tabular-nums tracking-tight">
                  {status.isPending ? "—" : money}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/85">
                  Exact integer minor units across accepted events.
                </p>
                <div className="mt-8 flex flex-col gap-2">
                  <Link
                    href="/metrics"
                    className="group inline-flex items-center justify-between rounded-2xl border border-white/25 bg-white/15 px-4 py-3 text-sm font-bold backdrop-blur-sm transition-colors duration-200 hover:bg-white/25"
                  >
                    Metrics
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                  <Link
                    href="/explorer"
                    className="group inline-flex items-center justify-between rounded-2xl border border-white/25 bg-white/15 px-4 py-3 text-sm font-bold backdrop-blur-sm transition-colors duration-200 hover:bg-white/25"
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
        <p className="rounded-2xl border border-rose-300 bg-rose-100 px-4 py-3 text-sm font-medium text-rose-700">
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
          <section className="overflow-hidden rounded-[1.6rem] border border-violet-200 bg-gradient-to-br from-white via-violet-50 to-fuchsia-50 shadow-card dark:border-violet-500/30 dark:from-card dark:via-violet-950/40 dark:to-fuchsia-950/30">
            <div className="flex items-center justify-between gap-3 border-b border-violet-200/80 px-5 py-4 md:px-6 dark:border-violet-500/20">
              <div>
                <h2 className="text-base font-bold tracking-tight text-violet-900 dark:text-violet-100">Run quality</h2>
                <p className="mt-0.5 text-sm text-violet-700/80 dark:text-violet-200/70">Derived from completed warehouse runs.</p>
              </div>
              <Link href="/insights" className="text-sm font-bold text-fuchsia-600 underline-offset-4 hover:underline dark:text-fuchsia-300">
                Insights
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4">
              {[
                ["Success", formatPercent(insights.data.success_percent), "text-emerald-600"],
                ["Duplicates", formatPercent(insights.data.duplicate_percent), "text-amber-600"],
                ["Quarantine rate", formatPercent(insights.data.quarantine_percent), "text-rose-600"],
                ["Pending files", formatInteger(insights.data.pending_files), "text-blue-600"],
              ].map(([label, value, tone], index) => (
                <div
                  key={String(label)}
                  className={`px-5 py-5 ${index % 2 === 1 ? "border-l border-violet-200/70 dark:border-violet-500/20" : ""} ${index > 1 ? "border-t border-violet-200/70 dark:border-violet-500/20 md:border-t-0" : ""} ${index > 0 ? "md:border-l" : ""}`}
                >
                  <p className="kicker">{label}</p>
                  <p className={`mt-2 text-2xl font-extrabold tabular-nums tracking-tight ${tone}`}>
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
                    <Link href="/metrics" className="text-sm font-bold text-blue-600 underline-offset-4 hover:underline">
                      Open metrics
                    </Link>
                  }
                />
                <Panel className="border-blue-200 bg-gradient-to-br from-white to-blue-50 p-4 md:p-5 dark:from-card dark:to-blue-950/30">
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
                  <Link href="/activity" className="text-sm font-bold text-fuchsia-600 underline-offset-4 hover:underline">
                    Timeline
                  </Link>
                }
              />
              <Panel className="overflow-hidden border-fuchsia-200 bg-gradient-to-br from-white to-fuchsia-50 dark:from-card dark:to-fuchsia-950/20">
                <ol>
                  {(activity.data?.items ?? []).slice(0, 7).map((item, index) => (
                    <li key={`${item.kind}-${item.id}`} className={index === 0 ? "" : "border-t border-fuchsia-100 dark:border-fuchsia-500/15"}>
                      <Link
                        href={item.href}
                        className="group flex items-center justify-between gap-3 px-4 py-3.5 transition-colors duration-200 hover:bg-fuchsia-100/60 dark:hover:bg-fuchsia-500/10"
                      >
                        <span className="min-w-0">
                          <span className="kicker">{item.kind}</span>
                          <span className="mt-1 block truncate text-sm font-bold tracking-tight group-hover:text-fuchsia-700 dark:group-hover:text-fuchsia-300">
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
