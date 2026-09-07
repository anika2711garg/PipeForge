# PipeForge Control Center

Next.js App Router UI for the PipeForge warehouse. The Python pipeline, SQLite database, CLI, and FastAPI API stay the source of truth.

## Run locally

Start FastAPI from `environment/repo` first (`python -m pipeline.dashboard`, default port **8000**). Then:

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
# .env.local — public origin only, no secrets
NEXT_PUBLIC_PIPEFORGE_API_URL=http://127.0.0.1:8000
```

If FastAPI is on `8001` or `8002`, put that URL in `.env.local`. The client also probes `8002`, `8001`, and `8000` and uses the first healthy `/api/health` response.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm test
```

Do not commit `.next/` or `.next-dev/`.

## Routes

`/`, `/pipeline`, `/runs`, `/runs/[runId]`, `/activity`, `/insights`, `/files`, `/metrics`, `/quarantine`, `/quarantine/[id]`, `/explorer`, `/compare`, `/system`, `/settings`, `/help`

Command palette: `Ctrl+K` / `Cmd+K`.

## Troubleshooting

- **Unstyled page** — hard-refresh; keep `npm run dev` running.
- **API banner** — start FastAPI and match `NEXT_PUBLIC_PIPEFORGE_API_URL` to its port.
- **Empty warehouse** — Generate Demo Batch, then Run Pipeline.
