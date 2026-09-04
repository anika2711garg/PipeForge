"""Shared dataclasses used across CLI, ingest, and the dashboard."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class RunSummary:
    """Concise outcome of a single pipeline invocation."""

    run_id: str
    files_discovered: int = 0
    files_processed: int = 0
    files_skipped: int = 0
    records_accepted: int = 0
    records_duplicated: int = 0
    records_quarantined: int = 0
    status: str = "completed"
    error: str | None = None
    duration_ms: int | None = None


@dataclass
class ParsedEvent:
    """Normalized event ready for warehouse insertion."""

    event_id: str
    user_id: str
    event_type: str
    amount_minor_units: int | None
    currency: str | None
    occurred_at_utc: str
    metric_date: str
    source: str
    raw: dict = field(default_factory=dict)


class IngestInjectionError(RuntimeError):
    """Raised only by test-only failure injectors. Not a production error."""


class FailureInjector:
    """Deterministic hooks used by crash-recovery tests.

    Production CLI and dashboard never construct this object.
    """

    def __init__(
        self,
        fail_after_records: int | None = None,
        fail_before_commit: bool = False,
        fail_after_write_before_checkpoint: bool = False,
    ) -> None:
        self.fail_after_records = fail_after_records
        self.fail_before_commit = fail_before_commit
        self.fail_after_write_before_checkpoint = fail_after_write_before_checkpoint
        self._seen = 0

    def notify_record_written(self) -> None:
        self._seen += 1
        if (
            self.fail_after_records is not None
            and self._seen >= self.fail_after_records
        ):
            raise IngestInjectionError(
                f"injected failure after {self._seen} records"
            )

    def notify_before_commit(self) -> None:
        if self.fail_before_commit:
            raise IngestInjectionError("injected failure before commit")

    def notify_after_write_before_checkpoint(self) -> None:
        if self.fail_after_write_before_checkpoint:
            raise IngestInjectionError(
                "injected failure after write before checkpoint"
            )
