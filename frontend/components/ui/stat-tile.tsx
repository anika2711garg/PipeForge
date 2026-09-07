"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { StaggerItem } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils/cn";

import { Skeleton } from "./skeleton";

const THEMES = [
  {
    card: "border-blue-300 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_14px_30px_rgba(37,99,235,0.35)]",
    kicker: "text-blue-100",
    blob: "bg-white/25",
  },
  {
    card: "border-teal-300 bg-gradient-to-br from-teal-400 to-emerald-600 text-white shadow-[0_14px_30px_rgba(13,148,136,0.35)]",
    kicker: "text-teal-50",
    blob: "bg-white/25",
  },
  {
    card: "border-orange-300 bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-[0_14px_30px_rgba(249,115,22,0.35)]",
    kicker: "text-orange-50",
    blob: "bg-white/25",
  },
  {
    card: "border-violet-300 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-[0_14px_30px_rgba(139,92,246,0.35)]",
    kicker: "text-violet-100",
    blob: "bg-white/25",
  },
  {
    card: "border-cyan-300 bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_14px_30px_rgba(6,182,212,0.35)]",
    kicker: "text-cyan-50",
    blob: "bg-white/25",
  },
] as const;

export function StatTile({
  label,
  value,
  hint,
  loading,
  href,
  accent = false,
  index = 0,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  loading?: boolean;
  href?: string;
  accent?: boolean;
  index?: number;
}) {
  const reduce = useReducedMotion();
  const theme = THEMES[(accent ? 0 : index) % THEMES.length];
  const body = (
    <motion.article
      whileHover={href && !reduce ? { y: -5, scale: 1.02 } : undefined}
      transition={{ duration: 0.18 }}
      className={cn(
        "relative h-full overflow-hidden rounded-[1.4rem] border px-4 py-4",
        theme.card,
        href && "interactive-lift",
      )}
    >
      <div className={cn("pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl", theme.blob)} aria-hidden="true" />
      <p className={cn("text-[0.68rem] font-extrabold uppercase tracking-[0.14em]", theme.kicker)}>{label}</p>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-24 bg-white/30" />
      ) : (
        <p className="mt-2.5 truncate text-[1.55rem] font-extrabold tabular-nums tracking-tight">{value}</p>
      )}
      {hint ? <p className="mt-1.5 text-xs leading-5 text-white/85">{hint}</p> : null}
    </motion.article>
  );

  return (
    <StaggerItem>
      {href ? (
        <Link href={href} className="block h-full">
          {body}
        </Link>
      ) : (
        body
      )}
    </StaggerItem>
  );
}
