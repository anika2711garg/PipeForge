"use client";

import { Gauge } from "lucide-react";

import { AmountChart, EventVolumeChart, TypeBreakdownChart } from "@/components/charts/metrics-charts";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="space-y-10">
      <PageHeader
        title="Metrics"
        description="UTC daily aggregates supplied by the warehouse. Amounts are integer minor units."
      />
      {metrics.isPending ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No daily metrics yet"
          description="Run the pipeline against incoming events to populate UTC daily aggregates."
        />
      ) : (
        <>
          <div className="grid gap-10 xl:grid-cols-2">
            <section>
              <h2 className="mb-4 text-sm font-medium">Events over time</h2>
              <EventVolumeChart rows={rows} />
            </section>
            <section>
              <h2 className="mb-4 text-sm font-medium">Amount over time</h2>
              <AmountChart rows={rows} />
            </section>
            <section className="xl:col-span-2">
              <h2 className="mb-4 text-sm font-medium">Events and amount by type</h2>
              <TypeBreakdownChart rows={rows} />
            </section>
          </div>
          <section className="border-t border-border pt-8">
            <h2 className="mb-4 text-sm font-medium">Daily metrics</h2>
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
                  <tr key={`${row.metric_date}-${row.event_type}`} className="hover:bg-muted/60">
                    <Td>{row.metric_date}</Td>
                    <Td>{row.event_type}</Td>
                    <Td>{formatInteger(row.event_count)}</Td>
                    <Td>{formatMinorUnitsExact(row.total_amount_minor_units)}</Td>
                    <Td>{formatInteger(row.total_amount_minor_units)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </section>
        </>
      )}
    </div>
  );
}
