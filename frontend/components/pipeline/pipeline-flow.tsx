"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils/cn";

const STAGES = ["Incoming", "Validate", "Dedup", "Warehouse", "Metrics"] as const;

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
    <section className="glass rounded-3xl border border-border p-5 md:p-6">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium">Live path</h2>
        <p className="text-xs text-muted-foreground">
          {running ? "Records are moving through the stages." : "Invalid lines leave after Validate."}
        </p>
      </div>
      <ol className="grid gap-3 sm:grid-cols-5">
        {STAGES.map((label, index) => (
          <motion.li
            key={label}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.4 }}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border bg-background/50 px-4 py-5",
              tone === "run" && "glow-ring",
            )}
          >
            {tone === "run" ? (
              <motion.span
                className="absolute inset-x-0 top-0 h-0.5 bg-primary"
                initial={reduce ? false : { x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
              />
            ) : (
              <span
                className={cn(
                  "absolute inset-x-0 top-0 h-0.5",
                  tone === "ok" && "bg-success",
                  tone === "failed" && "bg-destructive",
                  tone === "idle" && "bg-border",
                )}
              />
            )}
            <p className="font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
            <p className="mt-2 text-base font-medium">{label}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
