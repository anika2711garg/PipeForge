"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { EventVolumeChart, TypeBreakdownChart } from "@/components/charts/metrics-charts";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/fade-in";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatPercent } from "@/lib/format/rates";
import { formatInteger } from "@/lib/format/numbers";
import { formatRelative } from "@/lib/format/dates";

export function InsightsPage() {
  const { insights, metrics } = useDashboardData();

  if (insights.isError) {
    return (
      <ErrorState
        message={insights.error instanceof Error ? insights.error.message : "Unable to load insights."}
        onRetry={() => void insights.refetch()}
      />
    );
  }

  const data = insights.data;
  const rows = metrics.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Insights"
        description="Rates and counts derived from warehouse runs, events, and quarantine. No estimated values."
      />
      {insights.isPending || !data ? (
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : data.total_runs === 0 && data.total_events === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No warehouse activity yet"
          description="Run the pipeline to compute success, duplicate, and quarantine rates."
        />
      ) : (
        <>
          <Stagger className="surface overflow-hidden rounded-[1.5rem] grid grid-cols-2 divide-y divide-border md:grid-cols-4 md:divide-x md:divide-y-0">
            <RateCard label="Success" value={formatPercent(data.success_percent)} hint={`${data.completed_runs} of ${data.total_runs} runs`} />
            <RateCard label="Duplicates" value={formatPercent(data.duplicate_percent)} hint={`${formatInteger(data.duplicate_event_rows)} extra rows`} />
            <RateCard label="Quarantine" value={formatPercent(data.quarantine_percent)} hint={`${formatInteger(data.quarantined_records)} records`} />
            <RateCard label="Pending files" value={formatInteger(data.pending_files)} hint={`${formatInteger(data.changed_files)} changed after ingest`} />
          </Stagger>
          <FadeIn className="grid gap-3 md:grid-cols-3">
            <InsightLink href="/runs" label="Completed runs" value={formatInteger(data.completed_runs)} />
            <InsightLink href="/runs" label="Failed runs" value={formatInteger(data.failed_runs)} />
            <InsightLink href="/explorer" label="Logical events" value={formatInteger(data.logical_events)} />
          </FadeIn>
          {data.latest_run ? (
            <p className="text-sm text-muted-foreground">
              Latest run{" "}
              <Link href={`/runs/${data.latest_run.run_id}`} className="font-mono text-foreground underline-offset-4 hover:underline">
                {data.latest_run.run_id}
              </Link>{" "}
              <StatusBadge status={data.latest_run.status} /> · {formatRelative(data.latest_run.completed_at ?? data.latest_run.started_at)}
            </p>
          ) : null}
          {rows.length > 0 ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <section>
                <h2 className="mb-3 text-[0.95rem] font-semibold tracking-tight">Event volume</h2>
                <div className="surface rounded-[1.5rem] p-4 md:p-5">
                  <EventVolumeChart rows={rows} />
                </div>
              </section>
              <section>
                <h2 className="mb-3 text-[0.95rem] font-semibold tracking-tight">By type</h2>
                <div className="surface rounded-[1.5rem] p-4 md:p-5">
                  <TypeBreakdownChart rows={rows} />
                </div>
              </section>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function RateCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <StaggerItem>
      <article className="px-5 py-5">
        <p className="kicker">{label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </article>
    </StaggerItem>
  );
}

function InsightLink({ href, label, value }: { href: string; label: string; value: string }) {
  return (
    <Link href={href} className="surface interactive-lift block rounded-[1.25rem] px-5 py-5 transition-colors duration-200 hover:bg-tint">
      <p className="kicker">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight">{value}</p>
    </Link>
  );
}
