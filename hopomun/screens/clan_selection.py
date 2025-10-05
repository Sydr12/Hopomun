"""문파 선택 단계."""
from __future__ import annotations

from ..data.constants import EMBLEM_MARKS
from ..models.clan import Clan


class ClanSelectionScreen:
    """CLI에서 문파를 생성한다."""

    def prompt_for_clan(self) -> Clan:
        name = input("문파 이름을 입력하세요: ").strip() or "호포문"
        print("\n가문의 문양을 선택하세요:")
        for idx, mark in enumerate(EMBLEM_MARKS, start=1):
            print(f"  {idx}. {mark['id']}")
        choice = self._ask_for_choice(len(EMBLEM_MARKS))
        mark = EMBLEM_MARKS[choice - 1]
        print(f"\n{name} 문파가 {mark['id']} 문양을 선택했습니다!\n")
        return Clan(name=name, emblem_id=mark['id'], emblem_path=mark['image'])

    @staticmethod
    def _ask_for_choice(max_index: int) -> int:
        while True:
            raw = input("문양 번호를 입력하세요: ").strip()
            if raw.isdigit():
                value = int(raw)
                if 1 <= value <= max_index:
                    return value
            print("올바른 번호를 선택해주세요.")
