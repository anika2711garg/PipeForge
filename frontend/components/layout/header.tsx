"use client";

import { Menu, RefreshCw, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { HealthIndicator } from "./health-indicator";
import { useToast } from "@/providers/toast-provider";

export function Header({
  onOpenNav,
  onOpenCommand,
}: {
  onOpenNav: () => void;
  onOpenCommand: () => void;
}) {
  const client = useQueryClient();
  const { push } = useToast();

  async function refresh() {
    try {
      await client.invalidateQueries();
      push({ kind: "info", title: "Data refreshed" });
    } catch (error) {
      push({
        kind: "error",
        title: "Refresh failed",
        description: error instanceof Error ? error.message : "Unable to refresh",
      });
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/55 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="lg:hidden"
            onClick={onOpenNav}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={onOpenCommand}
            className="hidden h-10 min-w-[260px] items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 md:flex"
          >
            <span className="inline-flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              Search the warehouse
            </span>
            <kbd className="rounded-md border border-border px-1.5 font-mono text-[10px] text-muted-foreground/70">
              Ctrl K
            </kbd>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <HealthIndicator />
          <Button type="button" size="icon" variant="ghost" onClick={() => void refresh()} aria-label="Refresh data">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="md:hidden" onClick={onOpenCommand} aria-label="Open search">
            <Search className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
