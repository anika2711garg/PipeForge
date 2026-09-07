"use client";

import { useQuery } from "@tanstack/react-query";
import { Table2 } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { CopyButton } from "@/components/ui/copy-button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/ui/export-button";
import { fetchEventFacets, fetchEvents } from "@/lib/api/events";
import type { WarehouseEvent } from "@/lib/api/types";
import { formatTimestamp } from "@/lib/format/dates";
import { formatMinorUnits } from "@/lib/format/money";
import { queryKeys } from "@/lib/utils/query-keys";
import { usePreferences } from "@/providers/preferences-provider";

export function ExplorerPage() {
  const { preferences } = usePreferences();
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [currency, setCurrency] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("id");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<WarehouseEvent | null>(null);

  const params = {
    search: search || undefined,
    event_type: eventType || undefined,
    currency: currency || undefined,
    source: source || undefined,
    limit: preferences.pageSize,
    offset: page * preferences.pageSize,
    sort,
    order,
  };

  const events = useQuery({
    queryKey: queryKeys.events(params),
    queryFn: () => fetchEvents(params),
  });
  const facets = useQuery({
    queryKey: queryKeys.eventFacets,
    queryFn: fetchEventFacets,
  });

  const pageCount = Math.max(1, Math.ceil((events.data?.total ?? 0) / preferences.pageSize));

  if (events.isError) {
    return (
      <ErrorState
        message={events.error instanceof Error ? events.error.message : "Unable to load events."}
        onRetry={() => void events.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Explorer"
        description="Read-only warehouse events. Filters are applied on the FastAPI endpoint; no SQL is exposed."
        actions={<ExportButton kind="events" label="Export snapshot" />}
      />
      <div className="rounded-[1.25rem] border border-border bg-tint/50 p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder="Search event ID, user, file, source"
            className="max-w-sm"
          />
          <Select
            value={eventType}
            onChange={(event) => {
              setEventType(event.target.value);
              setPage(0);
            }}
          >
            <option value="">All types</option>
            {(facets.data?.event_types ?? []).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select
            value={currency}
            onChange={(event) => {
              setCurrency(event.target.value);
              setPage(0);
            }}
          >
            <option value="">All currencies</option>
            {(facets.data?.currencies ?? []).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              setPage(0);
            }}
          >
            <option value="">All sources</option>
            {(facets.data?.sources ?? []).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="id">Sort: ingested</option>
            <option value="occurred_at_utc">Sort: occurred</option>
            <option value="event_id">Sort: event ID</option>
            <option value="amount_minor_units">Sort: amount</option>
          </Select>
          <Select value={order} onChange={(event) => setOrder(event.target.value as "asc" | "desc")}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setSearch("");
              setEventType("");
              setCurrency("");
              setSource("");
              setPage(0);
            }}
          >
            Reset filters
          </Button>
          <span className="text-xs font-medium text-muted-foreground">{events.data?.total ?? 0} events</span>
        </div>
      </div>
      {events.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : (events.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          icon={Table2}
          title="No warehouse events"
          description="Run the pipeline to ingest events, or clear filters if a search hid every row."
        />
      ) : (
        <div className="surface overflow-hidden rounded-[1.5rem]">
          <Table>
            <THead>
              <tr>
                <Th>Event ID</Th>
                <Th>User</Th>
                <Th>Type</Th>
                <Th>Amount</Th>
                <Th>Occurred (UTC)</Th>
                <Th>Source</Th>
                <Th>File</Th>
              </tr>
            </THead>
            <tbody>
              {(events.data?.items ?? []).map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer transition-colors duration-150 hover:bg-tint"
                  onClick={() => setSelected(row)}
                >
                  <Td className="font-mono text-xs">{row.event_id}</Td>
                  <Td>{row.user_id}</Td>
                  <Td>{row.event_type}</Td>
                  <Td>{formatMinorUnits(row.amount_minor_units, row.currency)}</Td>
                  <Td>{formatTimestamp(row.occurred_at_utc, preferences.timeDisplay)}</Td>
                  <Td>{row.source ?? "—"}</Td>
                  <Td>{row.source_file}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Button type="button" size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
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
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
      <Drawer open={Boolean(selected)} title="Event detail" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs">{selected.event_id}</span>
              <CopyButton value={selected.event_id} label="Copy event ID" />
            </div>
            <p>User: {selected.user_id}</p>
            <p>Type: {selected.event_type}</p>
            <p>Amount: {formatMinorUnits(selected.amount_minor_units, selected.currency)}</p>
            <p>Currency: {selected.currency ?? "—"}</p>
            <p>Occurred: {formatTimestamp(selected.occurred_at_utc, preferences.timeDisplay)}</p>
            <p>Source: {selected.source ?? "—"}</p>
            <p>Source file: {selected.source_file}</p>
            <p>Ingested: {formatTimestamp(selected.ingested_at, preferences.timeDisplay)}</p>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
