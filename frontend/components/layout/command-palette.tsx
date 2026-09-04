"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { fetchSearch } from "@/lib/api/events";
import { queryKeys } from "@/lib/utils/query-keys";
import { usePipelineMutation } from "@/hooks/use-pipeline-mutation";
import { Input } from "@/components/ui/input";
import { NAV_ITEMS } from "./nav-items";

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const client = useQueryClient();
  const run = usePipelineMutation();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const search = useQuery({
    queryKey: queryKeys.search(query),
    queryFn: () => fetchSearch(query),
    enabled: open && query.trim().length >= 2,
  });

  const actions = useMemo(() => {
    const base = [
      ...NAV_ITEMS.map((item) => ({
        id: `go-${item.href}`,
        label: `Go to ${item.label}`,
        run: () => router.push(item.href),
      })),
      {
        id: "run",
        label: "Run Pipeline",
        run: () => {
          if (!run.isPending) {
            run.mutate();
          }
        },
      },
      {
        id: "refresh",
        label: "Refresh Data",
        run: () => {
          void client.invalidateQueries();
        },
      },
      { id: "theme-light", label: "Switch Theme: Light", run: () => setTheme("light") },
      { id: "theme-dark", label: "Switch Theme: Dark", run: () => setTheme("dark") },
      { id: "theme-system", label: "Switch Theme: System", run: () => setTheme("system") },
    ];

    const q = query.trim().toLowerCase();
    const filtered = q ? base.filter((item) => item.label.toLowerCase().includes(q)) : base;

    const results = search.data;
    if (results && q.length >= 2) {
      for (const row of results.runs) {
        filtered.push({
          id: `run-${row.run_id}`,
          label: `Run ${row.run_id}`,
          run: () => router.push("/runs"),
        });
      }
      for (const file of results.files) {
        filtered.push({
          id: `file-${file.filename}`,
          label: `File ${file.filename}`,
          run: () => router.push("/files"),
        });
      }
      for (const event of results.events) {
        filtered.push({
          id: `event-${event.event_id}`,
          label: `Event ${event.event_id}`,
          run: () => router.push("/explorer"),
        });
      }
      for (const item of results.quarantine) {
        filtered.push({
          id: `q-${item.id}`,
          label: `Quarantine ${item.source_file}:${item.line_number}`,
          run: () => router.push("/quarantine"),
        });
      }
    }
    return filtered;
  }, [client, query, router, run, search.data, setTheme]);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  function execute(index: number) {
    const item = actions[index];
    if (!item) {
      return;
    }
    item.run();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-start justify-center p-4 pt-[12vh]">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-label="Close command palette" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-xl overflow-hidden border border-border bg-card shadow-pop"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onClose();
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((value) => Math.min(actions.length - 1, value + 1));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((value) => Math.max(0, value - 1));
          }
          if (event.key === "Enter") {
            event.preventDefault();
            execute(active);
          }
        }}
      >
        <div className="border-b border-border p-3">
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages, runs, files, events…"
            aria-label="Command search"
          />
        </div>
        <ul className="max-h-80 overflow-auto p-1" role="listbox">
          {actions.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matching actions or records.</li>
          ) : (
            actions.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  className={`flex w-full px-3 py-2.5 text-left text-sm ${
                    index === active ? "bg-muted" : "hover:bg-muted/70"
                  }`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => execute(index)}
                >
                  {item.label}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
