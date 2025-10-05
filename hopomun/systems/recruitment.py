"""영입 시스템 로직."""
from __future__ import annotations

import random
from typing import Iterable, List, Sequence, Tuple

from ..data.constants import (
    AGE_MAX,
    AGE_MIN,
    FAMILY_NAME_WEIGHTS,
    FEMALE_GIVEN_NAME_WEIGHTS,
    GENDER_WEIGHTS,
    GENDERS,
    GROWTH_TIERS,
    INTERNAL_STATS,
    MALE_GIVEN_NAME_WEIGHTS,
    PHYSICAL_STATS,
    WEAPON_STRENGTHS,
    WEAPONS,
)
from ..models.character import Character

WeightedOptions = Sequence[Tuple[str, int]]


def _weighted_choice(options: WeightedOptions) -> str:
    """가중치를 고려해 하나의 값을 선택한다."""
    values, weights = zip(*options)
    return random.choices(values, weights=weights, k=1)[0]


def _generate_name(gender: str) -> str:
    """성별에 맞는 이름을 성과 이름으로 조합한다."""
    family = _weighted_choice(FAMILY_NAME_WEIGHTS)
    if gender == "남성":
        given_pool: Iterable[Tuple[str, int]] = MALE_GIVEN_NAME_WEIGHTS
    else:
        given_pool = FEMALE_GIVEN_NAME_WEIGHTS
    given = _weighted_choice(tuple(given_pool))
    return family + given


def _roll_stats(stat_keys: List[str]) -> dict:
    """각 능력치에 30~80 사이의 값을 부여한다."""
    return {key: random.randint(30, 80) for key in stat_keys}


def _generate_age() -> int:
    """젊은 연령대에 높은 가중치를 적용하여 나이를 생성한다."""
    ages = list(range(AGE_MIN, AGE_MAX + 1))
    weights = [max(1, AGE_MAX - age + 5) for age in ages]
    return random.choices(ages, weights=weights, k=1)[0]


def _generate_gender() -> str:
    """남성이 여성보다 세 배 더 자주 등장하도록 성별을 선택한다."""
    weights = [GENDER_WEIGHTS.get(gender, 1) for gender in GENDERS]
    return random.choices(GENDERS, weights=weights, k=1)[0]


def generate_candidate() -> Character:
    """무작위 영입 후보를 생성한다."""
    gender = _generate_gender()
    name = _generate_name(gender)
    weapon = random.choice(WEAPONS)

    character = Character(
        name=name,
        age=_generate_age(),
        gender=gender,
        weapon=weapon,
        physical_stats=_roll_stats(PHYSICAL_STATS),
        internal_stats=_roll_stats(INTERNAL_STATS),
        growth_tier=random.choice(GROWTH_TIERS),
    )
    return character


def generate_candidates(count: int = 3) -> List[Character]:
    """지정된 수만큼 영입 후보를 반환한다."""
    return [generate_candidate() for _ in range(count)]


def weapon_has_advantage(weapon: str, opponent_weapon: str) -> bool:
    """특정 무기가 상대 무기에 대해 상성 우위를 가지는지 확인한다."""
    return WEAPON_STRENGTHS.get(weapon) == opponent_weapon
