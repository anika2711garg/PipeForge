# Agent evaluation

## Status

**NOT RUN**

This optional omission does not fail the required verifier or attack sections.

## Why it was not run

An appropriate isolated starter trial was not available in this session.

1. **No clean starter workspace that hides grader materials.** The intended solver should see `task/instruction.md` and the starting application only. This checkout also contains `tests/`, `grader/`, `scripts/grade.py`, and `solution/reference.patch`. A coding agent launched in this workspace can read those files. That is not equivalent to Harbor’s split of `/workspace` vs `/grader/tests`.

2. **The live `environment/repo` is not the original starter.** Product work changed `pipeline/parser.py` (`extra="ignore"`) and `pipeline/ingest.py` (per-line quarantine, four-tuple `_process_file`). The official starting ETL that `solution/reference.patch` applies to is git revision `697007e`. Running an agent against the current tree would be a different problem than the assignment.

3. **No agent run was invented.** Cursor’s Task tool exists, but using it here would still expose hidden expectations and would not reconstruct a restricted starter image. The assignment forbids presenting a run on the already-modified solution as an equivalent trial.

Environment 2 (`environments/catalog_url_state/`) is likewise **NOT RUN** for the same isolation reasons; see that folder’s `agent_eval.md`.

## What a real trial would need

- A fresh copy of the `697007e` application tree (or Harbor `/workspace`) with no `tests/`, `grader/`, or `solution/` mounted for the agent.
- The text of `task/instruction.md` only.
- After the agent stops, score that copy with `python scripts/grade.py --repo <that-copy>`.

## Fields left blank because no run occurred

| Field | Value |
| --- | --- |
| Agent and model | Not used |
| Starting environment | Not constructed |
| Access and tool restrictions | Not applied |
| Approach taken | n/a |
| PASS / FAIL / ERROR | NOT RUN |
| Where it succeeded | n/a |
| Where it failed | n/a |
| Failure attribution | n/a |
