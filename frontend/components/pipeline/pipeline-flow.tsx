"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils/cn";

const STAGES = [
  { label: "Incoming", detail: "JSONL files" },
  { label: "Validate", detail: "Parse & check" },
  { label: "Dedup", detail: "Identity rules" },
  { label: "Warehouse", detail: "SQLite write" },
  { label: "Metrics", detail: "UTC aggregates" },
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
    <section className="overflow-hidden rounded-[1.5rem] border border-[#d8dee8]/90 bg-white/75 p-5 shadow-card backdrop-blur-md md:p-6 dark:border-border dark:bg-card/80">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker">Ingest path</p>
          <h2 className="mt-1.5 text-lg font-semibold tracking-tight">Pipeline stages</h2>
          <p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">
            {running
              ? "Records are moving through validation, deduplication, and warehouse writes."
              : "Malformed lines leave after Validate. Conflicts quarantine without overwrite."}
          </p>
        </div>
        {running ? (
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-[#eef2f8] px-3 py-1.5 text-xs font-semibold text-[#3A5FCD]">
            <span className="relative flex h-2 w-2">
              {!reduce ? <span className="absolute inset-0 rounded-full bg-[#3A5FCD] motion-safe:animate-pulse-ring" /> : null}
              <span className="relative h-2 w-2 rounded-full bg-[#3A5FCD]" />
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
            transition={{ delay: reduce ? 0 : index * 0.06, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {index < STAGES.length - 1 ? (
              <span
                className="pointer-events-none absolute left-[calc(100%-2px)] top-[1.35rem] z-10 hidden h-px w-[calc(100%-8px)] overflow-hidden bg-[#d5dde9] sm:block"
                aria-hidden="true"
              >
                {tone === "run" && !reduce ? (
                  <span className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#3A5FCD] to-transparent motion-safe:animate-flow-line" />
                ) : null}
              </span>
            ) : null}
            <div
              className={cn(
                "rounded-2xl border bg-[#f8f7f4]/80 px-3.5 py-4 transition-[border-color,background-color,box-shadow] duration-200 dark:bg-background/60",
                tone === "run" && "border-[#3A5FCD]/35 bg-[#eef2f8]/90 shadow-[0_10px_24px_rgba(58,95,205,0.1)]",
                tone === "ok" && "border-success/30",
                tone === "failed" && "border-destructive/30",
                tone === "idle" && "border-[#d8dee8] dark:border-border",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                  tone === "run" ? "bg-[#3A5FCD] text-white" : "bg-[#eef2f8] text-[#3A5FCD] dark:bg-tint",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-3 text-sm font-semibold tracking-tight">{stage.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{stage.detail}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
