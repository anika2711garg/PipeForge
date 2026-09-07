"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { NAV_ITEMS } from "@/components/layout/nav-items";
import { PageHeader } from "@/components/ui/page-header";
import { resolveApiOrigin } from "@/lib/api/client";
import { queryKeys } from "@/lib/utils/query-keys";

const SHORTCUTS = [
  { keys: "Ctrl K", action: "Open the command palette" },
  { keys: "Esc", action: "Close palettes and drawers" },
  { keys: "↑ ↓ Enter", action: "Move and run a command" },
  { keys: "Toggle", action: "Switch light and dark mode from the header or sidebar" },
];

export function HelpPage() {
  const origin = useQuery({
    queryKey: queryKeys.apiOrigin,
    queryFn: resolveApiOrigin,
  });

  return (
    <div className="space-y-10">
      <PageHeader
        title="Help"
        description="Keyboard shortcuts, routes, and the FastAPI reference that this UI reads from."
      />
      <section>
        <h2 className="mb-3 text-sm font-medium">Shortcuts</h2>
        <ul className="space-y-2">
          {SHORTCUTS.map((item) => (
            <li key={item.keys} className="flex items-center justify-between border-b border-border px-1 py-3 text-sm">
              <span>{item.action}</span>
              <kbd className="rounded-md border border-border px-2 py-1 font-mono text-[11px]">{item.keys}</kbd>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-3 text-sm font-medium">Pages</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block border-b border-border px-1 py-3 text-sm transition-colors duration-200 hover:bg-muted/40">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="border-t border-border pt-6 text-sm leading-6 text-muted-foreground">
        <p>
          The control center never invents warehouse numbers. Empty states mean the SQLite warehouse has no rows yet.
        </p>
        {origin.data ? (
          <p className="mt-3">
            API docs:{" "}
            <a className="text-foreground underline-offset-4 hover:underline" href={`${origin.data}/api/docs`} target="_blank" rel="noreferrer">
              {origin.data}/api/docs
            </a>
          </p>
        ) : (
          <p className="mt-3">Start FastAPI to open interactive docs at /api/docs.</p>
        )}
      </section>
    </div>
  );
}
