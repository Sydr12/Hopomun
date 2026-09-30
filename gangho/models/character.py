"""육성 대상 인물."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List

from ..data.constants import ALL_STATS


@dataclass
class Character:
    name: str
    age: int
    gender: str
    weapon: str
    stats: Dict[str, int] = field(default_factory=dict)
    growth_tier: str = "C"
    origin: str = ""
    arts: List[str] = field(default_factory=list)
    title: str = ""
    fame: int = 0

    def describe(self) -> str:
        header = f"[{self.title}] " if self.title else ""
        stats = ", ".join(f"{key} {self.stats.get(key, 0)}" for key in ALL_STATS)
        origin = f" · {self.origin}" if self.origin else ""
        return (
            f"{header}{self.name} ({self.gender}, {self.age}세{origin})\n"
            f"  무기: {self.weapon} | 성장 등급: {self.growth_tier}\n"
            f"  {stats}"
        )
