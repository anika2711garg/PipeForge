import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import products from "./data/products.json";
import {
  applyCatalog,
  parseParams,
  serializeParams,
  type CatalogParams,
  type Product,
  type SortKey,
  type SortOrder,
} from "./lib/catalog";

const ALL = products as Product[];
const CATEGORIES = [...new Set(ALL.map((item) => item.category))].sort();

export function CatalogPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => parseParams(location.search), [location.search]);
  const result = useMemo(() => applyCatalog(ALL, params), [params]);

  function commit(next: CatalogParams) {
    const effective = applyCatalog(ALL, next);
    const normalized: CatalogParams = { ...next, page: effective.page, pageSize: 5 };
    const search = serializeParams(normalized);
    navigate({ pathname: location.pathname, search: search ? `?${search}` : "" });
  }

  function update(patch: Partial<CatalogParams>, resetPage = false) {
    commit({
      ...params,
      ...patch,
      page: resetPage ? 1 : (patch.page ?? params.page),
      pageSize: 5,
    });
  }

  return (
    <main>
      <h1>Product catalog</h1>
      <form
        aria-label="Catalog filters"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label>
          Search
          <input
            aria-label="Search"
            value={params.q}
            onChange={(event) => update({ q: event.target.value }, true)}
          />
        </label>
        <label>
          Category
          <select
            aria-label="Category"
            value={params.category}
            onChange={(event) => update({ category: event.target.value }, true)}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select
            aria-label="Sort"
            value={params.sort}
            onChange={(event) => update({ sort: event.target.value as SortKey }, true)}
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="stock">Stock</option>
          </select>
        </label>
        <label>
          Order
          <select
            aria-label="Order"
            value={params.order}
            onChange={(event) => update({ order: event.target.value as SortOrder }, true)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
      </form>

      <p aria-live="polite">
        Showing {result.items.length} of {result.total} products · Page {result.page} of {result.pageCount}
      </p>

      <ul aria-label="Product results">
        {result.items.map((item) => (
          <li key={item.id}>
            <span>{item.name}</span>
            <span> · {item.sku}</span>
            <span> · {item.category}</span>
            <span> · {(item.priceCents / 100).toFixed(2)}</span>
            <span> · stock {item.stock}</span>
          </li>
        ))}
      </ul>

      {result.total === 0 ? <p>No products match these filters.</p> : null}

      <div>
        <button
          type="button"
          aria-label="Previous page"
          disabled={result.page <= 1}
          onClick={() => update({ page: result.page - 1 })}
        >
          Previous
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={result.page >= result.pageCount || result.total === 0}
          onClick={() => update({ page: result.page + 1 })}
        >
          Next
        </button>
      </div>
    </main>
  );
}
