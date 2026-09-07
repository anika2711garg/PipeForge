"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { StaggerItem } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils/cn";

import { Skeleton } from "./skeleton";

const THEMES = [
  {
    card: "border-[#c9d6ef] bg-gradient-to-br from-white to-[#e8eef9]",
    accent: "bg-[#3A5FCD]",
    kicker: "text-[#3A5FCD]",
  },
  {
    card: "border-[#cfe3de] bg-gradient-to-br from-white to-[#e7f2ef]",
    accent: "bg-[#3d7a6e]",
    kicker: "text-[#3d7a6e]",
  },
  {
    card: "border-[#e6d9c8] bg-gradient-to-br from-white to-[#f4eee6]",
    accent: "bg-[#9a7850]",
    kicker: "text-[#9a7850]",
  },
  {
    card: "border-[#d8d2e8] bg-gradient-to-br from-white to-[#eeeaf6]",
    accent: "bg-[#6b5b95]",
    kicker: "text-[#6b5b95]",
  },
  {
    card: "border-[#d0dceb] bg-gradient-to-br from-white to-[#e9eef5]",
    accent: "bg-[#4a6785]",
    kicker: "text-[#4a6785]",
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
      whileHover={href && !reduce ? { y: -3 } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative h-full overflow-hidden rounded-[1.3rem] border px-4 py-4 shadow-card dark:border-white/10 dark:from-card dark:to-tint",
        theme.card,
        href && "interactive-lift",
      )}
    >
      <span className={cn("absolute inset-y-3 left-0 w-1 rounded-full", theme.accent)} aria-hidden="true" />
      <p className={cn("pl-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em]", theme.kicker)}>{label}</p>
      {loading ? (
        <Skeleton className="ml-2 mt-3 h-8 w-24" />
      ) : (
        <p className="mt-2.5 pl-2 truncate text-[1.4rem] font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
      )}
      {hint ? <p className="mt-1.5 pl-2 text-xs leading-5 text-muted-foreground">{hint}</p> : null}
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
