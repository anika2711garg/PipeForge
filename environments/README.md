# Evaluation environments

| ID | Path | Capability | Primary? |
| --- | --- | --- | --- |
| Env1 | Repository root (`task/`, `environment/repo/`, `tests/`, `scripts/grade.py`) | Crash-safe incremental ETL correctness | Yes |
| Env2 | `environments/catalog_url_state/` | URL-synchronized list search / filter / sort / pagination | Additional |

Running one environment’s workspace scripts does not modify the other environment’s disposable state.

- Env1 disposable state: SQLite under `environment/repo/data/` and optional `grader/scratch/` copies.
- Env2 disposable state: `environments/catalog_url_state/workspace/` only.

See the root `README.md` for the nine-question submission summary.
