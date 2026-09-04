"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { usePreferences } from "@/providers/preferences-provider";

export function SettingsPage() {
  const { preferences, update } = usePreferences();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Settings"
        description="Frontend-only preferences. These do not change pipeline correctness or warehouse behavior."
      />
      <section className="glass grid gap-10 rounded-3xl border border-border p-6 md:grid-cols-3">
        <div>
          <h2 className="text-sm font-medium">Appearance</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Light, dark, or follow the operating system. Preference is stored locally.
          </p>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </div>
        <div>
          <h2 className="text-sm font-medium">Data display</h2>
          <p className="mt-2 text-sm text-muted-foreground">How timestamps and tables are shown.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Timestamps</span>
              <Select
                value={preferences.timeDisplay}
                onChange={(event) =>
                  update({ timeDisplay: event.target.value === "local" ? "local" : "utc" })
                }
              >
                <option value="utc">UTC</option>
                <option value="local">Local</option>
              </Select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Rows per page</span>
              <Select
                value={String(preferences.pageSize)}
                onChange={(event) => update({ pageSize: Number(event.target.value) })}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </Select>
            </label>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-medium">Behavior</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Automatic refresh only re-reads the FastAPI dashboard. It does not start the pipeline.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={preferences.autoRefresh}
                onChange={(event) => update({ autoRefresh: event.target.checked })}
              />
              Auto-refresh warehouse views
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Refresh interval</span>
              <Select
                value={String(preferences.refreshIntervalMs)}
                onChange={(event) => update({ refreshIntervalMs: Number(event.target.value) })}
              >
                <option value="8000">8 seconds</option>
                <option value="15000">15 seconds</option>
                <option value="30000">30 seconds</option>
              </Select>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
