# PipeForge

Crash-safe incremental ETL with a Next.js control center.

PipeForge reads JSONL product and activity events, loads them into a local SQLite warehouse, and exposes a Python CLI plus a FastAPI API. The control center at `frontend/` is a typed UI over that API.

```text
Next.js  (http://localhost:3000)
    │  REST
    ▼
FastAPI  (http://127.0.0.1:8000 by default)
    │
    ▼
Python ETL  →  SQLite warehouse
```

## Quick start

Use two terminals.

**1. API**

```bash
cd environment/repo
python -m pip install -r requirements.txt
python -m pipeline.dashboard
```

The API listens on [http://127.0.0.1:8000](http://127.0.0.1:8000). If that port is already in use, start it on another port:

```bash
python -m uvicorn pipeline.dashboard:app --host 127.0.0.1 --port 8001
```

**2. Control center**

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

On macOS/Linux use `cp .env.example .env.local`.

Open **[http://localhost:3000](http://localhost:3000)** — that is the app.

Point the frontend at the API you started:

```bash
# frontend/.env.local
NEXT_PUBLIC_PIPEFORGE_API_URL=http://127.0.0.1:8000
```

Use `8001` (or `8002`) in that file if you started FastAPI on that port. Do not put secrets in `NEXT_PUBLIC_*` variables.

The UI also probes `8002`, `8001`, and `8000` and uses the first origin that answers `GET /api/health`.

## What you can do in the UI

| Route | Purpose |
| --- | --- |
| `/` | Overview and run control |
| `/pipeline` | Incremental ingest path |
| `/runs` | Run history |
| `/files` | Incoming JSONL files |
| `/metrics` | UTC daily aggregates |
| `/quarantine` | Rejected lines |
| `/explorer` | Read-only warehouse events |
| `/system` | Health and inventory |
| `/settings` | Theme and display preferences |

`Ctrl+K` / `Cmd+K` opens the command palette. Light, dark, and system themes persist in `localStorage` (`pipeforge.theme`).

Demo buttons generate or reset synthetic JSONL only. They are not production ingest.

## CLI

```bash
cd environment/repo
python scripts/generate_demo_data.py
python -m pipeline run
python -m pipeline status
```

Reset the local warehouse and rewrite a demo batch:

```bash
python scripts/reset_demo.py
```

## Incoming data

Drop JSON Lines files in `environment/repo/data/incoming/`. Each line is one event:

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

Required: `event_id`, `user_id`, `event_type`, `occurred_at`, `source`.  
`amount` and `currency` are optional. Unknown fields are ignored. `occurred_at` must be timezone-aware ISO-8601. Money is stored as integer minor units.

## API

Thin wrappers over the same pipeline functions the CLI uses:

- `GET /api/health`
- `GET /api/status`
- `GET /api/system`
- `GET /api/runs` and `GET /api/runs/{run_id}`
- `GET /api/files`
- `GET /api/metrics`
- `GET /api/quarantine` and `GET /api/quarantine/{id}`
- `GET /api/events`, `GET /api/events/facets`, `GET /api/search?q=`
- `POST /api/run`
- `POST /api/demo/generate`
- `POST /api/demo/reset`

CORS allows `localhost:3000` by default. Extra origins: `PIPEFORGE_CORS_ORIGINS`.

Warehouse paths: `PIPEFORGE_DB_PATH`, `PIPEFORGE_INCOMING_DIR`, `PIPEFORGE_QUARANTINE_DIR`.

## Frontend checks

```bash
cd frontend
npm run lint
npm run typecheck
npm test
npm run build
```

Do not commit `.next/` or `.next-dev/`. Those folders are Next.js caches, not source.

## Tests (pipeline verifier)

From the repository root, with `PYTHONPATH=environment/repo`:

```bash
python -m pip install -r environment/repo/requirements.txt
python -m pytest -q tests
```

The starting tree is a coding-evaluation environment. Some reliability tests fail until the incremental ETL bugs are repaired. After the reference patch, the same suite should pass.

```bash
python scripts/verify_starting_state.py
python scripts/apply_reference_solution.py
python scripts/verify_reference_solution.py
python scripts/reset_environment.py
```

## Docker

```bash
docker build -f environment/Dockerfile -t pipeforge .
docker run --rm pipeforge python -m pipeline status
docker run --rm -p 8000:8000 pipeforge python -m pipeline.dashboard
docker run --rm pipeforge pytest -q /grader/tests
```

Grading uses the Python verifier only. Node is not required to score ETL correctness.

## Layout

```text
task/                 Agent instruction
environment/repo/     Python ETL, CLI, FastAPI
environment/Dockerfile
frontend/             Next.js control center
tests/                Behavioral verifier
solution/             Reference patch
scripts/              Apply / reset / verify helpers
```

See `frontend/README.md` for frontend-only detail and `environment/repo/README.md` for warehouse rules.

## Troubleshooting

**The page looks unstyled**  
Hard-refresh [http://localhost:3000](http://localhost:3000) (`Ctrl+Shift+R`). Confirm `npm run dev` is running in `frontend/`.

**“API unavailable”**  
Start FastAPI first, then confirm `NEXT_PUBLIC_PIPEFORGE_API_URL` matches that port.

**Port 8000 is another app**  
Start PipeForge on `8001` or `8002` and set `.env.local` to that origin.

**Run stays Failed**  
Generate a demo batch, then run the pipeline again. Invalid lines should quarantine; the run should complete.

**Do not open `.next-dev/trace`**  
That file is a Next.js performance log, not an application error.
