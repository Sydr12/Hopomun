"""문파 관련 모델."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List

from .character import Character


@dataclass
class Clan:
    """플레이어가 운영하는 문파를 표현한다."""

    name: str
    emblem_id: str
    emblem_path: str
    members: List[Character] = field(default_factory=list)

    def add_member(self, character: Character) -> None:
        """문파원으로 새 인물을 추가한다."""
        self.members.append(character)

    def describe(self) -> str:
        """문파 현황을 간략히 반환한다."""
        member_names = ", ".join(member.name for member in self.members) or "없음"
        return (
            f"문파명: {self.name} (문양: {self.emblem_id})\n"
            f"문파원: {member_names}"
        )
