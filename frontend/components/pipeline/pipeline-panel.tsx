"use client";

import Link from "next/link";

import { FadeIn } from "@/components/motion/fade-in";
import { formatDuration, formatTimestamp } from "@/lib/format/dates";
import type { StatusSnapshot } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-8">
      <FadeIn className="glass rounded-3xl border border-border p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="display text-5xl sm:text-6xl">Pipeline</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {latest
                ? `${latest.status} · ${formatTimestamp(latest.started_at, preferences.timeDisplay)} · ${formatDuration(latest.started_at, latest.completed_at)}`
                : "Never run"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <RunPipelineButton />
            <Link href="/runs">
              <Button type="button" variant="outline">
                History
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>
      {(lastResult?.error || latest?.error) ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {lastResult?.error || latest?.error}
        </p>
      ) : null}
      <PipelineFlow running={isPending} status={runStatus} />
    </div>
  );
}
