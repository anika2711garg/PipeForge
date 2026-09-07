import { AlertCircle, Check, CircleDashed, LoaderCircle, SkipForward, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const STATUS_META: Record<
  string,
  { label: string; icon: typeof Check; className: string }
> = {
  completed: {
    label: "Completed",
    icon: Check,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
  },
  success: {
    label: "Completed",
    icon: Check,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
  },
  running: {
    label: "Running",
    icon: LoaderCircle,
    className: "bg-[#eef2f8] text-[#3A5FCD] border-[#c9d6ef] dark:bg-primary/15 dark:text-primary dark:border-primary/25",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/25",
  },
  quarantined: {
    label: "Quarantined",
    icon: TriangleAlert,
    className: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25",
  },
  skipped: {
    label: "Skipped",
    icon: SkipForward,
    className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-muted dark:text-muted-foreground dark:border-border",
  },
  healthy: {
    label: "Healthy",
    icon: Check,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
  },
  degraded: {
    label: "Degraded",
    icon: TriangleAlert,
    className: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25",
  },
  offline: {
    label: "Offline",
    icon: AlertCircle,
    className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/25",
  },
  checking: {
    label: "Checking",
    icon: LoaderCircle,
    className: "bg-[#eeeaf6] text-[#6b5b95] border-[#d8d2e8] dark:bg-lavender dark:text-foreground dark:border-border",
  },
  never: {
    label: "Never run",
    icon: CircleDashed,
    className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-muted dark:text-muted-foreground dark:border-border",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  const key = (status || "never").toLowerCase();
  const meta = STATUS_META[key] ?? {
    label: status || "Unknown",
    icon: CircleDashed,
    className: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        meta.className,
        className,
      )}
    >
      <Icon
        className={cn("h-3 w-3", key === "running" || key === "checking" ? "animate-spin" : "")}
        aria-hidden="true"
      />
      <span>{meta.label}</span>
    </span>
  );
}
