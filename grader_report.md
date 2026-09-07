# Grader report

Overall status: **FAIL**

Command: `python scripts/grade.py`
Generated: 2026-09-07T15:09:31.250544+00:00
Candidate repo: `E:\Desktop\Project_2_P\PipeForge\environment\repo`
Authoritative tests: `E:\Desktop\Project_2_P\PipeForge\tests`
Pipeline imported from: `E:\Desktop\Project_2_P\PipeForge\environment\repo\pipeline\__init__.py`
Repeats deterministic: True

## Trust boundary

- Candidate code may modify `environment/repo` (the application).
- Authoritative tests, mandatory nodeids, and this grader live in `tests/`, `grader/`, and `scripts/grade.py`.
- Docker copies tests to `/grader/tests` and the application to `/workspace`.
- This grader executes pytest itself. A candidate script that prints PASS is ignored.
- Isolation is **not** a secure sandbox on a developer machine: the same git checkout is writable. Do not treat checksums in-tree as tamper resistance.

## Requirement-to-test mapping

| ID | Behavior | Tests | Mandatory | Result |
| --- | --- | --- | --- | --- |
| R1 | Rerunning unchanged input is idempotent. | `tests/test_idempotency.py::test_three_runs_of_the_same_file_are_idempotent`<br>`tests/test_empty_incoming.py::test_empty_incoming_directory_completes_with_zero_events`<br>`tests/test_randomized.py::test_randomized_dataset_matches_independent_oracle` | True | FAIL |
| R2 | Duplicate events are handled globally across files; one logical row per event_id. | `tests/test_duplicates.py::test_identical_duplicate_inside_one_file`<br>`tests/test_duplicates.py::test_duplicate_event_across_two_files` | True | FAIL |
| R3 | Conflicting reuse of an event_id does not overwrite the original row; the conflict is quarantined. | `tests/test_duplicates.py::test_conflicting_duplicate_keeps_original`<br>`tests/test_regression.py::test_mixed_rerun_duplicate_timezone_and_late_data` | True | FAIL |
| R4 | Malformed records are quarantined; valid siblings still load. | `tests/test_malformed_records.py::test_broken_json_line_is_quarantined_and_valid_rows_survive`<br>`tests/test_malformed_records.py::test_missing_event_id_is_quarantined` | True | PASS |
| R5 | Monetary values are aggregated as exact integer minor units. | `tests/test_money_precision.py::test_repeated_decimal_amounts_sum_exactly` | True | FAIL |
| R6 | Timezone-aware timestamps normalize to UTC; naive timestamps are quarantined. | `tests/test_timezone_handling.py::test_offset_crossing_utc_midnight_lands_on_previous_utc_date`<br>`tests/test_timezone_handling.py::test_naive_timestamp_is_quarantined` | True | FAIL |
| R7 | Additive unknown schema fields do not reject a valid event. | `tests/test_schema_evolution.py::test_extra_fields_are_tolerated` | True | PASS |
| R8 | Late-arriving records update historical UTC metrics without changing later days. | `tests/test_late_arrivals.py::test_late_september_first_updates_history_without_corrupting_later_days` | True | FAIL |
| R9 | Interrupted ingestion recovers to the same warehouse as a clean run. | `tests/test_crash_recovery.py::test_crash_after_n_records_then_rerun_matches_clean_run`<br>`tests/test_crash_recovery.py::test_checkpoint_not_success_until_ingestion_finishes` | True | FAIL |
| R10 | A file is not recorded as successfully processed until ingestion finishes safely. | `tests/test_atomicity.py::test_failure_before_commit_leaves_no_partial_success`<br>`tests/test_crash_recovery.py::test_checkpoint_not_success_until_ingestion_finishes` | True | FAIL |
| R11 | New files ingest incrementally; pre-existing warehouse rows are not wiped. | `tests/test_incremental_processing.py::test_new_file_is_added_without_duplicating_old_events`<br>`tests/test_incremental_processing.py::test_preexisting_warehouse_row_is_not_wiped` | True | FAIL |
| R12 | Same filename with changed bytes is new input; event_id rules still apply. | `tests/test_changed_file.py::test_changed_content_keeps_filename_but_ingests_new_logical_events` | True | FAIL |
| R13 | CLI remains functional and prints documented run/status fields. | `tests/test_cli.py::test_cli_run_and_status_print_documented_fields` | True | PASS |
| R14 | Dashboard remains functional and run/status/health use the pipeline. | `tests/test_dashboard_api.py::test_dashboard_health_status_and_run_use_pipeline` | True | PASS |
| R15 | Happy-path ingestion of a valid file loads events, metrics, and a completed run. | `tests/test_basic_ingestion.py::test_basic_ingestion_loads_ten_events` | True | PASS |
| R16 | Independent oracle on a seeded multi-file dataset including extras, duplicates, and late rows. | `tests/test_randomized.py::test_randomized_dataset_matches_independent_oracle` | True | FAIL |

## Assumptions (not treated as extra pass conditions)

- Harbor/Docker grades only Python ETL via pytest -q /grader/tests. Node/Next.js is not scored.
- Frontend visual quality is subjective and is not a mandatory automated requirement.
- Quarantine reason text may vary; tests only require conflict/duplicate wording where specified.
- CLI wording may vary as long as documented field labels are present.

## Human / subjective checks

- H1: Control-center aesthetics, typography, and animation taste. — Human visual review only. Automated tests cannot prove design quality.

## Repeats

- Run 1 (collection-order): pytest exit 1; collected=23 passed=9 failed=14 skipped=0 errors=0

## Failed or errored checks

- `tests/test_atomicity.py::test_failure_before_commit_leaves_no_partial_success` (failed): tests\test_atomicity.py:26: in test_failure_before_commit_leaves_no_partial_success
- `tests/test_changed_file.py::test_changed_content_keeps_filename_but_ingests_new_logical_events` (failed): tests\test_changed_file.py:37: in test_changed_content_keeps_filename_but_ingests_new_logical_events
- `tests/test_crash_recovery.py::test_crash_after_n_records_then_rerun_matches_clean_run` (failed): tests\test_crash_recovery.py:46: in test_crash_after_n_records_then_rerun_matches_clean_run
- `tests/test_crash_recovery.py::test_checkpoint_not_success_until_ingestion_finishes` (failed): tests\test_crash_recovery.py:68: in test_checkpoint_not_success_until_ingestion_finishes
- `tests/test_duplicates.py::test_conflicting_duplicate_keeps_original` (failed): tests\test_duplicates.py:49: in test_conflicting_duplicate_keeps_original
- `tests/test_duplicates.py::test_duplicate_event_across_two_files` (failed): tests\test_duplicates.py:34: in test_duplicate_event_across_two_files
- `tests/test_idempotency.py::test_three_runs_of_the_same_file_are_idempotent` (failed): tests\test_idempotency.py:33: in test_three_runs_of_the_same_file_are_idempotent
- `tests/test_incremental_processing.py::test_new_file_is_added_without_duplicating_old_events` (failed): tests\test_incremental_processing.py:28: in test_new_file_is_added_without_duplicating_old_events
- `tests/test_late_arrivals.py::test_late_september_first_updates_history_without_corrupting_later_days` (failed): tests\test_late_arrivals.py:26: in test_late_september_first_updates_history_without_corrupting_later_days
- `tests/test_money_precision.py::test_repeated_decimal_amounts_sum_exactly` (failed): tests\test_money_precision.py:38: in test_repeated_decimal_amounts_sum_exactly
- `tests/test_randomized.py::test_randomized_dataset_matches_independent_oracle` (failed): tests\test_randomized.py:160: in test_randomized_dataset_matches_independent_oracle
- `tests/test_regression.py::test_mixed_rerun_duplicate_timezone_and_late_data` (failed): tests\test_regression.py:44: in test_mixed_rerun_duplicate_timezone_and_late_data
- `tests/test_timezone_handling.py::test_naive_timestamp_is_quarantined` (failed): tests\test_timezone_handling.py:60: in test_naive_timestamp_is_quarantined
- `tests/test_timezone_handling.py::test_offset_crossing_utc_midnight_lands_on_previous_utc_date` (failed): tests\test_timezone_handling.py:42: in test_offset_crossing_utc_midnight_lands_on_previous_utc_date

## Checks not executed

None.

## Canary

Grader canary token present: True.
Candidate tree must not contain the canary token.

## Seeds / fixtures

- Isolated `tmp_path` incoming dirs and SQLite files per test (`tests/conftest.py`).
- Randomized suite seed: `20260812` in `tests/test_randomized.py`.

## Remaining gaps

- Next.js control-center aesthetics and animation (H1) are human visual review only.
- This checkout is writable. `grader/test_hashes.json` detects in-tree test edits; it is not a sandbox.
- `solution/` and `tests/` are visible locally. Harbor copies tests to `/grader/tests`.
- Dashboard checks invoke FastAPI route callables, not a live HTTP server.

## Isolated reference verification (executed 2026-09-07)

Command: `python scripts/grade_isolated_reference.py --repeats 3`

- Built `grader/scratch/isolated_reference_repo` from `environment/repo` + git `697007e` ETL overlay + `solution/reference.patch`.
- Result: **PASS**, 23/23 on each of three repeats (collection order + reverse).
- Artifacts: `grader/scratch/isolated_reference_report.md`, `grader/scratch/isolated_reference_results.json`.
- Live `environment/repo` was not modified by that command and remains the intentionally incomplete product tree (FAIL under `python scripts/grade.py`).

