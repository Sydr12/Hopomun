"""육성(수련) 모드에서 사용하는 데이터 정의."""

from typing import Dict, List

# 육성 기간: 3년 × 12개월
TOTAL_TURNS = 36
MONTHS_PER_YEAR = 12

MAX_STAT = 999
MAX_STAMINA = 100

# 기력이 이 값보다 낮으면 수련 실패 확률이 생긴다.
FAILURE_THRESHOLD = 50

# 심경(컨디션) 단계와 수련 효율 배율
MOODS = ["최악", "나쁨", "보통", "좋음", "최상"]
MOOD_MULTIPLIERS = [0.8, 0.9, 1.0, 1.1, 1.2]
DEFAULT_MOOD = 2

GROWTH_MULTIPLIERS = {"S": 1.3, "A": 1.2, "B": 1.1, "C": 1.0, "D": 0.9}

# 숙련도: 같은 수련을 USES_PER_LEVEL 번 할 때마다 1단계 상승
MAX_TRAINING_LEVEL = 5
USES_PER_LEVEL = 4

# 수련 종목: 우마무스메의 5가지 트레이닝에 대응
TRAININGS: List[Dict] = [
    {
        "id": "oegong",
        "name": "외공 단련",
        "desc": "바위를 치고 쇠를 들어 근골을 단련한다.",
        "gains": {"위력": 24, "혈맥": 12},
        "stamina": -20,
        "insight": 4,
    },
    {
        "id": "gyeonggong",
        "name": "경공 수련",
        "desc": "대나무 숲을 누비며 몸을 가볍게 한다.",
        "gains": {"신속": 24, "회피": 12},
        "stamina": -20,
        "insight": 4,
    },
    {
        "id": "jeomhyeol",
        "name": "점혈 수련",
        "desc": "목인장의 혈도를 짚으며 급소를 익힌다.",
        "gains": {"급소": 22, "집중": 10, "신속": 5},
        "stamina": -18,
        "insight": 5,
    },
    {
        "id": "ungi",
        "name": "운기조식",
        "desc": "단전의 기운을 돌려 내공을 쌓는다.",
        "gains": {"심체": 22, "불굴": 14},
        "stamina": -16,
        "insight": 6,
    },
    {
        "id": "chamseon",
        "name": "참선",
        "desc": "폭포 아래 가부좌를 틀고 마음을 비운다.",
        "gains": {"집중": 18, "불굴": 8, "심체": 5},
        "stamina": 5,
        "insight": 10,
    },
]

REST_STAMINA = 50
OUTING_STAMINA = 15
SPAR_STAMINA = -25

# 무공: 깨달음(스킬 포인트)으로 습득
MARTIAL_ARTS: List[Dict] = [
    {"id": "geumgang", "name": "금강불괴", "cost": 60, "desc": "받는 피해 15% 감소", "effects": {"def_mult": 0.15}},
    {"id": "ihyeong", "name": "이형환위", "cost": 50, "desc": "회피율 +8%", "effects": {"dodge": 0.08}},
    {"id": "ilyang", "name": "일양지", "cost": 50, "desc": "치명타율 +8%", "effects": {"crit": 0.08}},
    {"id": "cheongeun", "name": "천근추", "cost": 45, "desc": "공격력 +10%", "effects": {"atk_mult": 0.10}},
    {"id": "gunyang", "name": "구양신공", "cost": 90, "desc": "생명력 +20%, 매 행동마다 회복", "effects": {"hp_mult": 0.20, "regen": 0.02}},
    {"id": "neungpa", "name": "능파미보", "cost": 55, "desc": "속도 +15%", "effects": {"speed_mult": 0.15}},
    {"id": "dokgo", "name": "독고구검", "cost": 80, "weapon": "검", "desc": "[검] 공격력 +18%, 치명타율 +5%", "effects": {"atk_mult": 0.18, "crit": 0.05}},
    {"id": "yangga", "name": "양가창법", "cost": 80, "weapon": "장창", "desc": "[장창] 공격력 +18%, 받는 피해 5% 감소", "effects": {"atk_mult": 0.18, "def_mult": 0.05}},
    {"id": "hangryong", "name": "항룡십팔장", "cost": 80, "weapon": "권갑", "desc": "[권갑] 공격력 +22%", "effects": {"atk_mult": 0.22}},
    {"id": "mancheon", "name": "만천화우", "cost": 80, "weapon": "암기", "desc": "[암기] 치명타율 +12%, 속도 +5%", "effects": {"crit": 0.12, "speed_mult": 0.05}},
    {"id": "seonpung", "name": "선풍선법", "cost": 80, "weapon": "부채", "desc": "[부채] 회피율 +8%, 공격력 +8%", "effects": {"dodge": 0.08, "atk_mult": 0.08}},
]

# 정해진 턴에 열리는 목표 대회 (우마무스메의 목표 레이스, 프린세스 메이커의 수확제)
TOURNAMENTS: List[Dict] = [
    {"turn": 12, "name": "문파 비무대회", "rounds": 3, "base_power": 78, "step": 9, "fame": 20, "insight": 30},
    {"turn": 24, "name": "성도 무림대회", "rounds": 4, "base_power": 154, "step": 12, "fame": 40, "insight": 45},
    {"turn": 36, "name": "천하제일 비무대회", "rounds": 5, "base_power": 226, "step": 16, "fame": 80, "insight": 0},
]

OPPONENT_TITLES = [
    "화산파 매화검수", "소림사 무승", "무당파 도사", "개방 장로", "당문 암기고수",
    "남궁세가 검객", "모용세가 공자", "점창파 쾌검수", "청성파 제자", "공동파 권사",
    "하북팽가 도객", "흑풍채 채주", "혈교 호법", "천마신교 사자", "무명 낭인",
]

# 가장 높은 능력치에 따른 별호
STAT_EPITHETS = {
    "위력": "패도(覇道)의 무인",
    "신속": "질풍(疾風)의 협객",
    "급소": "암영(暗影)의 살수",
    "혈맥": "철혈(鐵血)의 투사",
    "불굴": "불괴(不壞)의 수호자",
    "심체": "내가(內家)의 고수",
    "회피": "환영(幻影)의 보법가",
    "집중": "명경지수(明鏡止水)의 달인",
}

# (최소 점수, 등급)
RANKS = [
    (5200, "SS"),
    (4400, "S"),
    (3700, "A+"),
    (3100, "A"),
    (2500, "B"),
    (1900, "C"),
    (1400, "D"),
    (0, "E"),
]

# 무작위 사건. 각 선택지의 effects 키:
#   stats, stamina, mood, insight, fame, injury_chance, random_art, duel({"power_scale", "win", "lose"})
EVENT_CHANCE = 0.35

EVENTS: List[Dict] = [
    {
        "id": "senior_spar",
        "title": "사형의 대련 제안",
        "text": "사형이 목검을 던지며 한 수 겨뤄보자고 한다.",
        "choices": [
            {"label": "전력으로 맞선다", "result": "온 힘을 다해 부딪쳤다. 팔이 저리지만 힘이 붙었다.",
             "effects": {"stats": {"위력": 15, "혈맥": 5}, "stamina": -10}},
            {"label": "가볍게 받아준다", "result": "사형의 검로를 피하며 발놀림을 익혔다.",
             "effects": {"stats": {"신속": 10, "회피": 6}, "mood": 1}},
        ],
    },
    {
        "id": "old_master",
        "title": "떠돌이 노고수",
        "text": "허름한 노인이 객잔 구석에서 당신을 유심히 바라본다. \"자네, 근골이 제법이군.\"",
        "choices": [
            {"label": "가르침을 청한다", "result": "노인은 웃으며 손가락으로 허공에 초식을 그려 보였다.",
             "effects": {"insight": 25, "stats": {"집중": 10}}},
            {"label": "술 한 잔을 대접한다", "result": "노인은 호탕하게 웃으며 강호의 옛이야기를 들려주었다.",
             "effects": {"mood": 2, "fame": 3}},
        ],
    },
    {
        "id": "qi_deviation",
        "title": "주화입마의 징조",
        "text": "운기 도중 기혈이 역류하는 느낌이 든다. 가슴이 답답하다.",
        "min_turn": 4,
        "choices": [
            {"label": "억지로 기운을 누른다", "result": "고통 끝에 기운을 다스렸다. 내공이 한층 단단해졌다.",
             "effects": {"stats": {"불굴": 12, "심체": 10}, "stamina": -25, "injury_chance": 0.3}},
            {"label": "즉시 수련을 멈춘다", "result": "무리하지 않고 호흡을 가다듬었다.",
             "effects": {"stamina": 10, "stats": {"심체": -5}}},
        ],
    },
    {
        "id": "inn_rumor",
        "title": "객잔의 소문",
        "text": "객잔에서 당신 문파의 이름이 오르내린다. 누군가는 칭찬하고, 누군가는 비웃는다.",
        "choices": [
            {"label": "귀를 기울인다", "result": "좋은 평판에 어깨가 으쓱해졌다.", "effects": {"mood": 1}},
            {"label": "비웃은 자를 찾아간다", "result": "거친 말다툼 끝에 주먹이 오갔다.",
             "effects": {"stats": {"위력": 8}, "fame": 4, "mood": -1}},
        ],
    },
    {
        "id": "bandits",
        "title": "산적 출몰",
        "text": "마을 어귀에 산적 떼가 나타나 행인들을 위협하고 있다.",
        "min_turn": 3,
        "choices": [
            {"label": "협의를 위해 나선다", "result": "산적들과 맞붙었다!",
             "effects": {"duel": {"power_scale": 0.8,
                                  "win": {"fame": 12, "stats": {"위력": 10, "신속": 8}, "mood": 1},
                                  "lose": {"stamina": -20, "injury_chance": 0.5}}}},
            {"label": "관병에게 알린다", "result": "관병이 출동했지만 마음 한켠이 찜찜하다.",
             "effects": {"mood": -1, "stats": {"집중": 5}}},
        ],
    },
    {
        "id": "hidden_cave",
        "title": "절벽 아래의 동굴",
        "text": "약초를 캐다 발을 헛디뎌 절벽 아래로 떨어졌다. 정신을 차리니 이끼 낀 석벽에 글귀가 새겨져 있다.",
        "min_turn": 6,
        "weight": 0.5,
        "choices": [
            {"label": "석벽의 글귀를 해독한다", "result": "기연(奇緣)! 잊혀진 무공을 깨우쳤다.",
             "effects": {"random_art": True, "stamina": -20}},
            {"label": "서둘러 빠져나간다", "result": "동굴 속 영약 한 알을 챙겨 나왔다.",
             "effects": {"stats": {"심체": 18, "혈맥": 10}, "stamina": 20}},
        ],
    },
    {
        "id": "dream",
        "title": "꿈속의 깨달음",
        "text": "꿈속에서 흰 옷의 검객이 달빛 아래 검무를 춘다.",
        "choices": [
            {"label": "검로를 되새긴다", "result": "눈을 뜨자 머릿속이 맑다.",
             "effects": {"insight": 20, "stats": {"집중": 6}}},
            {"label": "푹 잔다", "result": "개운하게 일어났다.", "effects": {"stamina": 25}},
        ],
    },
    {
        "id": "master_scold",
        "title": "사부의 호통",
        "text": "\"자세가 흐트러졌다! 기본부터 다시!\" 사부의 불호령이 떨어졌다.",
        "choices": [
            {"label": "묵묵히 기본기를 반복한다", "result": "지겹지만 몸이 기억하기 시작했다.",
             "effects": {"stats": {"위력": 5, "신속": 5, "급소": 5, "불굴": 5}, "mood": -1}},
            {"label": "변명한다", "result": "사부는 한숨을 쉬고 돌아섰다.", "effects": {"mood": -1, "stamina": 10}},
        ],
    },
    {
        "id": "festival",
        "title": "마을 명절 잔치",
        "text": "마을에 등불이 걸리고 떡과 술이 넘쳐난다.",
        "choices": [
            {"label": "잔치를 즐긴다", "result": "배불리 먹고 웃고 떠들었다.", "effects": {"stamina": 25, "mood": 1}},
            {"label": "홀로 수련한다", "result": "모두가 쉬는 날에도 검을 놓지 않았다.",
             "effects": {"stats": {"불굴": 10, "집중": 6}, "mood": -1}},
        ],
    },
    {
        "id": "rainy_day",
        "title": "장맛비",
        "text": "며칠째 장대비가 쏟아진다. 연무장이 진흙탕이 되었다.",
        "choices": [
            {"label": "빗속에서 수련한다", "result": "빗방울을 베며 쾌검을 익혔다.",
             "effects": {"stats": {"신속": 8, "급소": 8}, "stamina": -15, "injury_chance": 0.15}},
            {"label": "처마 밑에서 운기한다", "result": "빗소리를 들으며 기운을 가다듬었다.",
             "effects": {"stats": {"심체": 8}, "stamina": 10}},
        ],
    },
    {
        "id": "black_challenger",
        "title": "흑도 무인의 도발",
        "text": "얼굴에 칼자국이 난 사내가 문파 앞에서 소리친다. \"이 문파엔 겁쟁이뿐인가!\"",
        "min_turn": 5,
        "choices": [
            {"label": "도전을 받아들인다", "result": "사내와 맞섰다!",
             "effects": {"duel": {"power_scale": 1.0,
                                  "win": {"fame": 15, "insight": 20, "mood": 1},
                                  "lose": {"mood": -2, "stamina": -15}}}},
            {"label": "상대하지 않는다", "result": "사내는 코웃음 치며 떠났다.", "effects": {"mood": -1}},
        ],
    },
    {
        "id": "herbs",
        "title": "산삼 발견",
        "text": "뒷산에서 백 년 묵은 산삼을 발견했다!",
        "weight": 0.6,
        "choices": [
            {"label": "직접 먹는다", "result": "뜨거운 기운이 전신을 휘돈다.",
             "effects": {"stats": {"심체": 15, "혈맥": 15}, "stamina": 30}},
            {"label": "사부께 바친다", "result": "사부가 크게 기뻐하며 비전의 요결을 알려주었다.",
             "effects": {"insight": 35, "mood": 1}},
        ],
    },
    {
        "id": "rival",
        "title": "라이벌의 등장",
        "text": "같은 해에 입문한 타 문파의 제자가 당신을 찾아와 말한다. \"다음 대회에서 보자.\"",
        "min_turn": 8,
        "choices": [
            {"label": "\"기다리겠다.\"", "result": "투지가 불타오른다!", "effects": {"mood": 2}},
            {"label": "상대의 수련법을 엿본다", "result": "상대의 약점을 알아냈다.",
             "effects": {"stats": {"집중": 12, "회피": 6}}},
        ],
    },
    {
        "id": "injured_traveler",
        "title": "쓰러진 나그네",
        "text": "길가에 피를 흘리며 쓰러진 나그네가 있다.",
        "choices": [
            {"label": "진기를 나누어 치료한다", "result": "나그네는 깨어나 고마움의 표시로 비급 한 장을 건넸다.",
             "effects": {"stamina": -20, "insight": 30, "fame": 5}},
            {"label": "의원에게 데려다준다", "result": "선행을 베풀었다.", "effects": {"fame": 4, "mood": 1}},
        ],
    },
]
