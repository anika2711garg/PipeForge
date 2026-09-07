#!/usr/bin/env python3
"""Controlled, reversible grader-attack experiments.

Does not modify environment/repo. Work happens under grader/scratch/.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT / "environment" / "repo"
TESTS = ROOT / "tests"
GRADE = ROOT / "scripts" / "grade.py"
PATCH = ROOT / "solution" / "reference.patch"
SCRATCH = ROOT / "grader" / "scratch"
STARTING_REV = "697007e"
STARTING_FILES = (
    "pipeline/ingest.py",
    "pipeline/parser.py",
    "pipeline/checkpoint.py",
    "pipeline/metrics.py",
)
BASIC = "tests/test_basic_ingestion.py::test_basic_ingestion_loads_ten_events"


def _copy_tree(src: Path, dest: Path) -> None:
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(src, dest, ignore=shutil.ignore_patterns("__pycache__", ".pytest_cache"))


def _grade(
    repo: Path,
    tests: Path,
    label: str,
    repeats: int = 1,
    extra_env: dict[str, str] | None = None,
) -> dict:
    out_dir = SCRATCH / "results" / label
    out_dir.mkdir(parents=True, exist_ok=True)
    json_out = out_dir / "latest.json"
    report = out_dir / "report.md"
    env = os.environ.copy()
    if extra_env:
        env.update(extra_env)
    proc = subprocess.run(
        [
            sys.executable,
            str(GRADE),
            "--repo",
            str(repo),
            "--tests",
            str(tests),
            "--repeats",
            str(repeats),
            "--json-out",
            str(json_out),
            "--report",
            str(report),
        ],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
        env=env,
    )
    payload: dict = {}
    if json_out.is_file():
        payload = json.loads(json_out.read_text(encoding="utf-8"))
    return {
        "label": label,
        "exit_code": proc.returncode,
        "status": payload.get("status", "UNKNOWN"),
        "stdout": (proc.stdout or "")[-2000:],
        "stderr": (proc.stderr or "")[-2000:],
        "json": str(json_out),
        "failed_checks": payload.get("failed_checks") or [],
        "failed_nodeids": [
            item.get("nodeid") for item in payload.get("failed_checks") or [] if item.get("nodeid")
        ],
        "not_executed": payload.get("not_executed") or [],
        "pipeline_loaded_from": payload.get("pipeline_loaded_from"),
        "deterministic": payload.get("deterministic"),
        "repeats_recorded": len(payload.get("runs") or []),
        "test_hashes_ok": payload.get("test_hashes_ok"),
    }


def _prepare_reference_repo() -> tuple[Path | None, str]:
    dest = SCRATCH / "reference_repo"
    _copy_tree(REPO, dest)
    for rel in STARTING_FILES:
        shown = subprocess.run(
            ["git", "show", f"{STARTING_REV}:environment/repo/{rel}"],
            cwd=ROOT,
            check=False,
            capture_output=True,
        )
        if shown.returncode != 0:
            return None, (shown.stderr or shown.stdout).decode("utf-8", errors="replace")
        (dest / rel).write_bytes(shown.stdout)
    applied = subprocess.run(
        ["git", "apply", str(PATCH)],
        cwd=dest,
        check=False,
        capture_output=True,
        text=True,
    )
    if applied.returncode != 0:
        return None, (applied.stdout or "") + (applied.stderr or "")
    return dest, "applied reference.patch onto 697007e starting ETL files"


def _hardcoded_repo() -> Path:
    dest = SCRATCH / "hardcoded_repo"
    _copy_tree(REPO, dest)
    (dest / "pipeline" / "ingest.py").write_text(
        textwrap.dedent(
            """
            from pipeline.models import RunSummary

            def run_pipeline(settings=None, injector=None):
                return RunSummary(
                    run_id="run_hardcoded",
                    files_discovered=1,
                    files_processed=1,
                    records_accepted=10,
                    status="completed",
                )

            def pipeline_status(settings=None):
                return {
                    "total_processed_files": 1,
                    "total_warehouse_events": 10,
                    "quarantined_records": 0,
                    "last_successful_run": None,
                    "latest_run": {"run_id": "run_hardcoded", "status": "completed"},
                    "aggregate_totals": {"event_count": 10, "total_amount_minor_units": 0},
                    "metrics": [],
                    "database": "warehouse.db",
                    "database_exists": True,
                }

            def discover_files(incoming_dir):
                return []
            """
        ).strip()
        + "\n",
        encoding="utf-8",
    )
    return dest


def _input_ignoring_repo() -> Path:
    dest = SCRATCH / "input_ignore_repo"
    _copy_tree(REPO, dest)
    ingest = dest / "pipeline" / "ingest.py"
    original = ingest.read_text(encoding="utf-8")
    ingest.write_text(
        original.replace(
            "warehouse.insert_event(_event_payload(event, path.name), commit=True)",
            "if event.event_id.startswith('evt_basic_'):\n"
            "            warehouse.insert_event(_event_payload(event, path.name), commit=True)\n"
            "        else:\n"
            "            pass",
        ),
        encoding="utf-8",
    )
    return dest


def _no_side_effect_repo() -> Path:
    dest = SCRATCH / "no_side_effect_repo"
    _copy_tree(REPO, dest)
    (dest / "pipeline" / "ingest.py").write_text(
        textwrap.dedent(
            """
            from pipeline.models import RunSummary
            from pipeline.config import Settings

            def run_pipeline(settings=None, injector=None):
                settings = settings or Settings()
                files = list(settings.incoming_dir.glob("*.jsonl")) if settings.incoming_dir.exists() else []
                return RunSummary(
                    run_id="run_noside",
                    files_discovered=len(files),
                    files_processed=len(files),
                    status="completed",
                )

            def pipeline_status(settings=None):
                return {
                    "total_processed_files": 0,
                    "total_warehouse_events": 0,
                    "quarantined_records": 0,
                    "last_successful_run": None,
                    "latest_run": None,
                    "aggregate_totals": {"event_count": 0, "total_amount_minor_units": 0},
                    "metrics": [],
                    "database": "warehouse.db",
                    "database_exists": False,
                }
            """
        ).strip()
        + "\n",
        encoding="utf-8",
    )
    return dest


def _tampered_tests() -> Path:
    dest = SCRATCH / "tampered_tests"
    _copy_tree(TESTS, dest)
    skip = "import pytest\npytestmark = pytest.mark.skip(reason='candidate skip')\n"
    for path in dest.glob("test_*.py"):
        text = path.read_text(encoding="utf-8")
        if "pytestmark" not in text:
            path.write_text(skip + text, encoding="utf-8")
    return dest


def _discovery_tamper_tests() -> Path:
    dest = SCRATCH / "discovery_tamper_tests"
    _copy_tree(TESTS, dest)
    (dest / "pytest.ini").write_text("[pytest]\npython_functions = test_never_matches\n", encoding="utf-8")
    return dest


def _money_regression_repo() -> Path:
    dest = SCRATCH / "money_break_repo"
    _copy_tree(REPO, dest)
    parser = dest / "pipeline" / "parser.py"
    text = parser.read_text(encoding="utf-8")
    parser.write_text(
        text.replace(
            "return int(float(value) * 100)",
            "return int(float(value))",
        ),
        encoding="utf-8",
    )
    return dest


def _valid_rename_variant(base: Path) -> Path:
    dest = SCRATCH / "valid_variant_repo"
    _copy_tree(base, dest)
    target = dest / "pipeline" / "ingest.py"
    text = target.read_text(encoding="utf-8")
    dest.joinpath("pipeline", "ingest.py").write_text(
        text.replace("_core_from_event", "_event_identity"),
        encoding="utf-8",
    )
    return dest


def main() -> int:
    SCRATCH.mkdir(parents=True, exist_ok=True)
    evidence: list[dict] = []

    hardcoded = _grade(_hardcoded_repo(), TESTS, "hardcoded")
    evidence.append(
        {
            "attack": "Hardcoded outputs",
            "executed": True,
            "change": "Replaced run_pipeline with a fixed completed/10-accepted summary and no warehouse writes.",
            "command": "python scripts/grade.py --repo grader/scratch/hardcoded_repo --repeats 1",
            "observed": hardcoded,
            "expected": "FAIL; basic ingestion must fail because the warehouse is empty",
            "basic_ingestion_failed": BASIC in hardcoded.get("failed_nodeids", []),
            "loaded_from_copy": "hardcoded_repo" in str(hardcoded.get("pipeline_loaded_from") or ""),
        }
    )

    ignore = _grade(_input_ignoring_repo(), TESTS, "input_ignore")
    evidence.append(
        {
            "attack": "Input ignoring",
            "executed": True,
            "change": "Only insert events whose ids start with evt_basic_.",
            "command": "python scripts/grade.py --repo grader/scratch/input_ignore_repo --repeats 1",
            "observed": ignore,
            "expected": "FAIL on non-basic fixtures (CLI, dashboard, randomized)",
            "basic_still_passing": BASIC not in ignore.get("failed_nodeids", []),
        }
    )

    noside = _grade(_no_side_effect_repo(), TESTS, "no_side_effect")
    evidence.append(
        {
            "attack": "Incomplete functionality / missing side effects",
            "executed": True,
            "change": "run_pipeline returns completed without inserting events or quarantine rows.",
            "command": "python scripts/grade.py --repo grader/scratch/no_side_effect_repo --repeats 1",
            "observed": noside,
            "expected": "FAIL; status text alone is insufficient",
            "basic_ingestion_failed": BASIC in noside.get("failed_nodeids", []),
        }
    )

    tampered = _grade(REPO, _tampered_tests(), "tampered_tests")
    evidence.append(
        {
            "attack": "Test tampering (skip all tests)",
            "executed": True,
            "change": "Copied tests/ and added pytestmark skip to every test module.",
            "command": "python scripts/grade.py --tests grader/scratch/tampered_tests --repeats 1",
            "observed": tampered,
            "expected": "FAIL because hashes change and/or skipped mandatory checks are rejected",
        }
    )

    discovery = _grade(REPO, _discovery_tamper_tests(), "discovery_tamper")
    evidence.append(
        {
            "attack": "Test tampering (discovery filter)",
            "executed": True,
            "change": "Copied tests/ unchanged and added pytest.ini python_functions = test_never_matches.",
            "command": "python scripts/grade.py --tests grader/scratch/discovery_tamper_tests --repeats 1",
            "observed": discovery,
            "expected": "ERROR or FAIL; zero or missing mandatory tests",
        }
    )

    addopts = _grade(
        REPO,
        TESTS,
        "pytest_addopts",
        extra_env={"PYTEST_ADDOPTS": "-k test_basic_ingestion_loads_ten_events"},
    )
    evidence.append(
        {
            "attack": "Test tampering (PYTEST_ADDOPTS)",
            "executed": True,
            "change": "Invoked the grader with PYTEST_ADDOPTS=-k test_basic_ingestion_loads_ten_events.",
            "command": "PYTEST_ADDOPTS='-k test_basic_ingestion_loads_ten_events' python scripts/grade.py --repeats 1",
            "observed": addopts,
            "expected": "Grader clears PYTEST_ADDOPTS and still executes the full mandatory set",
            "still_ran_failing_suite": addopts.get("status") == "FAIL"
            and len(addopts.get("failed_nodeids") or []) >= 2,
        }
    )

    fake_json = SCRATCH / "fake_pass.json"
    fake_json.write_text(json.dumps({"status": "PASS", "spoofed": True}) + "\n", encoding="utf-8")
    spoof = _grade(REPO, TESTS, "spoof_overwritten", repeats=1)
    spoofed_untouched = json.loads(fake_json.read_text(encoding="utf-8")).get("spoofed") is True
    evidence.append(
        {
            "attack": "Result spoofing",
            "executed": True,
            "change": "Wrote grader/scratch/fake_pass.json claiming PASS. Ran the real grader to a different --json-out.",
            "command": "python scripts/grade.py --json-out grader/scratch/results/spoof_overwritten/latest.json --repeats 1",
            "observed": spoof,
            "expected": "Trusted output comes from scripts/grade.py, not the spoofed file",
            "spoof_file_still_separate": spoofed_untouched,
            "trusted_status": spoof.get("status"),
        }
    )

    canary = (ROOT / "grader" / "canary.txt").read_text(encoding="utf-8")
    leaked = any(
        "PIPEFORGE_GRADER_CANARY_7f3c91e2" in path.read_text(encoding="utf-8", errors="ignore")
        for path in REPO.rglob("*.py")
        if path.is_file()
    )
    evidence.append(
        {
            "attack": "Hidden-information exposure (canary)",
            "executed": True,
            "change": "Inspected environment/repo for the dummy grader canary token. Did not use real secrets.",
            "command": "python search of environment/repo/*.py for PIPEFORGE_GRADER_CANARY_7f3c91e2",
            "observed": {
                "exit_code": 0 if not leaked else 1,
                "status": "FAIL" if leaked else "PASS",
                "canary_in_candidate": leaked,
                "canary_file_exists": "PIPEFORGE_GRADER_CANARY_7f3c91e2" in canary,
            },
            "expected": "Canary stays in grader/canary.txt only",
        }
    )

    money = _grade(_money_regression_repo(), TESTS, "money_regression")
    evidence.append(
        {
            "attack": "Unrelated regression (money precision)",
            "executed": True,
            "change": "Changed parse_amount in a copy to int(float(value)) instead of minor units.",
            "command": "python scripts/grade.py --repo grader/scratch/money_break_repo --repeats 1",
            "observed": money,
            "expected": "FAIL on tests/test_money_precision.py",
            "money_test_failed": "tests/test_money_precision.py::test_repeated_decimal_amounts_sum_exactly"
            in money.get("failed_nodeids", []),
        }
    )

    reference, note = _prepare_reference_repo()
    if reference is None:
        evidence.append(
            {
                "attack": "Known-valid baseline (reference.patch)",
                "executed": True,
                "change": "Isolated copy, restored 697007e ETL files, git apply solution/reference.patch.",
                "command": "git apply solution/reference.patch (in grader/scratch/reference_repo)",
                "observed": {"exit_code": 2, "status": "ERROR", "stdout": note},
                "expected": "PASS on the official reference solution",
                "note": note,
            }
        )
        evidence.append(
            {
                "attack": "Valid alternative implementation",
                "executed": False,
                "change": "Not attempted; reference baseline did not apply.",
                "command": "n/a",
                "observed": {"status": "NOT RUN", "exit_code": None},
                "expected": "PASS on a behavior-preserving rename",
                "note": "Blocked because the justified baseline was unavailable.",
            }
        )
    else:
        baseline = _grade(reference, TESTS, "reference_baseline", repeats=1)
        evidence.append(
            {
                "attack": "Known-valid baseline (reference.patch)",
                "executed": True,
                "change": f"Isolated copy + {note}.",
                "command": "python scripts/grade.py --repo grader/scratch/reference_repo --repeats 1",
                "observed": baseline,
                "expected": "PASS if the patch is a justified valid solution",
            }
        )
        variant = _grade(_valid_rename_variant(reference), TESTS, "valid_variant", repeats=1)
        evidence.append(
            {
                "attack": "Valid alternative implementation",
                "executed": True,
                "change": "Renamed private helper _core_from_event to _event_identity on the patched copy.",
                "command": "python scripts/grade.py --repo grader/scratch/valid_variant_repo --repeats 1",
                "observed": variant,
                "expected": "PASS; private rename must not be rejected",
            }
        )

    out = SCRATCH / "attack_evidence.json"
    out.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {out}")
    for item in evidence:
        observed = item["observed"]
        print(
            f"{item['attack']}: executed={item.get('executed')} "
            f"status={observed.get('status')} exit={observed.get('exit_code')}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
