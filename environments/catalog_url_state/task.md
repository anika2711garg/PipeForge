# Task: URL-synchronized product catalog

You are given a small React product catalog. Filtering, sorting, and pagination already work in memory, but **the UI does not stay synchronized with the browser URL**. Reloading loses state, deep links do not restore the list, and the back button does not undo filter changes.

## Goal

Implement URL-synchronized search, filtering, sorting, and pagination so that:

1. Visible results always match the current URL query string.
2. Changing controls updates both the results and the URL.
3. Opening or reloading a URL restores the same results.
4. Browser history (back/forward) restores prior list states.

## Contract (authoritative)

### Query parameters

| Param | Meaning | Default |
| --- | --- | --- |
| `q` | Search text | empty (no text filter) |
| `category` | Exact category match | empty (all categories) |
| `sort` | `name` \| `price` \| `stock` | `name` |
| `order` | `asc` \| `desc` | `asc` |
| `page` | 1-based page index | `1` |

`pageSize` is fixed at **5**. Do not read a `pageSize` query param.

### Search (`q`)

- Trim surrounding whitespace before matching.
- Match is **case-insensitive** against `name` and `sku`.
- After trimming, empty `q` means no text filter.
- Encode/decode properly so values like `cable & adapter` round-trip in the URL.

### Category

- Exact string equality against `product.category`.
- Unknown categories yield an empty result set (not an error).

### Sorting

- `name`: lexicographic by `name`.
- `price`: numeric by `priceCents`.
- `stock`: numeric by `stock`.
- When primary values are equal, break ties by `id` ascending (stable, deterministic).
- Invalid `sort` → `name`. Invalid `order` → `asc`.

### Pagination

- Page size is always 5.
- Invalid `page` (missing, non-integer, `< 1`) → `1`.
- If `page` is greater than the last page and there is at least one result, clamp to the last page.
- If there are zero results, show an empty list and keep `page` normalized to `1` in the effective state.

### Control interactions

- Changing `q`, `category`, `sort`, or `order` from the UI **must reset `page` to 1**.
- Changing page alone must not clear other params.
- Omit default params from the serialized query when practical (`sort=name`, `order=asc`, `page=1`, empty `q`/`category`).

### Invalid / unsupported params

- Ignore unknown query keys.
- Do not crash on malformed query strings; fall back to defaults above.

### Data

Use only the products supplied in `fixtures/products.json` (copied into the app as `src/data/products.json`). Do not hardcode expected result tables for the grader’s hidden cases.

## Constraints

- Keep the existing control labels and accessible names used in the starter (`Search`, `Category`, `Sort`, `Order`, `Previous page`, `Next page`, and the results region).
- Do not modify files under `verifier/`.
- Pure helpers may live under `src/lib/`. UI may use React Router’s location/search APIs already wired in the starter shell.

## Out of scope

- Styling polish, animations, authentication, and network fetching.
- Changing the fixed page size or the fixture schema.
