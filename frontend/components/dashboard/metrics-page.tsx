"use client";

import { Gauge } from "lucide-react";

import { AmountChart, EventVolumeChart, TypeBreakdownChart } from "@/components/charts/metrics-charts";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FadeIn, Reveal } from "@/components/motion/fade-in";
import { ExportButton } from "@/components/ui/export-button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatMinorUnitsExact } from "@/lib/format/money";
import { formatInteger } from "@/lib/format/numbers";

export function MetricsPage() {
  const { metrics } = useDashboardData();
  const rows = metrics.data ?? [];

  if (metrics.isError) {
    return (
      <ErrorState
        message={metrics.error instanceof Error ? metrics.error.message : "Unable to load metrics."}
        onRetry={() => void metrics.refetch()}
      />
    );
  }

  return (
    <div className="space-y-[var(--space-section)]">
      <PageHeader
        title="Metrics"
        description="UTC daily aggregates supplied by the warehouse. Amounts are integer minor units."
        actions={<ExportButton kind="metrics" />}
      />
      {metrics.isPending ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-[1.5rem]" />
          <Skeleton className="h-72 rounded-[1.5rem]" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No daily metrics yet"
          description="Run the pipeline against incoming events to populate UTC daily aggregates."
        />
      ) : (
        <>
          <FadeIn>
            <div className="grid gap-6 xl:grid-cols-2">
              <section>
                <SectionHeading title="Events over time" description="Accepted warehouse events by UTC day." />
                <Panel className="p-4 md:p-5">
                  <EventVolumeChart rows={rows} />
                </Panel>
              </section>
              <section>
                <SectionHeading title="Amount over time" description="Summed minor units by UTC day." />
                <Panel className="p-4 md:p-5">
                  <AmountChart rows={rows} />
                </Panel>
              </section>
              <section className="xl:col-span-2">
                <SectionHeading title="By event type" description="Volume and amount across event types." />
                <Panel className="p-4 md:p-5">
                  <TypeBreakdownChart rows={rows} />
                </Panel>
              </section>
            </div>
          </FadeIn>
          <Reveal>
            <section>
              <SectionHeading title="Daily metrics" description="Exact warehouse aggregates for export and audit." />
              <Panel className="overflow-hidden rounded-[1.5rem]">
                <Table>
                  <THead>
                    <tr>
                      <Th>Date (UTC)</Th>
                      <Th>Event type</Th>
                      <Th>Event count</Th>
                      <Th>Total amount (exact)</Th>
                      <Th>Minor units</Th>
                    </tr>
                  </THead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={`${row.metric_date}-${row.event_type}`} className="transition-colors duration-150 hover:bg-tint">
                        <Td>{row.metric_date}</Td>
                        <Td>{row.event_type}</Td>
                        <Td className="tabular-nums">{formatInteger(row.event_count)}</Td>
                        <Td className="tabular-nums">{formatMinorUnitsExact(row.total_amount_minor_units)}</Td>
                        <Td className="tabular-nums">{formatInteger(row.total_amount_minor_units)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Panel>
            </section>
          </Reveal>
        </>
      )}
    </div>
  );
}
