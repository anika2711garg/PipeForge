# PipeForge

Coding-agent evaluation with **two** environments. Env1 is primary; Env2 is additional and tests a different capability.

| Env | Task | Capability | Observed grade |
| --- | --- | --- | --- |
| **1** | Repair incremental JSONL→SQLite ETL | Backend pipeline correctness | Starter FAIL (9/23); reference PASS 23/23 ×3 |
| **2** | URL-sync product catalog | Frontend URL/query state | Starter FAIL; reference PASS 12/12 ×3 |

### 1. What did you build?

**Env1:** PipeForge — flawed Python ETL (CLI + FastAPI) with a Next.js control center. The agent must fix idempotency, duplicates/conflicts, quarantine, exact money, timezones, late metrics, and crash recovery without editing the external verifier (`task/instruction.md`, `environment/repo/`, `solution/reference.patch`, `tests/`).

**Env2:** Standalone Vite/React catalog at `environments/catalog_url_state/`. The agent must keep search, filter, sort, and pagination synchronized with the URL (deep link, reload, back/forward). Not a rename or restyle of Env1.

### 2. What capability does it test?

- **Env1:** Crash-safe incremental data ingestion and warehouse invariants.
- **Env2:** URL-as-source-of-truth list controls and history behavior.

### 3. Why is this useful for evaluating a coding agent?

Each task is a realistic, bounded bugfix with a broken starter and objective checks. Happy-path memorization fails (Env1 multi-file/oracle fixtures; Env2 independent oracle + UI interactions). Passing requires correct side effects (SQLite or URL+DOM), not printed “success.” The two envs score different skills: backend reliability vs frontend navigation state.

### 4. How do we run the environment?

Prerequisites: Python 3.11+, Node 20+, npm, git.

**Env1** (repo root = `PipeForge/`):

```bash
cd environment/repo
python -m pip install -r requirements.txt
python -m pipeline.dashboard
# optional UI: cd ../../frontend && npm install && copy .env.example .env.local && npm run dev
python ../../scripts/reset_environment.py   # clears warehouse/demo files only
```

**Env2:**

```bash
cd environments/catalog_url_state
npm install
npm run init:starter
npm run dev          # http://127.0.0.1:5173
npm run reset        # deletes workspace/ only
```

### 5. How do we run the reference solution?

**Env1** (preferred — does not patch the live tree):

```bash
python scripts/grade_isolated_reference.py --repeats 3
```

Applies `solution/reference.patch` in `grader/scratch/` after restoring starter ETL from git `697007e`.

Optional (mutates `environment/repo`): `python scripts/apply_reference_solution.py`

**Env2:**

```bash
cd environments/catalog_url_state
npm run apply:reference
npm run grade
```

### 6. How does the verifier work?

**Env1:** `python scripts/grade.py` — fail-closed pytest on mandatory nodeids. Exit `0` PASS / `1` FAIL / `2` ERROR. Asserts warehouse/CLI/dashboard behavior, not summaries. Writes `grader_report.md` and `grader/results/latest.json`. Candidate may change `environment/repo` only.

**Env2:** `npm run grade` — Vitest + Testing Library against `workspace/`, plus an independent oracle. Same exit codes; writes Env2 `grader_report.md` and `grader/results/latest.json`. Verifier hashes block in-tree test edits. UI aesthetics are not scored.

### 7. What edge cases are covered?

**Env1:** idempotent reruns; cross-file duplicates; conflicting `event_id`; quarantine; exact minor units; offset/naive timestamps; schema extras; late metrics; crash/checkpoint atomicity; changed file content; CLI/dashboard; seeded oracle. Detail: `grader/requirements_map.json`.

**Env2:** trim + case-insensitive search; URL encoding; invalid sort/order/page; unknown category → empty; sort ties by `id`; page clamp; filter resets page; deep link; back/forward; empty results. Detail: `environments/catalog_url_state/verifier/requirements_map.json`.

### 8. What grader exploits did you test?

**Env1** (executed): hardcoded outputs, input ignoring, missing side effects, skip/discovery/`PYTEST_ADDOPTS` tampering, spoofed PASS JSON, canary scan, money regression, valid rename variant, isolation fix — [`grader_attacks.md`](grader_attacks.md).

**Env2** (executed): static UI hardcoding, fixture swap, verifier skip/hash, spoofed JSON, equivalent serialization — [`environments/catalog_url_state/grader_attacks.md`](environments/catalog_url_state/grader_attacks.md).

### 9. What happened when you ran an AI coding agent?

**NOT RUN** (both environments). No clean starter workspace that hides `tests/`, `grader/`, and `solution/` was available; fabricating a trial is not allowed. See [`agent_eval.md`](agent_eval.md) and [`environments/catalog_url_state/agent_eval.md`](environments/catalog_url_state/agent_eval.md).
