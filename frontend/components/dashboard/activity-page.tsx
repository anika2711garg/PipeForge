"use client";

import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/fade-in";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { fetchActivity } from "@/lib/api/activity";
import { formatRelative, formatTimestamp } from "@/lib/format/dates";
import { queryKeys } from "@/lib/utils/query-keys";
import { usePreferences } from "@/providers/preferences-provider";

export function ActivityPage() {
  const activity = useQuery({
    queryKey: [...queryKeys.activity, 40] as const,
    queryFn: () => fetchActivity(40),
  });
  const { preferences } = usePreferences();
  const [kind, setKind] = useState("all");

  const items = useMemo(() => {
    const list = activity.data?.items ?? [];
    if (kind === "all") return list;
    return list.filter((item) => item.kind === kind);
  }, [activity.data, kind]);

  if (activity.isError) {
    return (
      <ErrorState
        message={activity.error instanceof Error ? activity.error.message : "Unable to load activity."}
        onRetry={() => void activity.refetch()}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Activity"
        description="Recent runs, files, and quarantine records from the warehouse, newest first."
      />
      <FadeIn className="mb-5">
        <Select value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="all">All kinds</option>
          <option value="run">Runs</option>
          <option value="file">Files</option>
          <option value="quarantine">Quarantine</option>
        </Select>
      </FadeIn>
      {activity.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity yet"
          description="Generate a demo batch and run the pipeline to populate this timeline."
        />
      ) : (
        <Stagger className="space-y-2">
          {items.map((item) => (
            <StaggerItem key={`${item.kind}-${item.id}`}>
              <Link
                href={item.href}
                className="surface interactive-lift flex items-start justify-between gap-4 rounded-2xl px-4 py-4 transition-colors duration-200 hover:bg-tint"
              >
                <div className="min-w-0">
                  <p className="kicker">{item.kind}</p>
                  <p className="mt-1.5 truncate font-semibold tracking-tight">{item.title}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{item.detail ?? "—"}</p>
                </div>
                <div className="shrink-0 text-right">
                  {item.status ? <StatusBadge status={item.status} /> : null}
                  <p className="mt-2 text-xs text-muted-foreground" title={formatTimestamp(item.at, preferences.timeDisplay)}>
                    {formatRelative(item.at)}
                  </p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
