# PipeForge

PipeForge is a local incremental ETL service. It reads product and activity events from JSONL files, loads them into a SQLite analytical warehouse, and exposes a CLI plus a small control-center dashboard.

## Incoming data

Place JSON Lines files under `data/incoming/`:

```text
data/incoming/events_001.jsonl
data/incoming/events_002.jsonl
```

Each line is one event:

```json
{
  "event_id": "evt_1001",
  "user_id": "usr_83",
  "event_type": "purchase",
  "amount": "19.99",
  "currency": "USD",
  "occurred_at": "2026-08-12T21:42:13+05:30",
  "source": "mobile"
}
```

Required fields: `event_id`, `user_id`, `event_type`, `occurred_at`, `source`.

`amount` and `currency` are optional. Additional unknown fields are ignored and must not prevent an otherwise valid event from loading.

`occurred_at` must be timezone-aware ISO-8601. Values are normalized to UTC. Daily metrics use the UTC calendar date. Example: `2026-08-05T00:30:00+05:30` is `2026-08-04T19:00:00Z` and belongs to 2026-08-04.

Monetary amounts are stored and aggregated as integer minor units. Binary floating-point arithmetic is not used for financial totals.

## Processing rules

- The pipeline is incremental. Re-running against unchanged input must not change logical warehouse contents.
- `event_id` is the logical identity of an event. The same id in multiple files is one event.
- Identical duplicate payloads are ignored.
- If the same `event_id` arrives later with conflicting core fields, the original warehouse row stays authoritative and the conflicting record is quarantined.
- A malformed JSON line is quarantined (`source` file, line number, raw text, reason). Remaining valid lines in the file are still processed.
- File identity uses **filename + content hash**.
  - A previously processed file whose bytes are unchanged is skipped.
  - A file that keeps the same name but has different bytes is treated as new input. Logical `event_id` rules still apply.
- A file is recorded as successfully processed only after its ingestion work has committed safely.
- Late-arriving historical events update the UTC daily metrics for their own dates. Newer dates are left intact.

## Commands

```bash
python -m pipeline run
python -m pipeline status
python -m pipeline.dashboard
python scripts/generate_demo_data.py
python scripts/reset_demo.py
```

Dashboard API: [http://localhost:8000](http://localhost:8000)

The FastAPI process serves `/api/*` and a legacy static page. The production-style control center is the Next.js app at the repository `frontend/` directory:

```bash
cd ../../frontend
npm install
npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000)

Set `NEXT_PUBLIC_PIPEFORGE_API_URL=http://127.0.0.1:8000` if you are not using the default. Additional CORS origins can be supplied with `PIPEFORGE_CORS_ORIGINS`.

Dashboard API (thin wrappers over pipeline functions):

- `GET /api/health` — API, SQLite, and incoming-directory health
- `GET /api/status` — warehouse snapshot used by CLI and the control center
- `GET /api/system` — safe inventory (no absolute filesystem paths)
- `GET /api/runs` and `GET /api/runs/{run_id}`
- `GET /api/files` — incoming files plus current hash / changed-content flag
- `GET /api/metrics`
- `GET /api/quarantine` and `GET /api/quarantine/{id}`
- `GET /api/events` — paginated read-only explorer (no arbitrary SQL)
- `GET /api/events/facets`
- `GET /api/search?q=`
- `POST /api/run`
- `POST /api/demo/generate`
- `POST /api/demo/reset`

Environment variables:

- `PIPEFORGE_INCOMING_DIR`
- `PIPEFORGE_QUARANTINE_DIR`
- `PIPEFORGE_DB_PATH`

## Warehouse

SQLite tables include `events`, `processed_files`, `pipeline_runs`, `quarantine_records`, and `daily_metrics`.
