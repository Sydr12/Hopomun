"""GUI entry point for Hopomun."""
from __future__ import annotations

from .gui.app import run as run_gui


def main() -> None:
    """Launch the pygame-based GUI."""
    run_gui()


if __name__ == "__main__":
    main()
