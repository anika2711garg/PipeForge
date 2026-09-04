import { AlertCircle, Check, CircleDashed, LoaderCircle, SkipForward, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const STATUS_META: Record<
  string,
  { label: string; icon: typeof Check; className: string }
> = {
  completed: {
    label: "Completed",
    icon: Check,
    className: "bg-success/10 text-success border-success/20",
  },
  success: {
    label: "Completed",
    icon: Check,
    className: "bg-success/10 text-success border-success/20",
  },
  running: {
    label: "Running",
    icon: LoaderCircle,
    className: "bg-info/10 text-info border-info/20",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  quarantined: {
    label: "Quarantined",
    icon: TriangleAlert,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  skipped: {
    label: "Skipped",
    icon: SkipForward,
    className: "bg-muted text-muted-foreground border-border",
  },
  healthy: {
    label: "Healthy",
    icon: Check,
    className: "bg-success/10 text-success border-success/20",
  },
  degraded: {
    label: "Degraded",
    icon: TriangleAlert,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  offline: {
    label: "Offline",
    icon: AlertCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  checking: {
    label: "Checking",
    icon: LoaderCircle,
    className: "bg-muted text-muted-foreground border-border",
  },
  never: {
    label: "Never run",
    icon: CircleDashed,
    className: "bg-muted text-muted-foreground border-border",
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
    className: "bg-muted text-muted-foreground border-border",
  };
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs font-medium",
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
