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
      <div className="rounded-[1.25rem] border border-[#d8dee8]/90 bg-white/70 p-3 shadow-card backdrop-blur-md md:p-4 dark:border-border dark:bg-card/70">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={placeholder}
            className="max-w-sm"
          />
          {filters}
          {actions}
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>
            Reset filters
          </Button>
          <span className="rounded-full bg-[#eef2f8] px-2.5 py-1 text-xs font-semibold text-[#3A5FCD] dark:bg-tint dark:text-primary">
            {resultCount} results
          </span>
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
