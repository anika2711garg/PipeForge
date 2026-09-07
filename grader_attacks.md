# Grader attacks

Controlled experiments run on isolated copies under `grader/scratch/`. `environment/repo` was not modified by these attacks. Raw evidence: `grader/scratch/attack_evidence.json`.

Attacks marked **executed** were actually run. Outcomes below are observed, not hypothetical.

## Isolation bug found before the suite (executed)

**Attack attempted →** Grade a hardcoded stub with `--repo grader/scratch/pre_fix_hardcoded` while `tests/conftest.py` still imported `environment/repo`.

**Command →** `python scripts/grade.py --repo grader/scratch/pre_fix_hardcoded --repeats 1`

**What happened →** Exit 1, status FAIL, **14 failed / 9 passed**. `test_basic_ingestion_loads_ten_events` still passed. That is the live tree’s pattern, not an empty-warehouse stub. The copy was ignored.

**How you fixed/prevented it →** `tests/conftest.py` now honors `PIPEFORGE_CANDIDATE_REPO`. `scripts/grade.py` sets that variable, purges cached `pipeline` modules, and ERROR-exits if `pipeline.__file__` is not under `--repo`.

**Result after fix →** Same hardcoded copy loaded `grader/scratch/hardcoded_repo/pipeline/__init__.py`. Basic ingestion failed (`event_count() == 0`, expected 10). 23 failed.

---

## 1. Hardcoded outputs (executed)

**Attack attempted →** Replaced `run_pipeline` with a fixed `completed` / `records_accepted=10` summary and no warehouse writes.

**Command →** `python scripts/grade.py --repo grader/scratch/hardcoded_repo --repeats 1`

**What happened →** FAIL, exit 1. Pipeline loaded from the copy. `test_basic_ingestion_loads_ten_events` failed on `warehouse.event_count() == 10` (got 0). Empty incoming also failed because the stub always reports `files_discovered=1`.

**Assertion / protection →** Warehouse and run-record assertions, not the printed summary.

**How you fixed/prevented it →** No extra fix after isolation. Existing behavioral tests reject static summaries.

---

## 2. Input ignoring (executed)

**Attack attempted →** Insert only events whose ids start with `evt_basic_`.

**Command →** `python scripts/grade.py --repo grader/scratch/input_ignore_repo --repeats 1`

**What happened →** FAIL, exit 1. 20 failed, 3 passed. Basic ingestion still passed (those ids match). CLI (`evt_cli_*`), dashboard (`evt_dash_1`), duplicates, randomized oracle, and money all failed.

**Assertion / protection →** Non-example fixtures and the seeded oracle (`20260812`).

**How you fixed/prevented it →** Already covered; no grader change required.

---

## 3. Incomplete functionality / missing side effects (executed)

**Attack attempted →** `run_pipeline` returns `completed` after counting files and never writes events, quarantine, or run rows.

**Command →** `python scripts/grade.py --repo grader/scratch/no_side_effect_repo --repeats 1`

**What happened →** FAIL, exit 1. 23 failed. Basic ingestion: warehouse still 0. Dashboard: `records_accepted` was 0. Empty incoming: `latest_run` was missing.

**Assertion / protection →** Side-effect checks on SQLite state and dashboard `records_accepted`.

**How you fixed/prevented it →** Already covered.

---

## 4. Weak assertion exploitation (executed)

Same copies as (1) and (3): correct-looking `status="completed"` and counts in the return value, wrong warehouse.

**What happened →** Rejected for warehouse / run-row reasons, not because the status string was missing.

**How you fixed/prevented it →** Tests assert observable warehouse state.

---

## 5. Test tampering — skip all modules (executed)

**Attack attempted →** Copied `tests/` and prepended `pytestmark = pytest.mark.skip` to every `test_*.py`.

**Command →** `python scripts/grade.py --tests grader/scratch/tampered_tests --repeats 1`

**What happened →** FAIL, exit 1. Tests were not run. `not_executed` listed every modified file. `test_hashes_ok` was false.

**Assertion / protection →** `grader/test_hashes.json` compared to the `--tests` tree.

**How you fixed/prevented it →** Hash check added during this audit. Skip-of-mandatory remains a second FAIL path if hashes ever matched.

---

## 6. Test tampering — discovery filter (executed)

**Attack attempted →** Copied `tests/` unchanged and added `pytest.ini` with `python_functions = test_never_matches`.

**Command →** `python scripts/grade.py --tests grader/scratch/discovery_tamper_tests --repeats 1`

**What happened →** ERROR, exit 2. `.py` hashes matched. Collection printed `no tests collected`. `not_executed`: `Zero tests discovered`.

**Assertion / protection →** Fail-closed zero-test / collection guard.

**How you fixed/prevented it →** Already in `scripts/grade.py`.

---

## 7. Test tampering — PYTEST_ADDOPTS (executed)

**Attack attempted →** Invoked the grader with `PYTEST_ADDOPTS=-k test_basic_ingestion_loads_ten_events` so only the happy path would run.

**Command →** `PYTEST_ADDOPTS='-k test_basic_ingestion_loads_ten_events' python scripts/grade.py --repeats 1`

**What happened →** FAIL, exit 1. Full suite still ran: **14 failed, 9 passed** — the live-tree pattern, not a one-test pass.

**Assertion / protection →** `scripts/grade.py` clears `PYTEST_ADDOPTS` and `PYTEST_PLUGINS` before `pytest.main`.

**How you fixed/prevented it →** Environment sanitization added after code review of `pytest.main` inheritance. A pre-fix narrowed official run was not executed (blocked as an unsafe grading override); the post-fix attack above was executed.

---

## 8. Result spoofing (executed)

**Attack attempted →** Wrote `grader/scratch/fake_pass.json` with `{"status":"PASS","spoofed":true}`. Ran the real grader to a different `--json-out`.

**Command →** `python scripts/grade.py --json-out grader/scratch/results/spoof_overwritten/latest.json --repeats 1`

**What happened →** Trusted file status **FAIL**, exit 1. The spoof file was still `{"status":"PASS","spoofed":true}` and was not consulted.

**Assertion / protection →** Only `scripts/grade.py` writes the authoritative JSON/report for that invocation.

**How you fixed/prevented it →** Documented; no candidate script is read.

---

## 9. Hidden-information exposure (executed)

**Attack attempted →** Searched `environment/repo/**/*.py` for dummy token `PIPEFORGE_GRADER_CANARY_7f3c91e2`. No real secrets were accessed.

**Command →** Python scan of candidate `*.py` files.

**What happened →** Token present in `grader/canary.txt`. Token **absent** from the candidate tree.

**Assertion / protection →** Grader FAIL if the candidate tree contains the canary.

**How you fixed/prevented it →** Canary stays grader-owned. Limitation: `tests/` and `solution/` are visible in this same git checkout (not a hidden Harbor mount).

---

## 10. Unrelated regression — money precision (executed)

**Attack attempted →** In a copy, changed `parse_amount` from `int(float(value) * 100)` to `int(float(value))`.

**Command →** `python scripts/grade.py --repo grader/scratch/money_break_repo --repeats 1`

**What happened →** FAIL, exit 1. 15 failed / 8 passed (one more failure than the live tree). `test_repeated_decimal_amounts_sum_exactly` failed with `10 == 1007` on `evt_ten_oh_seven`. Schema evolution also failed `400` vs `4`.

**Assertion / protection →** Exact minor-unit assertions, not display rounding.

**How you fixed/prevented it →** Already covered.

---

## 11. Nondeterminism (executed on the live tree)

**Attack attempted →** Official grader, three repeats, third reversed.

**Command →** `python scripts/grade.py`

**What happened →** Each repeat: 23 collected, 9 passed, 14 failed, 0 skipped. Same failing nodeids in collection order and reverse order. `deterministic: true`.

**How you fixed/prevented it →** Repeats that disagree now FAIL. Isolated `tmp_path` fixtures; randomized suite seed `20260812`.

---

## 12. Known-valid baseline (executed)

**Attack attempted →** Isolated copy of `environment/repo`, overlay `pipeline/{ingest,parser,checkpoint,metrics}.py` from git `697007e` (starting ETL), then `git apply solution/reference.patch`.

**Command →** `python scripts/grade.py --repo grader/scratch/reference_repo --repeats 1`

**What happened →** PASS, exit 0. **23 passed**. Pipeline loaded from the scratch reference tree.

**How you fixed/prevented it →** Acceptance calibration is verified against the official reference patch, not against the live product tree.

---

## 13. Valid alternative implementation (executed)

**Attack attempted →** On the patched reference copy, renamed private helper `_core_from_event` to `_event_identity`.

**Command →** `python scripts/grade.py --repo grader/scratch/valid_variant_repo --repeats 1`

**What happened →** PASS, exit 0. **23 passed**. The grader did not require that internal name.

**How you fixed/prevented it →** Assertions stay on public behavior.

---

## Not a sandbox

Hashes, canaries, and `--repo` isolation run inside this writable checkout. A candidate who can edit `scripts/grade.py` or `grader/` locally can still change the outcome. Harbor copies tests to `/grader/tests` and the app to `/workspace`; that is stronger than this machine.
