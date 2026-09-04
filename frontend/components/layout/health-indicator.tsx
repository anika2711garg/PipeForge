"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchHealth } from "@/lib/api/health";
import { queryKeys } from "@/lib/utils/query-keys";

import { StatusBadge } from "../ui/status-badge";
import { Tooltip } from "../ui/tooltip";

export function HealthIndicator() {
  const health = useQuery({
    queryKey: queryKeys.health,
    queryFn: fetchHealth,
    refetchInterval: 12_000,
    retry: 0,
  });

  if (health.isPending && !health.data) {
    return <StatusBadge status="checking" />;
  }

  if (health.isError) {
    return (
      <Tooltip content="The FastAPI dashboard did not respond.">
        <StatusBadge status="offline" />
      </Tooltip>
    );
  }

  const snapshot = health.data;
  const label =
    snapshot?.status === "healthy"
      ? "API and warehouse responded successfully."
      : `API ${snapshot?.api ?? "unknown"}, database ${snapshot?.database ?? "unknown"}.`;

  return (
    <Tooltip content={label}>
      <StatusBadge status={snapshot?.status ?? "degraded"} />
    </Tooltip>
  );
}
