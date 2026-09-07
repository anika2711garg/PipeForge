"use client";

import Link from "next/link";

import type { AlertItem } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

export function AlertsPanel({ items }: { items: AlertItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2" aria-label="Alerts">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={cn(
            "interactive-lift surface block rounded-xl px-4 py-3 text-sm",
            item.severity === "error" && "border-destructive/25",
            item.severity === "warning" && "border-warning/25",
          )}
        >
          <p
            className={cn(
              "font-medium",
              item.severity === "error" && "text-destructive",
              item.severity === "warning" && "text-warning",
            )}
          >
            {item.title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
        </Link>
      ))}
    </section>
  );
}
