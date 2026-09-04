"use client";

import type { ReactNode } from "react";

import { FadeIn } from "@/components/motion/fade-in";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <FadeIn className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h1 className="display text-5xl sm:text-6xl">{title}</h1>
        {description ? (
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </FadeIn>
  );
}
