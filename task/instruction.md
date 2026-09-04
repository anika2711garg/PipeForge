# Task: Repair PipeForge's Incremental ETL Pipeline

PipeForge ingests JSONL event files from an incoming directory into a local analytical warehouse.

The existing pipeline succeeds for simple files, but repeated and interrupted executions can produce incorrect results.

Repair the implementation so that the resulting warehouse remains correct under realistic incremental-processing conditions.

Your solution must ensure that:

* rerunning unchanged input is idempotent
* duplicate events are handled globally across files
* conflicting reuse of an existing event ID does not silently corrupt existing data
* malformed records are quarantined without losing valid records
* monetary values are aggregated exactly
* timezone-aware event timestamps are normalized consistently
* additive input schema changes do not break valid events
* late-arriving records update the correct historical metrics
* interrupted ingestion can recover safely
* a file is not recorded as successfully processed until its ingestion has completed safely
* the existing CLI and dashboard remain functional

Preserve the documented input/output behavior.

Do not modify the external verifier.

Your implementation will be evaluated using behavioral and adversarial tests, including datasets not present in the starting repository.
