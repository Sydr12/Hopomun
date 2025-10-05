"""CLI 영입 화면."""
from __future__ import annotations

from ..data.constants import WEAPON_STRENGTHS
from ..models.clan import Clan
from ..systems.recruitment import generate_candidates


class RecruitmentScreen:
    """텍스트 기반 영입 흐름."""

    def recruit_member(self, clan: Clan) -> None:
        candidates = generate_candidates()
        print("\n새로운 무림인들이 문파에 합류를 청합니다:")
        for idx, candidate in enumerate(candidates, start=1):
            advantage = WEAPON_STRENGTHS.get(candidate.weapon)
            print("-" * 60)
            print(f"선택지 {idx}")
            print(candidate.describe())
            if advantage:
                print(f"  상성 우위: {candidate.weapon} ▶ {advantage} (치명/회피 +30%)")
        print("-" * 60)
        choice = self._ask_for_choice(len(candidates))
        recruit = candidates[choice - 1]
        clan.add_member(recruit)
        print(f"\n{recruit.name}이(가) {clan.name} 문파에 충성을 맹세했습니다!\n")

    @staticmethod
    def _ask_for_choice(max_index: int) -> int:
        while True:
            raw = input("영입할 대상을 선택하세요 (1-3): ").strip()
            if raw.isdigit():
                value = int(raw)
                if 1 <= value <= max_index:
                    return value
            print("올바른 번호를 입력해주세요.")
