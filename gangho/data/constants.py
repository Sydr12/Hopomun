"""강호육성기 공용 상수."""

from typing import Dict, List, Tuple

PHYSICAL_STATS: List[str] = ["위력", "신속", "급소", "혈맥"]
INTERNAL_STATS: List[str] = ["불굴", "심체", "회피", "집중"]
ALL_STATS: List[str] = PHYSICAL_STATS + INTERNAL_STATS

WEAPONS: List[str] = ["검", "장창", "권갑", "암기", "부채"]

# 키 무기가 값 무기에 상성 우위 (치명/회피 +30%)
WEAPON_STRENGTHS: Dict[str, str] = {
    "검": "권갑",
    "권갑": "장창",
    "장창": "검",
    "암기": "부채",
    "부채": "암기",
}

GROWTH_TIERS: List[str] = ["S", "A", "B", "C", "D"]
GROWTH_TIER_WEIGHTS: List[int] = [1, 3, 6, 6, 4]

GENDERS: List[str] = ["남성", "여성"]

AGE_MIN = 14
AGE_MAX = 40

FAMILY_NAMES: List[Tuple[str, int]] = [
    ("강", 6), ("남궁", 2), ("독고", 1), ("모용", 1), ("백", 3), ("서", 4), ("소", 3),
    ("연", 2), ("우", 2), ("이", 8), ("장", 6), ("제갈", 1), ("진", 4), ("당", 2),
    ("팽", 2), ("한", 3), ("황보", 1), ("설", 2), ("위", 2), ("유", 4),
]

MALE_GIVEN_NAMES: List[Tuple[str, int]] = [
    ("무진", 4), ("천악", 2), ("검휘", 3), ("청운", 4), ("일도", 2), ("호연", 4),
    ("태산", 2), ("운학", 3), ("비류", 3), ("현무", 3), ("진명", 4), ("소룡", 3),
]

FEMALE_GIVEN_NAMES: List[Tuple[str, int]] = [
    ("설화", 4), ("월영", 3), ("소연", 4), ("청아", 3), ("예린", 3), ("비연", 3),
    ("홍련", 2), ("서하", 4), ("연화", 3), ("운비", 2), ("은설", 3), ("매향", 2),
]

ORIGINS: List[str] = [
    "몰락한 무가의 후예", "산골 약초꾼의 자식", "저잣거리의 고아", "표국 표사의 자식",
    "은퇴한 고수의 손자", "대장간 견습생", "절에서 자란 아이", "상단 행수의 막내",
]
