import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TableToolbar({
  query,
  onQuery,
  placeholder,
  filters,
  actions,
  resultCount,
  onClear,
  page,
  pageCount,
  onPage,
}: {
  query: string;
  onQuery: (value: string) => void;
  placeholder: string;
  filters?: ReactNode;
  actions?: ReactNode;
  resultCount: number;
  onClear: () => void;
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="rounded-[1.35rem] border border-blue-200 bg-gradient-to-r from-blue-50 via-violet-50 to-fuchsia-50 p-3 shadow-card md:p-4 dark:border-blue-500/20 dark:from-blue-950/40 dark:via-violet-950/30 dark:to-fuchsia-950/30">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={placeholder}
            className="max-w-sm border-blue-200 bg-white/90"
          />
          {filters}
          {actions}
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>
            Reset filters
          </Button>
          <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">{resultCount} results</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Button type="button" size="sm" variant="outline" disabled={page === 0} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <span>
          Page {page + 1} of {pageCount}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page + 1 >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
