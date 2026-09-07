"""Public CLI must stay callable and report documented summary fields."""

from __future__ import annotations

from pipeline.cli import main
from pipeline.config import Settings
from pipeline.warehouse import Warehouse

from helpers import event, write_jsonl


def test_cli_run_and_status_print_documented_fields(
    settings: Settings,
    monkeypatch,
    capsys,
) -> None:
    monkeypatch.setenv("PIPEFORGE_INCOMING_DIR", str(settings.incoming_dir))
    monkeypatch.setenv("PIPEFORGE_QUARANTINE_DIR", str(settings.quarantine_dir))
    monkeypatch.setenv("PIPEFORGE_DB_PATH", str(settings.db_path))

    write_jsonl(
        settings.incoming_dir / "cli_batch.jsonl",
        [event("evt_cli_1", amount="1.00"), event("evt_cli_2", amount="2.00")],
    )

    assert main(["run"]) == 0
    run_out = capsys.readouterr().out
    for field in (
        "Run ID:",
        "Files discovered:",
        "Files processed:",
        "Records accepted:",
        "Records quarantined:",
        "Status:",
    ):
        assert field in run_out
    assert "completed" in run_out.lower()

    with Warehouse(settings) as warehouse:
        assert warehouse.event_count() == 2

    assert main(["status"]) == 0
    status_out = capsys.readouterr().out
    assert "Total warehouse events:" in status_out
    assert "Quarantined records:" in status_out
    assert "2" in status_out
