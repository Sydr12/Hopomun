"""`python -m gangho` 로 GUI를 실행한다. `--cli` 를 주면 텍스트 모드."""
import sys


def main() -> None:
    if "--cli" in sys.argv[1:]:
        from .cli import main as cli_main

        cli_main()
    else:
        from .gui.app import run

        run()


if __name__ == "__main__":
    main()
