# Agent evaluation — Environment 2

## Status

**NOT RUN**

## Why

No isolated agent trial was executed for this environment.

1. Running a coding agent inside this full PipeForge checkout would expose `verifier/`, `reference/`, and attack scripts.
2. No Harbor-style mount that provides only `task.md` + `starter/` was available in-session.
3. Building the reference solution while authoring the grader is not an independent agent trial.

## What a real trial needs

- Copy `starter/` (or `npm run init:starter`) without `reference/` or `verifier/` expectations visible if the harness can hide them.
- Provide only `task.md` and development tools.
- Score with `npm run grade` from `environments/catalog_url_state`.

| Field | Value |
| --- | --- |
| Agent / model | Not used |
| PASS / FAIL / ERROR | NOT RUN |
