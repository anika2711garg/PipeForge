# Reference solution

`reference.patch` turns the intentionally flawed starting repository into a crash-safe incremental ETL.

## Apply

From the PipeForge root:

```bash
scripts/apply_reference_solution.sh
```

Or:

```bash
cd environment/repo
git apply ../../solution/reference.patch
```

## Verify

```bash
scripts/verify_reference_solution.sh
```

That script restores the starting tree, applies this patch, and runs the full verifier. Every test must pass.

## Reset

```bash
scripts/reset_environment.sh
```

See `reference_notes.md` for the design the patch implements.
