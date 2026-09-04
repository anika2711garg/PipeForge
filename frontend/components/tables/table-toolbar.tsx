import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TableToolbar({
  query,
  onQuery,
  placeholder,
  filters,
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
  resultCount: number;
  onClear: () => void;
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="mb-3 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder={placeholder}
          className="max-w-sm"
        />
        {filters}
        <Button type="button" size="sm" variant="ghost" onClick={onClear}>
          Reset filters
        </Button>
        <span className="text-xs text-muted-foreground">{resultCount} results</span>
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
