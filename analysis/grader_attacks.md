# Grader Attacks

This note records shortcuts an agent might take and how the verifier blocks them.

## Attack attempted → Result → Protection/Fix

1. **Hardcode expected fixture filenames.**
   Result: tests use temporary directories and generated names such as `batch_basic.jsonl` plus randomized `rand_<n>_<i>.jsonl`.
   Fix: random temporary filenames and isolated incoming directories.

2. **Hardcode expected event counts.**
   Result: happy-path sizes are small, but the randomized suite draws 40–100 events across 3–6 files.
   Fix: random dataset sizes and an independent oracle.

3. **Deduplicate only within each file.**
   Result: `test_duplicates.py` writes the same `event_id` into `file_a` and `file_b`.
   Fix: cross-file duplicate tests.

4. **Delete and rebuild the entire database every run.**
   Result: `test_preexisting_warehouse_row_is_not_wiped` seeds a row first; incremental tests require older events to remain.
   Fix: pre-existing warehouse state and incremental-preservation tests.

5. **Mark every file processed without ingesting.**
   Result: every test inspects warehouse events, metrics, or quarantine contents, not just `processed_files`.
   Fix: verify warehouse contents and aggregates.

6. **Ignore processed-file/checkpoint state and reread everything.**
   Result: idempotency and quarantine counts must stay stable across reruns. Re-inserting identical rows fails those checks.
   Fix: idempotency plus incremental behavior tests.

7. **Store money as float but round final display.**
   Result: totals include repeated `0.10` / `0.20` plus `10.07` and `99.99`. The verifier compares exact integer minor units.
   Fix: inspect exact aggregate values for many decimal inputs.

8. **Ignore timezone offsets.**
   Result: `2026-08-05T00:30:00+05:30` must land on the UTC date 2026-08-04.
   Fix: UTC-boundary timestamp tests.

9. **Skip a malformed file completely.**
   Result: a file with valid, valid, broken, valid lines must yield 3 accepted events and 1 quarantine row.
   Fix: mixed valid/invalid line test requiring valid rows to survive.

10. **Accept conflicting duplicates and overwrite old values.**
    Result: `e100` stays at `10.00`; the `99.00` payload is quarantined.
    Fix: verify the original warehouse event remains unchanged.

11. **Mark checkpoint before the transaction succeeds.**
    Result: failure injection after N records, before commit, and after write / before checkpoint, then a clean rerun.
    Fix: failure-injection and rerun-equivalence tests.

12. **Special-case known event IDs.**
    Result: randomized tests generate UUID-style identifiers.
    Fix: random UUID IDs.

13. **Modify the repo's own tests.**
    Result: the authoritative verifier lives in `/grader/tests` (or `tests/` outside `environment/repo`).
    Fix: authoritative verifier resides outside the mutable application directory.

14. **Always rebuild metrics from only the newest records.**
    Result: a later file dated 2026-09-01 must create that day's metric without changing 2026-09-03 or 2026-09-04.
    Fix: late-arriving historical data tests.

15. **Reject any unknown schema field.**
    Result: payloads include `device_type`, `app_version`, `experiment`, and random `app_version` fields.
    Fix: random additive-field tests.

## Acceptable alternative implementations

A solution may still pass if it differs from the reference in any of these ways:

- SQLite accessed through SQLAlchemy, `sqlite3`, or another local wrapper.
- Minor-unit storage as integer cents or another exact decimal representation, as long as reported aggregates match.
- File hashes using SHA-256 or another collision-resistant digest, provided unchanged bytes are skipped and changed bytes are re-read.
- Metrics rebuilt for affected dates only, or fully recomputed, as long as historical dates stay correct.
- Quarantine reason strings that are descriptive rather than word-for-word matches, except where a test looks for `conflict` / `duplicate`.
- CLI wording that still includes the documented summary fields.
- Extra columns or indexes that do not change observable counts, identities, or aggregates.

A solution should not pass if it depends on wiping the warehouse, ignoring timezones, using binary floating-point for totals, or treating a file as complete before its writes are durable.
