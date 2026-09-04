"""Runtime configuration for the PipeForge warehouse and incoming directories."""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Filesystem locations used by the pipeline, CLI, and dashboard."""

    model_config = SettingsConfigDict(env_prefix="PIPEFORGE_", extra="ignore")

    incoming_dir: Path = Field(default=REPO_ROOT / "data" / "incoming")
    quarantine_dir: Path = Field(default=REPO_ROOT / "data" / "quarantine")
    db_path: Path = Field(default=REPO_ROOT / "data" / "warehouse.db")

    def ensure_directories(self) -> None:
        """Create incoming, quarantine, and warehouse parent directories."""
        self.incoming_dir.mkdir(parents=True, exist_ok=True)
        self.quarantine_dir.mkdir(parents=True, exist_ok=True)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
