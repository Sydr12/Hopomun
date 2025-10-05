"""CLI용 시작 화면."""
from __future__ import annotations


class StartScreen:
    """텍스트 버전의 시작 화면."""

    def show(self) -> None:
        print("=" * 60)
        print("              호포문: 강호의 연대기              ")
        print("=" * 60)
        input("엔터 키를 눌러 문파의 여정을 시작하세요...")
