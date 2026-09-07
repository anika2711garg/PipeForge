import { AlertCircle, Check, CircleDashed, LoaderCircle, SkipForward, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const STATUS_META: Record<
  string,
  { label: string; icon: typeof Check; className: string }
> = {
  completed: {
    label: "Completed",
    icon: Check,
    className: "bg-emerald-500 text-white border-emerald-400 shadow-[0_6px_16px_rgba(16,185,129,0.35)]",
  },
  success: {
    label: "Completed",
    icon: Check,
    className: "bg-emerald-500 text-white border-emerald-400 shadow-[0_6px_16px_rgba(16,185,129,0.35)]",
  },
  running: {
    label: "Running",
    icon: LoaderCircle,
    className: "bg-blue-500 text-white border-blue-400 shadow-[0_6px_16px_rgba(59,130,246,0.35)]",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    className: "bg-rose-500 text-white border-rose-400 shadow-[0_6px_16px_rgba(244,63,94,0.35)]",
  },
  quarantined: {
    label: "Quarantined",
    icon: TriangleAlert,
    className: "bg-amber-500 text-white border-amber-400 shadow-[0_6px_16px_rgba(245,158,11,0.35)]",
  },
  skipped: {
    label: "Skipped",
    icon: SkipForward,
    className: "bg-slate-500 text-white border-slate-400",
  },
  healthy: {
    label: "Healthy",
    icon: Check,
    className: "bg-emerald-500 text-white border-emerald-400",
  },
  degraded: {
    label: "Degraded",
    icon: TriangleAlert,
    className: "bg-amber-500 text-white border-amber-400",
  },
  offline: {
    label: "Offline",
    icon: AlertCircle,
    className: "bg-rose-500 text-white border-rose-400",
  },
  checking: {
    label: "Checking",
    icon: LoaderCircle,
    className: "bg-violet-500 text-white border-violet-400",
  },
  never: {
    label: "Never run",
    icon: CircleDashed,
    className: "bg-slate-400 text-white border-slate-300",
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
    className: "bg-slate-500 text-white border-slate-400",
  };
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
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
