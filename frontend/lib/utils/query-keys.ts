export const queryKeys = {
  health: ["health"] as const,
  status: ["status"] as const,
  system: ["system"] as const,
  runs: ["runs"] as const,
  run: (id: string) => ["runs", id] as const,
  files: ["files"] as const,
  metrics: ["metrics"] as const,
  quarantine: ["quarantine"] as const,
  events: (params: Record<string, string | number | undefined>) =>
    ["events", params] as const,
  eventFacets: ["event-facets"] as const,
  search: (q: string) => ["search", q] as const,
};
