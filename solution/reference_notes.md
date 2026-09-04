# Reference notes

These notes describe the repaired implementation. They are not part of the agent-facing task.

## Idempotency strategy

A file is skipped only when **filename and content hash** both match a previous `success` checkpoint. Event identity is global, so even a re-read cannot insert a second logical row. Daily metrics are recomputed from warehouse rows, not appended.

## Global event identity

`event_id` is the logical key. The first accepted payload wins. Later identical payloads increment the duplicate counter and are ignored.

## File identity strategy

`processed_files` stores basename, absolute path, SHA-256, status, and record count. Unchanged bytes are skipped. A same-name file with a new hash is ingested again, subject to event-id rules.

## Transaction boundaries

Each incoming file is one SQLite transaction: accepted rows, quarantine rows, metric rebuilds for affected UTC dates, and the success checkpoint. `commit()` happens once at the end of that unit.

## Checkpoint ordering

The success checkpoint is written in the same transaction as the data, after the writes, immediately before `commit`. Failure-injection hooks fire after writes / before checkpoint and immediately before commit so tests can prove the ordering.

## Malformed-record policy

JSON errors, missing required fields, naive timestamps, and invalid amounts quarantine that line (`source_file`, `line_number`, `raw_record`, `error_reason`) and continue.

## Duplicate-conflict policy

If `event_id` exists and any core field differs (`user_id`, `event_type`, `amount_minor_units`, `currency`, `occurred_at_utc`, `source`), the original row is kept and the new line is quarantined with a reason that mentions the conflict.

## Timezone normalization

`datetime.fromisoformat` plus a required `tzinfo`, then `astimezone(timezone.utc)`. Stored form is `YYYY-MM-DDTHH:MM:SSZ`. Metric dates use that UTC calendar date.

## Money representation

`Decimal` strings are quantized to integer minor units (`ROUND_HALF_EVEN`). Aggregates are integer sums. No `float` arithmetic on amounts.

## Metric recomputation / upsert

For every UTC date touched by newly accepted events, delete that date’s metric rows and rebuild `COUNT` / `SUM(amount_minor_units)` from `events`. Late arrivals refresh only their own dates.

## Crash recovery behavior

An injected failure rolls back the open file transaction. The file is not `success`. A later clean run performs the same inserts a never-interrupted run would have performed.
