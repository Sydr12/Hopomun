"""육성할 제자 후보 생성."""
from __future__ import annotations

import random
from typing import List, Optional, Sequence, Tuple

from ..data.constants import (
    AGE_MAX, AGE_MIN, ALL_STATS, FAMILY_NAMES, FEMALE_GIVEN_NAMES, GENDERS,
    GROWTH_TIER_WEIGHTS, GROWTH_TIERS, MALE_GIVEN_NAMES, ORIGINS, WEAPONS,
)
from ..models.character import Character


def _weighted(options: Sequence[Tuple[str, int]], rng: random.Random) -> str:
    values, weights = zip(*options)
    return rng.choices(values, weights=weights, k=1)[0]


def generate_candidate(rng: Optional[random.Random] = None) -> Character:
    rng = rng or random.Random()
    gender = rng.choice(GENDERS)
    given = MALE_GIVEN_NAMES if gender == "남성" else FEMALE_GIVEN_NAMES
    ages = list(range(AGE_MIN, AGE_MAX + 1))
    age = rng.choices(ages, weights=[AGE_MAX - a + 3 for a in ages], k=1)[0]
    return Character(
        name=_weighted(FAMILY_NAMES, rng) + _weighted(given, rng),
        age=age,
        gender=gender,
        weapon=rng.choice(WEAPONS),
        stats={key: rng.randint(30, 80) for key in ALL_STATS},
        growth_tier=rng.choices(GROWTH_TIERS, weights=GROWTH_TIER_WEIGHTS, k=1)[0],
        origin=rng.choice(ORIGINS),
    )


def generate_candidates(count: int = 3, rng: Optional[random.Random] = None) -> List[Character]:
    rng = rng or random.Random()
    return [generate_candidate(rng) for _ in range(count)]
