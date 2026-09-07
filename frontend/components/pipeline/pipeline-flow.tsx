"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils/cn";

const STAGES = [
  { label: "Incoming", detail: "JSONL files", tone: "from-sky-400 to-blue-600" },
  { label: "Validate", detail: "Parse & check", tone: "from-violet-400 to-fuchsia-600" },
  { label: "Dedup", detail: "Identity rules", tone: "from-amber-400 to-orange-500" },
  { label: "Warehouse", detail: "SQLite write", tone: "from-teal-400 to-emerald-600" },
  { label: "Metrics", detail: "UTC aggregates", tone: "from-rose-400 to-pink-600" },
] as const;

export function PipelineFlow({
  running,
  status,
}: {
  running: boolean;
  status: string | null;
}) {
  const reduce = useReducedMotion();
  const tone =
    status === "failed" ? "failed" : status === "completed" || status === "Live" ? "ok" : running ? "run" : "idle";

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-cyan-200 bg-gradient-to-br from-white via-cyan-50 to-blue-100 p-5 shadow-card md:p-6 dark:border-cyan-500/20 dark:from-card dark:via-cyan-950/30 dark:to-blue-950/40">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker">Ingest path</p>
          <h2 className="mt-1.5 text-lg font-extrabold tracking-tight">Pipeline stages</h2>
          <p className="mt-1 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
            {running
              ? "Records are moving through validation, deduplication, and warehouse writes."
              : "Malformed lines leave after Validate. Conflicts quarantine without overwrite."}
          </p>
        </div>
        {running ? (
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
            <span className="relative flex h-2 w-2">
              {!reduce ? <span className="absolute inset-0 rounded-full bg-white motion-safe:animate-pulse-ring" /> : null}
              <span className="relative h-2 w-2 rounded-full bg-white" />
            </span>
            Running
          </span>
        ) : null}
      </div>

      <ol className="grid gap-3 sm:grid-cols-5">
        {STAGES.map((stage, index) => (
          <motion.li
            key={stage.label}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {index < STAGES.length - 1 ? (
              <span
                className="pointer-events-none absolute left-[calc(100%-2px)] top-[1.35rem] z-10 hidden h-1 w-[calc(100%-8px)] overflow-hidden rounded-full bg-gradient-to-r from-blue-300 to-fuchsia-300 sm:block"
                aria-hidden="true"
              >
                {tone === "run" && !reduce ? (
                  <span className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white to-transparent motion-safe:animate-flow-line" />
                ) : null}
              </span>
            ) : null}
            <div
              className={cn(
                "rounded-2xl border border-white/40 bg-white/80 p-[1px] shadow-card backdrop-blur-sm dark:bg-slate-900/50",
                tone === "run" && "ring-2 ring-blue-400/60",
              )}
            >
              <div className={cn("rounded-[0.95rem] bg-gradient-to-br p-3.5 text-white", stage.tone)}>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-extrabold backdrop-blur-sm">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-3 text-sm font-extrabold tracking-tight">{stage.label}</p>
                <p className="mt-1 text-xs leading-5 text-white/85">{stage.detail}</p>
              </div>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
