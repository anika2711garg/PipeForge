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
    retry: 0,
    refetchInterval: 12_000,
  });

  if (!health.isError) {
    return null;
  }

  return (
    <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          PipeForge API is currently unavailable. The control center cannot load warehouse data from{" "}
          <span className="font-medium">{getApiBaseUrl()}</span>.
        </p>
        <Button type="button" size="sm" onClick={() => void health.refetch()}>
          Retry
        </Button>
      </div>
    </div>
  );
}
