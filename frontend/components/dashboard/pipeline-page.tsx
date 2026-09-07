"use client";

import { DemoTools } from "@/components/dashboard/demo-tools";
import { PipelinePanel } from "@/components/pipeline/pipeline-panel";
import { ErrorState } from "@/components/feedback/error-state";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export function PipelinePage() {
  const { status } = useDashboardData();

  if (status.isError) {
    return (
      <ErrorState
        message={status.error instanceof Error ? status.error.message : "Unable to load pipeline status."}
        onRetry={() => void status.refetch()}
      />
    );
  }

  return (
    <div className="space-y-[var(--space-section)]">
      <PipelinePanel status={status.data} />
      <DemoTools />
    </div>
  );
}
