# Environment 2 — catalog URL state

Implement URL-synchronized search, filter, sort, and pagination for a product catalog.

## Commands

```bash
cd environments/catalog_url_state
npm install
npm run init:starter      # disposable workspace/ from starter/
npm run grade             # expect FAIL on starter
npm run apply:reference   # workspace/ <- reference/
npm run grade             # expect PASS
npm run attacks           # controlled mutations; restores reference
npm run reset             # delete workspace/ only
npm run dev               # optional UI on :5173
```

## Layout

- `task.md` — public contract
- `starter/` — in-memory list; stubbed URL parse/serialize
- `reference/` — full URL sync
- `workspace/` — graded copy (gitignored)
- `verifier/` — oracle + Vitest/RTL tests + hashes
- `fixtures/products.json` — shared data
- `grader_report.md`, `grader_attacks.md`, `agent_eval.md`

## Trust boundary

Candidate edits `workspace/` only. Do not modify `verifier/`. `scripts/grade.mjs` is authoritative.
