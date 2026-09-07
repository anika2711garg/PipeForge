#!/usr/bin/env python3
"""Fail-closed PipeForge grader.

Authoritative command (from the repository root):

    python scripts/grade.py

Exit codes:
    0  PASS   — every mandatory check passed on every repeat
    1  FAIL   — application behavior failed a required check
    2  ERROR  — infrastructure / collection / incomplete grading run
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REPO = ROOT / "environment" / "repo"
DEFAULT_TESTS = ROOT / "tests"
MANDATORY_PATH = ROOT / "grader" / "mandatory_tests.json"
MAP_PATH = ROOT / "grader" / "requirements_map.json"
HASH_PATH = ROOT / "grader" / "test_hashes.json"
CANARY_PATH = ROOT / "grader" / "canary.txt"
CANARY_TOKEN = "PIPEFORGE_GRADER_CANARY_7f3c91e2"


@dataclass
class CheckResult:
    nodeid: str
    outcome: str
    detail: str = ""


@dataclass
class RunResult:
    index: int
    order: str
    exit_code: int
    collected: int
    passed: int
    failed: int
    skipped: int
    errors: int
    checks: list[CheckResult] = field(default_factory=list)


class _Recorder:
    def __init__(self) -> None:
        self.collected: list[str] = []
        self.checks: list[CheckResult] = []

    def pytest_collection_modifyitems(self, items: list[Any]) -> None:
        self.collected = [_norm(item.nodeid) for item in items]

    def pytest_runtest_logreport(self, report: Any) -> None:
        nodeid = _norm(report.nodeid)
        if report.when == "setup" and report.failed:
            self.checks.append(CheckResult(nodeid, "error", _safe_repr(report)))
            return
        if report.when == "setup" and report.skipped:
            self.checks.append(CheckResult(nodeid, "skipped", _safe_repr(report)))
            return
        if report.when != "call":
            return
        if report.passed:
            self.checks.append(CheckResult(nodeid, "passed"))
        elif report.skipped:
            self.checks.append(CheckResult(nodeid, "skipped", _safe_repr(report)))
        elif report.failed:
            self.checks.append(CheckResult(nodeid, "failed", _safe_repr(report)))


def _norm(nodeid: str) -> str:
    return nodeid.replace("\\", "/")


def _safe_repr(report: Any) -> str:
    text = str(getattr(report, "longrepr", "") or "")
    return text[:4000]


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _mandatory() -> list[str]:
    items = _load_json(MANDATORY_PATH)
    if not isinstance(items, list) or not items:
        raise RuntimeError("mandatory_tests.json is missing or empty")
    return [_norm(str(item)) for item in items]


def _normalized_sha256(path: Path) -> str:
    data = path.read_bytes().replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    return hashlib.sha256(data).hexdigest()


def _test_file_hashes(tests: Path) -> dict[str, str]:
    hashes: dict[str, str] = {}
    for path in sorted(tests.glob("*.py")):
        hashes[path.name] = _normalized_sha256(path)
    return hashes


def _hash_problems(tests: Path) -> list[str]:
    if not HASH_PATH.is_file():
        return ["Missing grader/test_hashes.json"]
    expected = _load_json(HASH_PATH)
    if not isinstance(expected, dict) or not expected:
        return ["grader/test_hashes.json is empty or invalid"]
    current = _test_file_hashes(tests)
    problems: list[str] = []
    for name, digest in expected.items():
        if name not in current:
            problems.append(f"Missing authoritative test file: {name}")
        elif current[name] != digest:
            problems.append(f"Authoritative test file was modified: {name}")
    return problems


def _purge_pipeline_modules() -> None:
    for name in list(sys.modules):
        if name == "pipeline" or name.startswith("pipeline."):
            del sys.modules[name]


def _bind_candidate(repo: Path, tests: Path) -> None:
    repo_s = str(repo.resolve())
    tests_s = str(tests.resolve())
    os.environ.pop("PYTEST_ADDOPTS", None)
    os.environ.pop("PYTEST_PLUGINS", None)
    os.environ["PIPEFORGE_CANDIDATE_REPO"] = repo_s
    env_path = os.environ.get("PYTHONPATH", "")
    parts = [p for p in env_path.split(os.pathsep) if p and Path(p).resolve() != repo.resolve()]
    os.environ["PYTHONPATH"] = os.pathsep.join([repo_s, *parts])
    _purge_pipeline_modules()
    for item in (repo_s, tests_s):
        if item in sys.path:
            sys.path.remove(item)
    sys.path.insert(0, tests_s)
    sys.path.insert(0, repo_s)


def _pipeline_origin() -> str | None:
    module = sys.modules.get("pipeline")
    location = getattr(module, "__file__", None) if module is not None else None
    return str(Path(location).resolve()) if location else None


def _pipeline_is_from_repo(repo: Path) -> bool:
    origin = _pipeline_origin()
    if not origin:
        return False
    origin_p = Path(origin).resolve()
    repo_p = repo.resolve()
    return repo_p in origin_p.parents or origin_p.parent == repo_p


def _run_pytest(
    tests: Path,
    repo: Path,
    nodeids: list[str] | None,
    *,
    collect_only: bool = False,
) -> tuple[int, _Recorder]:
    import pytest

    recorder = _Recorder()
    _bind_candidate(repo, tests)

    args = ["-q", "-p", "no:cacheprovider"]
    if collect_only:
        args.append("--collect-only")
    else:
        args.extend(["--tb=short"])
    if nodeids:
        args.extend(nodeids)
    else:
        args.append(str(tests))
    code = pytest.main(args, plugins=[recorder])
    return int(code), recorder


def _summarize(index: int, order: str, code: int, recorder: _Recorder) -> RunResult:
    counts = {"passed": 0, "failed": 0, "skipped": 0, "error": 0}
    for check in recorder.checks:
        counts[check.outcome] = counts.get(check.outcome, 0) + 1
    return RunResult(
        index=index,
        order=order,
        exit_code=code,
        collected=len(recorder.collected),
        passed=counts.get("passed", 0),
        failed=counts.get("failed", 0),
        skipped=counts.get("skipped", 0),
        errors=counts.get("error", 0),
        checks=recorder.checks,
    )


def _write_outputs(payload: dict[str, Any], json_path: Path, report_path: Path) -> None:
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    report_path.write_text(_render_report(payload), encoding="utf-8")


def _render_report(payload: dict[str, Any]) -> str:
    mapping = payload.get("requirement_mapping") or []
    lines = [
        "# Grader report",
        "",
        f"Overall status: **{payload['status']}**",
        "",
        f"Command: `{payload['command']}`",
        f"Generated: {payload['generated_at']}",
        f"Candidate repo: `{payload['repo']}`",
        f"Authoritative tests: `{payload['tests']}`",
        f"Pipeline imported from: `{payload.get('pipeline_loaded_from') or 'unknown'}`",
        f"Repeats deterministic: {payload.get('deterministic')}",
        "",
        "## Trust boundary",
        "",
        "- Candidate code may modify `environment/repo` (the application).",
        "- Authoritative tests, mandatory nodeids, and this grader live in `tests/`, `grader/`, and `scripts/grade.py`.",
        "- Docker copies tests to `/grader/tests` and the application to `/workspace`.",
        "- This grader executes pytest itself. A candidate script that prints PASS is ignored.",
        "- Isolation is **not** a secure sandbox on a developer machine: the same git checkout is writable. Do not treat checksums in-tree as tamper resistance.",
        "",
        "## Requirement-to-test mapping",
        "",
        "| ID | Behavior | Tests | Mandatory | Result |",
        "| --- | --- | --- | --- | --- |",
    ]
    for row in mapping:
        tests = "<br>".join(f"`{item}`" for item in row["tests"])
        lines.append(
            f"| {row['id']} | {row['behavior']} | {tests} | {row['mandatory']} | {row['result']} |"
        )
    lines.extend(
        [
            "",
            "## Assumptions (not treated as extra pass conditions)",
            "",
        ]
    )
    for item in payload.get("assumptions") or []:
        lines.append(f"- {item}")
    lines.extend(["", "## Human / subjective checks", ""])
    for item in payload.get("optional_or_human") or []:
        lines.append(f"- {item['id']}: {item['behavior']} — {item['verification']}")
    lines.extend(
        [
            "",
            "## Repeats",
            "",
        ]
    )
    for run in payload.get("runs") or []:
        lines.append(
            f"- Run {run['index']} ({run['order']}): pytest exit {run['exit_code']}; "
            f"collected={run['collected']} passed={run['passed']} failed={run['failed']} "
            f"skipped={run['skipped']} errors={run['errors']}"
        )
    failed = payload.get("failed_checks") or []
    lines.extend(["", "## Failed or errored checks", ""])
    if not failed:
        lines.append("None.")
    else:
        for item in failed:
            detail = (item.get("detail") or "").strip().splitlines()
            excerpt = detail[0] if detail else item.get("outcome")
            lines.append(f"- `{item['nodeid']}` ({item['outcome']}): {excerpt}")
    skipped_exec = payload.get("not_executed") or []
    lines.extend(["", "## Checks not executed", ""])
    if not skipped_exec:
        lines.append("None.")
    else:
        for item in skipped_exec:
            lines.append(f"- {item}")
    lines.extend(
        [
            "",
            "## Canary",
            "",
            f"Grader canary token present: {payload.get('canary_present')}.",
            "Candidate tree must not contain the canary token.",
            "",
            "## Seeds / fixtures",
            "",
            "- Isolated `tmp_path` incoming dirs and SQLite files per test (`tests/conftest.py`).",
            "- Randomized suite seed: `20260812` in `tests/test_randomized.py`.",
            "",
            "## Remaining gaps",
            "",
            "- Next.js control-center aesthetics and animation (H1) are human visual review only.",
            "- This checkout is writable. `grader/test_hashes.json` detects in-tree test edits; it is not a sandbox.",
            "- `solution/` and `tests/` are visible locally. Harbor copies tests to `/grader/tests`.",
            "- Dashboard checks invoke FastAPI route callables, not a live HTTP server.",
            "",
        ]
    )
    return "\n".join(lines) + "\n"


def grade(repo: Path, tests: Path, repeats: int, json_path: Path, report_path: Path) -> int:
    command = "python scripts/grade.py"
    generated = datetime.now(timezone.utc).isoformat()
    payload: dict[str, Any] = {
        "status": "ERROR",
        "command": command,
        "generated_at": generated,
        "repo": str(repo),
        "tests": str(tests),
        "repeats": repeats,
        "failed_checks": [],
        "not_executed": [],
        "runs": [],
        "canary_present": CANARY_PATH.is_file()
        and CANARY_TOKEN in CANARY_PATH.read_text(encoding="utf-8"),
        "candidate_contains_canary": False,
        "pipeline_loaded_from": None,
        "deterministic": None,
        "test_hashes_ok": False,
    }

    def finish(status: str, exit_code: int, extra_not_executed: list[str] | None = None) -> int:
        payload["status"] = status
        if extra_not_executed:
            payload["not_executed"].extend(extra_not_executed)
        _write_outputs(payload, json_path, report_path)
        print(f"{status}: see {report_path} and {json_path}")
        return exit_code

    if not tests.is_dir():
        return finish("ERROR", 2, [f"Missing tests directory: {tests}"])
    if not repo.is_dir():
        return finish("ERROR", 2, [f"Missing candidate repo: {repo}"])
    if not MANDATORY_PATH.is_file() or not MAP_PATH.is_file():
        return finish("ERROR", 2, ["Missing grader/mandatory_tests.json or grader/requirements_map.json"])
    if not payload["canary_present"]:
        return finish("ERROR", 2, ["Missing grader canary token"])

    hash_problems = _hash_problems(tests)
    payload["test_hashes_ok"] = not hash_problems
    if hash_problems:
        payload["not_executed"] = hash_problems
        return finish("FAIL", 1)

    candidate_text = []
    for path in repo.rglob("*"):
        if path.is_file() and path.suffix in {".py", ".md", ".txt", ".json"}:
            try:
                candidate_text.append(path.read_text(encoding="utf-8", errors="ignore"))
            except OSError:
                continue
    payload["candidate_contains_canary"] = any(CANARY_TOKEN in chunk for chunk in candidate_text)

    try:
        mandatory = _mandatory()
        mapping_doc = _load_json(MAP_PATH)
    except Exception as exc:
        return finish("ERROR", 2, [f"Unable to load grader metadata: {exc}"])

    payload["assumptions"] = mapping_doc.get("assumptions") or []
    payload["optional_or_human"] = mapping_doc.get("optional_or_human") or []

    os.chdir(ROOT)
    collect_code, collector = _run_pytest(tests, repo, None, collect_only=True)
    collected = collector.collected
    if collect_code == 5 or not collected:
        return finish("ERROR", 2, ["Zero tests discovered"])
    if collect_code not in {0, 1}:
        return finish("ERROR", 2, [f"Collection/infrastructure pytest exit {collect_code}"])

    missing = [item for item in mandatory if item not in collected]
    if missing:
        payload["not_executed"] = [f"Missing mandatory test: {item}" for item in missing]
        payload["requirement_mapping"] = _map_results(mapping_doc, {}, missing)
        return finish("FAIL", 1)

    payload["pipeline_loaded_from"] = _pipeline_origin()
    if not _pipeline_is_from_repo(repo):
        return finish(
            "ERROR",
            2,
            [
                "pytest imported pipeline from "
                f"{payload['pipeline_loaded_from'] or 'unknown'} instead of {repo}"
            ],
        )

    runs: list[RunResult] = []
    last_outcomes: dict[str, str] = {}
    failed_checks: list[dict[str, str]] = []
    any_fail = False

    orders = ["collection-order", "collection-order", "reversed"]
    for index in range(repeats):
        order = orders[min(index, len(orders) - 1)]
        selected = list(reversed(mandatory)) if order == "reversed" else list(mandatory)
        code, recorder = _run_pytest(tests, repo, selected)
        run = _summarize(index + 1, order, code, recorder)
        runs.append(run)
        payload["runs"] = [asdict(item) for item in runs]
        if code in {2, 3, 4, 5}:
            return finish("ERROR", 2, [f"Run {index + 1} infrastructure pytest exit {code}"])
        if run.collected == 0:
            return finish("ERROR", 2, [f"Run {index + 1} collected zero tests"])
        if run.skipped:
            skipped = [item.nodeid for item in run.checks if item.outcome == "skipped"]
            payload["not_executed"] = [f"Skipped mandatory test: {item}" for item in skipped]
            return finish("FAIL", 1)
        for check in run.checks:
            last_outcomes[check.nodeid] = check.outcome
            if check.outcome in {"failed", "error"}:
                failed_checks.append(asdict(check))
        if code != 0 or run.failed or run.errors:
            any_fail = True
        origin = _pipeline_origin()
        if origin:
            payload["pipeline_loaded_from"] = origin
        if not _pipeline_is_from_repo(repo):
            return finish(
                "ERROR",
                2,
                [
                    "pytest imported pipeline from "
                    f"{origin or 'unknown'} instead of {repo}"
                ],
            )

    outcome_sets = [
        tuple(sorted((item.nodeid, item.outcome) for item in run.checks))
        for run in runs
    ]
    payload["deterministic"] = bool(outcome_sets) and len(set(outcome_sets)) == 1
    if not payload["deterministic"]:
        any_fail = True
        payload["not_executed"].append(
            "Repeats disagreed on pass/fail outcomes; suite is not deterministic."
        )

    last_failed = [
        asdict(item)
        for item in (runs[-1].checks if runs else [])
        if item.outcome in {"failed", "error"}
    ]
    payload["failed_checks"] = last_failed or failed_checks
    payload["requirement_mapping"] = _map_results(mapping_doc, last_outcomes, [])
    if payload["candidate_contains_canary"]:
        payload["not_executed"].append(
            "Candidate tree contains the grader canary token; hidden-information exposure."
        )
        return finish("FAIL", 1)
    if any_fail or failed_checks:
        return finish("FAIL", 1)
    return finish("PASS", 0)


def _map_results(
    mapping_doc: dict[str, Any],
    outcomes: dict[str, str],
    missing: list[str],
) -> list[dict[str, Any]]:
    rows = []
    for req in mapping_doc.get("requirements") or []:
        tests = [_norm(item) for item in req.get("tests") or []]
        states = []
        for nodeid in tests:
            if nodeid in missing:
                states.append("missing")
            else:
                states.append(outcomes.get(nodeid, "not-run"))
        if any(state in {"failed", "error", "missing"} for state in states):
            result = "FAIL"
        elif any(state == "not-run" for state in states):
            result = "NOT RUN"
        elif all(state == "passed" for state in states):
            result = "PASS"
        else:
            result = "FAIL"
        rows.append(
            {
                "id": req.get("id"),
                "behavior": req.get("behavior"),
                "tests": tests,
                "mandatory": bool(req.get("mandatory")),
                "result": result,
            }
        )
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description="PipeForge fail-closed grader")
    parser.add_argument("--repo", type=Path, default=DEFAULT_REPO)
    parser.add_argument("--tests", type=Path, default=DEFAULT_TESTS)
    parser.add_argument("--repeats", type=int, default=3)
    parser.add_argument("--json-out", type=Path, default=ROOT / "grader" / "results" / "latest.json")
    parser.add_argument("--report", type=Path, default=ROOT / "grader_report.md")
    args = parser.parse_args()
    if args.repeats < 1:
        print("ERROR: repeats must be >= 1", file=sys.stderr)
        return 2
    return grade(
        repo=args.repo.resolve(),
        tests=args.tests.resolve(),
        repeats=args.repeats,
        json_path=args.json_out.resolve(),
        report_path=args.report.resolve(),
    )


if __name__ == "__main__":
    raise SystemExit(main())
