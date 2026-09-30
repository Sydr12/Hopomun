"""비무(1:1 대련) 전투 시뮬레이션."""
from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Sequence

from ..data.constants import INTERNAL_STATS, PHYSICAL_STATS, WEAPON_STRENGTHS, WEAPONS
from ..data.training_data import MARTIAL_ARTS, OPPONENT_TITLES

ARTS_BY_ID = {art["id"]: art for art in MARTIAL_ARTS}

MAX_ACTIONS = 80
GAUGE_FULL = 1000


@dataclass
class Fighter:
    """전투용으로 환산된 능력치."""

    name: str
    weapon: str
    stats: Dict[str, int]
    arts: Sequence[str] = ()
    hp: float = 0.0
    max_hp: float = 0.0
    attack: float = 0.0
    defense: float = 0.0
    speed: float = 0.0
    crit: float = 0.0
    crit_damage: float = 0.0
    dodge: float = 0.0
    accuracy: float = 0.0
    regen: float = 0.0
    gauge: float = 0.0

    def __post_init__(self) -> None:
        mods = art_modifiers(self.arts, self.weapon)
        s = self.stats
        self.max_hp = (200 + s.get("혈맥", 0) * 3 + s.get("심체", 0) * 2) * (1 + mods["hp_mult"])
        self.hp = self.max_hp
        self.attack = (20 + s.get("위력", 0) * 0.5 + s.get("심체", 0) * 0.2) * (1 + mods["atk_mult"])
        self.defense = s.get("불굴", 0) * 0.35
        self.damage_taken = 1 - mods["def_mult"]
        self.speed = (50 + s.get("신속", 0)) * (1 + mods["speed_mult"])
        self.crit = min(0.6, 0.05 + s.get("급소", 0) / 1000 + mods["crit"])
        self.crit_damage = 1.6 + s.get("집중", 0) / 1000
        self.dodge = min(0.45, 0.03 + s.get("회피", 0) / 1200 + mods["dodge"])
        self.accuracy = s.get("집중", 0) / 2500
        self.regen = mods["regen"]

    @property
    def alive(self) -> bool:
        return self.hp > 0


@dataclass
class DuelResult:
    won: bool
    log: List[str] = field(default_factory=list)
    hp_ratio: float = 0.0


def art_modifiers(arts: Sequence[str], weapon: str) -> Dict[str, float]:
    """습득한 무공의 효과를 합산한다. 무기 전용 무공은 무기가 맞을 때만 적용된다."""
    total = {"atk_mult": 0.0, "def_mult": 0.0, "crit": 0.0, "dodge": 0.0, "hp_mult": 0.0, "speed_mult": 0.0, "regen": 0.0}
    for art_id in arts:
        art = ARTS_BY_ID.get(art_id)
        if not art:
            continue
        if art.get("weapon") and art["weapon"] != weapon:
            continue
        for key, value in art["effects"].items():
            total[key] += value
    return total


def _strike(attacker: Fighter, defender: Fighter, rng: random.Random, log: List[str]) -> None:
    advantage = WEAPON_STRENGTHS.get(attacker.weapon) == defender.weapon
    defender_advantage = WEAPON_STRENGTHS.get(defender.weapon) == attacker.weapon

    dodge = defender.dodge * (1.3 if defender_advantage else 1.0) - attacker.accuracy
    if rng.random() < max(0.0, dodge):
        log.append(f"{defender.name}이(가) {attacker.name}의 초식을 흘려냈다.")
        return

    damage = attacker.attack * rng.uniform(0.85, 1.15)
    damage *= 100 / (100 + defender.defense)
    damage *= defender.damage_taken
    crit_rate = attacker.crit * (1.3 if advantage else 1.0)
    if rng.random() < crit_rate:
        damage *= attacker.crit_damage
        log.append(f"{attacker.name}의 일격이 급소를 꿰뚫었다! ({int(damage)})")
    else:
        log.append(f"{attacker.name}의 공격이 적중했다. ({int(damage)})")
    defender.hp -= damage


def simulate_duel(player: Fighter, opponent: Fighter, rng: Optional[random.Random] = None) -> DuelResult:
    """속도 게이지 방식으로 번갈아 공격하며 승패를 가린다."""
    rng = rng or random.Random()
    log: List[str] = [f"{player.name}({player.weapon}) 대 {opponent.name}({opponent.weapon})"]
    actions = 0
    while player.alive and opponent.alive and actions < MAX_ACTIONS:
        player.gauge += player.speed
        opponent.gauge += opponent.speed
        for actor, target in sorted(
            ((player, opponent), (opponent, player)), key=lambda pair: -pair[0].gauge
        ):
            if actor.gauge >= GAUGE_FULL and actor.alive and target.alive:
                actor.gauge -= GAUGE_FULL
                actions += 1
                _strike(actor, target, rng, log)
                if actor.regen and actor.alive:
                    actor.hp = min(actor.max_hp, actor.hp + actor.max_hp * actor.regen)

    if player.alive and opponent.alive:
        won = player.hp / player.max_hp >= opponent.hp / opponent.max_hp
        log.append("승부가 나지 않아 남은 기세로 판정한다.")
    else:
        won = player.alive
    log.append(f"{player.name} 승리!" if won else f"{opponent.name} 승리...")
    return DuelResult(won=won, log=log, hp_ratio=max(0.0, player.hp / player.max_hp))


def generate_opponent(power: int, rng: Optional[random.Random] = None, art_count: int = 0) -> Fighter:
    """주어진 평균 능력치 수준의 상대를 만든다."""
    rng = rng or random.Random()
    stats = {key: max(1, int(power * rng.uniform(0.75, 1.25))) for key in PHYSICAL_STATS + INTERNAL_STATS}
    weapon = rng.choice(WEAPONS)
    candidates = [a["id"] for a in MARTIAL_ARTS if a.get("weapon") in (None, weapon)]
    arts = rng.sample(candidates, k=min(art_count, len(candidates)))
    return Fighter(name=rng.choice(OPPONENT_TITLES), weapon=weapon, stats=stats, arts=arts)
