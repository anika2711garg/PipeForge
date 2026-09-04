# PipeForge Control Center

Next.js App Router frontend for the PipeForge incremental ETL warehouse.

The Python pipeline, SQLite warehouse, CLI, and FastAPI API remain the source of truth. This application is a typed control plane over those HTTP endpoints.

## Architecture

```text
Next.js (localhost:3000)
        │  REST
        ▼
FastAPI dashboard (localhost:8000)
        │
        ▼
Python ETL + SQLite
```

## Prerequisites

- Node.js 20+
- Python 3.12 and the backend dependencies in `environment/repo/requirements.txt`

## Local setup

Backend:

```bash
cd environment/repo
python -m pip install -r requirements.txt
python scripts/generate_demo_data.py
python -m pipeline.dashboard
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

URLs:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API / legacy static dashboard: [http://localhost:8000](http://localhost:8000)

## Environment variables

Copy `.env.example` to `.env.local` if needed:

```bash
NEXT_PUBLIC_PIPEFORGE_API_URL=http://127.0.0.1:8000
```

This value is a public API origin only. Do not put secrets in `NEXT_PUBLIC_*` variables.

FastAPI already allows `http://localhost:3000` during development. Additional origins can be set with `PIPEFORGE_CORS_ORIGINS`.

## Theme support

The control center supports **Light**, **Dark**, and **System**.

- System follows `prefers-color-scheme`
- Manual choice is stored in `localStorage` under `pipeforge.theme`
- A boot script applies the class before paint to avoid a theme flash
- Charts, drawers, toasts, and tables use the same semantic tokens

## Dashboard routes

- `/` Overview
- `/pipeline` Pipeline control
- `/runs` Run history
- `/files` Incoming files
- `/metrics` Daily metrics
- `/quarantine` Rejected records
- `/explorer` Read-only warehouse events
- `/system` Health and inventory
- `/settings` Frontend preferences

## API integration

Typed clients live in `lib/api/`. They call:

- `GET /api/health`
- `GET /api/status`
- `GET /api/system`
- `GET /api/runs`
- `GET /api/runs/{run_id}`
- `GET /api/files`
- `GET /api/metrics`
- `GET /api/quarantine`
- `GET /api/quarantine/{id}`
- `GET /api/events`
- `GET /api/events/facets`
- `GET /api/search`
- `POST /api/run`
- `POST /api/demo/generate`
- `POST /api/demo/reset`

TanStack Query caches reads and invalidates them after mutations.

## Production build

```bash
cd frontend
npm install
npm run build
npm run start
```

Also available:

```bash
npm run lint
npm run typecheck
npm test
```

## Screenshots

Add local screenshots here after a demo session if you want them in reviews.

## Troubleshooting

**API unavailable banner**
Start FastAPI first (`python -m pipeline.dashboard`) and confirm `NEXT_PUBLIC_PIPEFORGE_API_URL`.

**CORS errors**
Use the default `http://localhost:3000` origin or set `PIPEFORGE_CORS_ORIGINS`.

**Empty warehouse**
Generate a demo batch from Overview or Pipeline, then run the pipeline.

**Theme flash**
Hard-refresh once after the first load so the stored theme is present.
