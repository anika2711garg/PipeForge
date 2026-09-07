"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchActivity } from "@/lib/api/activity";
import { fetchAlerts } from "@/lib/api/alerts";
import { fetchFiles } from "@/lib/api/files";
import { fetchHealth } from "@/lib/api/health";
import { fetchInsights } from "@/lib/api/insights";
import { fetchMetrics } from "@/lib/api/metrics";
import { fetchQuarantine } from "@/lib/api/quarantine";
import { fetchRuns } from "@/lib/api/runs";
import { fetchStatus } from "@/lib/api/status";
import { queryKeys } from "@/lib/utils/query-keys";
import { usePreferences } from "@/providers/preferences-provider";

export function useDashboardData() {
  const { preferences } = usePreferences();
  const refetchInterval = preferences.autoRefresh ? preferences.refreshIntervalMs : false;

  const status = useQuery({
    queryKey: queryKeys.status,
    queryFn: fetchStatus,
    refetchInterval,
  });
  const health = useQuery({
    queryKey: queryKeys.health,
    queryFn: fetchHealth,
    refetchInterval: preferences.autoRefresh ? Math.min(preferences.refreshIntervalMs, 12_000) : false,
  });
  const runs = useQuery({ queryKey: queryKeys.runs, queryFn: fetchRuns, refetchInterval });
  const files = useQuery({ queryKey: queryKeys.files, queryFn: fetchFiles, refetchInterval });
  const metrics = useQuery({ queryKey: queryKeys.metrics, queryFn: fetchMetrics, refetchInterval });
  const quarantine = useQuery({
    queryKey: queryKeys.quarantine,
    queryFn: fetchQuarantine,
    refetchInterval,
  });
  const insights = useQuery({
    queryKey: queryKeys.insights,
    queryFn: fetchInsights,
    refetchInterval,
  });
  const activity = useQuery({
    queryKey: queryKeys.activity,
    queryFn: () => fetchActivity(12),
    refetchInterval,
  });
  const alerts = useQuery({
    queryKey: queryKeys.alerts,
    queryFn: fetchAlerts,
    refetchInterval,
  });

  return { status, health, runs, files, metrics, quarantine, insights, activity, alerts };
}
