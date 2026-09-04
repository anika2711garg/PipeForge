"use client";

import { useMemo, useState } from "react";

import { usePreferences } from "@/providers/preferences-provider";

export function useTableState<T>(
  rows: T[],
  filter: (row: T, query: string) => boolean,
  sortValue: (row: T, key: string) => string | number,
) {
  const { preferences } = usePreferences();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("default");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(
    () => rows.filter((row) => filter(row, query.trim().toLowerCase())),
    [filter, query, rows],
  );

  const sorted = useMemo(() => {
    if (sortKey === "default") {
      return filtered;
    }
    return [...filtered].sort((a, b) => {
      const left = sortValue(a, sortKey);
      const right = sortValue(b, sortKey);
      if (left < right) return sortDir === "asc" ? -1 : 1;
      if (left > right) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortDir, sortKey, sortValue]);

  const pageSize = preferences.pageSize;
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return {
    query,
    setQuery: (value: string) => {
      setQuery(value);
      setPage(0);
    },
    sortKey,
    sortDir,
    setSort: (key: string) => {
      if (sortKey === key) {
        setSortDir((value) => (value === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    page: safePage,
    setPage,
    pageCount,
    pageRows,
    total: sorted.length,
  };
}
