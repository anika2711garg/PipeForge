"use client";

import { Menu, RefreshCw, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { ModeSwitch } from "@/components/ui/mode-switch";
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
    <header className="sticky top-0 z-40 border-b border-blue-200/70 bg-white/55 backdrop-blur-xl dark:border-blue-500/20 dark:bg-slate-950/55">
      <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button type="button" size="icon" variant="ghost" className="lg:hidden" onClick={onOpenNav} aria-label="Open navigation">
            <Menu className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={onOpenCommand}
            className="hidden h-11 min-w-[300px] max-w-md items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-white via-blue-50 to-fuchsia-50 px-4 text-left text-sm text-slate-500 shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-elevated md:flex dark:border-violet-500/30 dark:from-slate-900 dark:via-blue-950 dark:to-fuchsia-950"
          >
            <span className="inline-flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-fuchsia-500 text-white">
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              Search runs, files, events…
            </span>
            <kbd className="rounded-lg bg-violet-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
              Ctrl K
            </kbd>
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <HealthIndicator />
          <Button type="button" size="icon" variant="ghost" onClick={() => void refresh()} aria-label="Refresh data">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="md:hidden" onClick={onOpenCommand} aria-label="Open search">
            <Search className="h-4 w-4" />
          </Button>
          <div className="hidden sm:block">
            <ModeSwitch showLabel={false} />
          </div>
        </div>
      </div>
    </header>
  );
}
