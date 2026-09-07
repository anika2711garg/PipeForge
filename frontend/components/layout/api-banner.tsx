"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchHealth } from "@/lib/api/health";
import { getApiBaseUrl } from "@/lib/api/client";
import { queryKeys } from "@/lib/utils/query-keys";
import { Button } from "@/components/ui/button";

export function ApiBanner() {
  const health = useQuery({
    queryKey: queryKeys.health,
    queryFn: fetchHealth,
    retry: 1,
    refetchInterval: 8_000,
  });

  if (!health.isError) {
    return null;
  }

  return (
    <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm">
      <div className="mx-auto flex max-w-[var(--page-max)] flex-wrap items-center justify-between gap-3">
        <p className="text-destructive">
          PipeForge API is currently unavailable at{" "}
          <span className="font-semibold">{getApiBaseUrl()}</span>. Start FastAPI on port 8002, then retry.
        </p>
        <Button type="button" size="sm" variant="outline" onClick={() => void health.refetch()}>
          Retry connection
        </Button>
      </div>
    </div>
  );
}
