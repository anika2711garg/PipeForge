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
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-2xl">
        <div
          className="mb-3 h-1 w-14 rounded-full bg-gradient-to-r from-[#3A5FCD] via-[#7a8ec8] to-[#c4b5a0] motion-safe:animate-gradient bg-[length:200%_100%]"
          aria-hidden="true"
        />
        <h1 className="display text-[1.85rem] sm:text-[2.2rem]">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-xl text-[0.95rem] leading-7 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </motion.header>
  );
}
