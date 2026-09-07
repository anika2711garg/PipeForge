# PipeForge grader

Single authoritative command, from the repository root:

```bash
python scripts/grade.py
```

Exit codes:

| Code | Status | Meaning |
| --- | --- | --- |
| 0 | PASS | Every mandatory test passed on every repeat |
| 1 | FAIL | Required application behavior failed, was skipped, or was missing |
| 2 | ERROR | Collection failed, zero tests, or infrastructure error |

Outputs:

- `grader_report.md` — human-readable mapping and results
- `grader/results/latest.json` — machine-readable result

The grader runs the mandatory pytest nodeids three times (third run reversed) against `environment/repo`.

It sets `PIPEFORGE_CANDIDATE_REPO` so `tests/conftest.py` imports `pipeline` from the `--repo` tree, not from a hardcoded `environment/repo` path. It also clears `PYTEST_ADDOPTS` and `PYTEST_PLUGINS`, and checks `grader/test_hashes.json` before trusting the suite.

## Trust boundary

| Path | Role |
| --- | --- |
| `environment/repo` | Candidate application. May be modified. |
| `tests/` | Authoritative behavioral tests. |
| `grader/mandatory_tests.json` | Required nodeids. Missing or skipped items fail closed. |
| `scripts/grade.py` | Trusted execution. It runs pytest itself. |
| `solution/` | Hidden reference. Not required to grade a candidate. |

A script inside `environment/repo` that prints `PASS` is not consulted.

This checkout is writable. File permissions or checksums in the same tree are **not** a sandbox. Harbor/Docker copies tests to `/grader/tests` and the app to `/workspace`; that is stronger isolation than local development.

## What this grader does not score

Next.js visual design, animation taste, and frontend unit tests. Those are optional or human-review only (`H1` in the mapping).
