import { apiGet } from "./client";
import type { EventFacets, EventsPage, SearchResults } from "./types";

export type EventQuery = {
  search?: string;
  event_type?: string;
  currency?: string;
  source?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: "asc" | "desc";
};

export function fetchEvents(query: EventQuery = {}): Promise<EventsPage> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.event_type) params.set("event_type", query.event_type);
  if (query.currency) params.set("currency", query.currency);
  if (query.source) params.set("source", query.source);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.offset !== undefined) params.set("offset", String(query.offset));
  if (query.sort) params.set("sort", query.sort);
  if (query.order) params.set("order", query.order);
  const suffix = params.toString();
  return apiGet<EventsPage>(`/api/events${suffix ? `?${suffix}` : ""}`);
}

export function fetchEventFacets(): Promise<EventFacets> {
  return apiGet<EventFacets>("/api/events/facets");
}

export function fetchSearch(q: string): Promise<SearchResults> {
  const params = new URLSearchParams({ q });
  return apiGet<SearchResults>(`/api/search?${params.toString()}`);
}
