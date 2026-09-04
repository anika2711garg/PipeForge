import type { TimeDisplay } from "./format/dates";

export type ThemePreference = "light" | "dark" | "system";

export type AppPreferences = {
  timeDisplay: TimeDisplay;
  pageSize: number;
  autoRefresh: boolean;
  refreshIntervalMs: number;
  sidebarCollapsed: boolean;
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  timeDisplay: "utc",
  pageSize: 10,
  autoRefresh: true,
  refreshIntervalMs: 15_000,
  sidebarCollapsed: false,
};

const STORAGE_KEY = "pipeforge.preferences";

export function loadPreferences(): AppPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      pageSize: [10, 25, 50].includes(Number(parsed.pageSize))
        ? Number(parsed.pageSize)
        : DEFAULT_PREFERENCES.pageSize,
      refreshIntervalMs: [8_000, 15_000, 30_000].includes(Number(parsed.refreshIntervalMs))
        ? Number(parsed.refreshIntervalMs)
        : DEFAULT_PREFERENCES.refreshIntervalMs,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(value: AppPreferences): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
