export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  priceCents: number;
  stock: number;
};

export type SortKey = "name" | "price" | "stock";
export type SortOrder = "asc" | "desc";

export type CatalogParams = {
  q: string;
  category: string;
  sort: SortKey;
  order: SortOrder;
  page: number;
  pageSize: number;
};

export const PAGE_SIZE = 5;
export const DEFAULT_PARAMS: CatalogParams = {
  q: "",
  category: "",
  sort: "name",
  order: "asc",
  page: 1,
  pageSize: PAGE_SIZE,
};

export function normalizeQuery(raw: string | null | undefined): string {
  return (raw ?? "").trim();
}

/** Starter: parsing is incomplete — ignores most params and never trims search. */
export function parseParams(_search: string): CatalogParams {
  return { ...DEFAULT_PARAMS };
}

/** Starter: serialization is a no-op so the URL never updates. */
export function serializeParams(_params: CatalogParams): string {
  return "";
}

function compareProducts(a: Product, b: Product, sort: SortKey, order: SortOrder): number {
  let primary = 0;
  if (sort === "name") primary = a.name.localeCompare(b.name);
  else if (sort === "price") primary = a.priceCents - b.priceCents;
  else primary = a.stock - b.stock;
  if (primary === 0) return a.id.localeCompare(b.id);
  return order === "asc" ? primary : -primary;
}

export function applyCatalog(products: Product[], params: CatalogParams) {
  const q = normalizeQuery(params.q).toLowerCase();
  let rows = products.slice();
  if (q) {
    rows = rows.filter(
      (item) => item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q),
    );
  }
  if (params.category) {
    rows = rows.filter((item) => item.category === params.category);
  }
  rows.sort((a, b) => compareProducts(a, b, params.sort, params.order));
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
  const page = total === 0 ? 1 : Math.min(Math.max(params.page, 1), pageCount);
  const start = (page - 1) * PAGE_SIZE;
  const items = rows.slice(start, start + PAGE_SIZE);
  return { items, total, pageCount, page };
}
