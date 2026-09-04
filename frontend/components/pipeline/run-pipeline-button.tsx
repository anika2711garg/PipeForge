"use client";

import { LoaderCircle, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { usePipelineActions } from "@/providers/pipeline-provider";

export function RunPipelineButton({ disabledReason }: { disabledReason?: string }) {
  const { run, isPending } = usePipelineActions();
  return (
    <Button
      type="button"
      variant="primary"
      disabled={isPending}
      title={isPending ? "A pipeline run is already in progress." : disabledReason}
      onClick={run}
      className={cn(isPending && "glow-ring")}
    >
      {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
      {isPending ? "Running…" : "Run Pipeline"}
    </Button>
  );
}
