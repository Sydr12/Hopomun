"""게임에서 공유하는 상수 정의."""

from typing import Dict, List, Tuple

EMBLEM_MARKS: List[Dict[str, str]] = [
    {"id": "mark_001", "image": "images/mark/mark_001.png"},
    {"id": "mark_002", "image": "images/mark/mark_002.png"},
    {"id": "mark_003", "image": "images/mark/mark_003.png"},
    {"id": "mark_004", "image": "images/mark/mark_004.png"},
    {"id": "mark_005", "image": "images/mark/mark_005.png"},
    {"id": "mark_006", "image": "images/mark/mark_006.png"},
]

ACTION_ICONS: List[Dict[str, Tuple[int, int, int]]] = [
    {"id": "battle", "label": "전투", "color": (200, 90, 90)},
    {"id": "training", "label": "수련", "color": (80, 150, 220)},
    {"id": "administration", "label": "내정", "color": (140, 120, 220)},
    {"id": "recruitment", "label": "등용문", "color": (90, 180, 120)},
    {"id": "exit", "label": "종료", "color": (120, 120, 120)},
]

DEFAULT_PROFILE_IMAGE = "images/profile/default_master.png"

# (성, 가중치)
FAMILY_NAME_WEIGHTS = [
    ("강", 6),
    ("남궁", 2),
    ("독고", 1),
    ("마", 2),
    ("박", 5),
    ("백", 3),
    ("서", 4),
    ("소", 2),
    ("신", 3),
    ("연", 2),
    ("오", 3),
    ("우", 2),
    ("이", 10),
    ("임", 3),
    ("장", 6),
    ("정", 5),
    ("진", 4),
    ("최", 6),
    ("한", 3),
    ("황", 2),
]

# (이름, 가중치)
MALE_GIVEN_NAME_WEIGHTS = [
    ("강호", 6),
    ("건우", 4),
    ("광현", 3),
    ("도윤", 5),
    ("무현", 2),
    ("서준", 5),
    ("선우", 4),
    ("승혁", 3),
    ("시윤", 3),
    ("연호", 4),
    ("의현", 3),
    ("재현", 4),
    ("태강", 2),
    ("현도", 3),
    ("현우", 6),
    ("혁진", 3),
    ("하준", 5),
    ("하진", 2),
]

FEMALE_GIVEN_NAME_WEIGHTS = [
    ("가온", 3),
    ("다연", 4),
    ("라온", 2),
    ("민서", 5),
    ("사랑", 2),
    ("서린", 4),
    ("서연", 5),
    ("소연", 4),
    ("수연", 3),
    ("시연", 3),
    ("아린", 4),
    ("연우", 5),
    ("예린", 3),
    ("유나", 4),
    ("은서", 5),
    ("지화", 2),
    ("채옥", 2),
    ("하린", 3),
]

GENDERS = ["남성", "여성"]
GENDER_WEIGHTS = {
    "남성": 3,
    "여성": 1,
}

WEAPONS = [
    "검",
    "장창",
    "권갑",
    "암기",
    "부채",
]

GROWTH_TIERS = ["S", "A", "B", "C", "D"]

# 무기 상성: 키가 상성 우위를 가지는 상대 무기
WEAPON_STRENGTHS = {
    "검": "권갑",
    "권갑": "장창",
    "장창": "검",
    "암기": "부채",
    "부채": "암기",
}

PHYSICAL_STATS = ["위력", "신속", "급소", "혈맥"]
INTERNAL_STATS = ["불굴", "심체", "회피", "집중"]

AGE_MIN = 15
AGE_MAX = 90

