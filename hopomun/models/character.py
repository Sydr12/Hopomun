"""문파 인물을 표현하는 자료구조."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict


@dataclass
class Character:
    """문파에 소속되거나 영입 가능한 인물을 나타낸다."""

    name: str
    age: int
    gender: str
    weapon: str
    physical_stats: Dict[str, int] = field(default_factory=dict)
    internal_stats: Dict[str, int] = field(default_factory=dict)
    growth_tier: str = "C"

    def describe(self) -> str:
        """CLI 및 GUI에서 사용할 요약 문자열을 반환한다."""
        physical = ", ".join(
            f"{key}: {value}"
            for key, value in self.physical_stats.items()
        )
        internal = ", ".join(
            f"{key}: {value}"
            for key, value in self.internal_stats.items()
        )
        return (
            f"{self.name} ({self.gender}, {self.age}세)\n"
            f"  무기: {self.weapon} | 성장 등급: {self.growth_tier}\n"
            f"  외공: {physical}\n"
            f"  내공: {internal}"
        )
