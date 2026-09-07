"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.header
      className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between"
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-2xl rounded-[1.5rem] border border-blue-200/80 bg-white/70 px-5 py-4 shadow-card backdrop-blur-md dark:border-blue-500/20 dark:bg-slate-900/60 sm:px-6">
        <div
          className="mb-3 h-2 w-24 rounded-full bg-[linear-gradient(90deg,#3b82f6,#a855f7,#f97316,#14b8a6)] bg-[length:200%_100%] motion-safe:animate-gradient"
          aria-hidden="true"
        />
        <h1 className="display bg-gradient-to-r from-blue-700 via-violet-700 to-fuchsia-600 bg-clip-text text-[1.95rem] text-transparent sm:text-[2.35rem] dark:from-blue-300 dark:via-violet-300 dark:to-fuchsia-300">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-xl text-[0.95rem] leading-7 text-slate-600 dark:text-slate-300">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </motion.header>
  );
}
