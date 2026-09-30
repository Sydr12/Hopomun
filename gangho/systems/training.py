"""육성(수련) 모드 로직.

정해진 턴 동안 제자 한 명을 수련시키는 우마무스메/프린세스 메이커 방식의 시스템.
UI와 분리되어 있어 CLI, GUI, 테스트에서 동일하게 사용한다.
"""
from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from ..data.constants import ALL_STATS
from ..data.training_data import (
    DEFAULT_MOOD,
    EVENT_CHANCE,
    EVENTS,
    FAILURE_THRESHOLD,
    GROWTH_MULTIPLIERS,
    MARTIAL_ARTS,
    MAX_STAMINA,
    MAX_STAT,
    MAX_TRAINING_LEVEL,
    MONTHS_PER_YEAR,
    MOOD_MULTIPLIERS,
    MOODS,
    OUTING_STAMINA,
    RANKS,
    REST_STAMINA,
    SPAR_STAMINA,
    STAT_EPITHETS,
    TOTAL_TURNS,
    TOURNAMENTS,
    TRAININGS,
    USES_PER_LEVEL,
)
from ..models.character import Character
from .combat import Fighter, generate_opponent, simulate_duel

TRAININGS_BY_ID = {t["id"]: t for t in TRAININGS}
ARTS_BY_ID = {a["id"]: a for a in MARTIAL_ARTS}


@dataclass
class ActionResult:
    """한 턴 행동의 결과."""

    title: str
    messages: List[str] = field(default_factory=list)
    gains: Dict[str, int] = field(default_factory=dict)
    success: bool = True
    duel_log: List[str] = field(default_factory=list)


@dataclass
class TournamentResult:
    name: str
    rounds: int
    rounds_won: int = 0
    logs: List[List[str]] = field(default_factory=list)
    opponents: List[str] = field(default_factory=list)

    @property
    def champion(self) -> bool:
        return self.rounds_won == self.rounds


@dataclass
class Ending:
    title: str
    rank: str
    score: int
    text: str


def expected_power(turn: int) -> int:
    """해당 시점 강호 무인의 평균 능력치 수준 (비무 상대 산정용)."""
    return int(60 + turn * 4.5)


class TrainingSession:
    """한 제자의 육성 기간 전체를 관리한다."""

    def __init__(self, character: Character, rng: Optional[random.Random] = None) -> None:
        self.character = character
        self.rng = rng or random.Random()
        self.turn = 1
        self.stats: Dict[str, int] = {key: character.stats.get(key, 0) for key in ALL_STATS}
        self.stamina = MAX_STAMINA
        self.mood = DEFAULT_MOOD
        self.injured = False
        self.insight = 0
        self.fame = character.fame
        self.arts: List[str] = list(character.arts)
        self.age = character.age
        self.training_uses: Dict[str, int] = {t["id"]: 0 for t in TRAININGS}
        self.tournament_results: List[TournamentResult] = []
        self.pending_event: Optional[Dict] = None
        self.history: List[str] = []
        self.finished = False
        self.ending: Optional[Ending] = None

    # ------------------------------------------------------------------ 조회
    @property
    def year(self) -> int:
        return (self.turn - 1) // MONTHS_PER_YEAR + 1

    @property
    def month(self) -> int:
        return (self.turn - 1) % MONTHS_PER_YEAR + 1

    def date_label(self) -> str:
        return f"{self.year}년차 {self.month}월"

    @property
    def mood_name(self) -> str:
        return MOODS[self.mood]

    @property
    def turns_left(self) -> int:
        return TOTAL_TURNS - self.turn + 1

    def training_level(self, training_id: str) -> int:
        return min(MAX_TRAINING_LEVEL, 1 + self.training_uses[training_id] // USES_PER_LEVEL)

    def current_tournament(self) -> Optional[Dict]:
        """이번 턴이 대회 턴이면 대회 정보를 반환한다."""
        for tournament in TOURNAMENTS:
            if tournament["turn"] == self.turn:
                return tournament
        return None

    def next_tournament(self) -> Optional[Dict]:
        for tournament in TOURNAMENTS:
            if tournament["turn"] >= self.turn:
                return tournament
        return None

    def failure_rate(self) -> float:
        if self.stamina >= FAILURE_THRESHOLD:
            return 0.0
        return min(0.9, (FAILURE_THRESHOLD - self.stamina) * 1.8 / 100)

    def _age_multiplier(self) -> float:
        if self.age < 20:
            return 1.15
        if self.age < 30:
            return 1.05
        if self.age < 45:
            return 1.0
        if self.age < 60:
            return 0.9
        return 0.8

    def gain_multiplier(self, training_id: str) -> float:
        level_bonus = 1 + 0.12 * (self.training_level(training_id) - 1)
        growth = GROWTH_MULTIPLIERS.get(self.character.growth_tier, 1.0)
        injury = 0.5 if self.injured else 1.0
        return level_bonus * MOOD_MULTIPLIERS[self.mood] * growth * self._age_multiplier() * injury

    def preview_training(self, training_id: str) -> Dict[str, int]:
        """무작위 편차를 제외한 예상 상승치."""
        training = TRAININGS_BY_ID[training_id]
        mult = self.gain_multiplier(training_id)
        return {stat: max(1, round(base * mult)) for stat, base in training["gains"].items()}

    def available_arts(self) -> List[Dict]:
        """습득 가능한 무공 (무기 제한 충족, 미습득)."""
        return [
            art for art in MARTIAL_ARTS
            if art["id"] not in self.arts and art.get("weapon") in (None, self.character.weapon)
        ]

    def total_stats(self) -> int:
        return sum(self.stats.values())

    def player_fighter(self) -> Fighter:
        return Fighter(name=self.character.name, weapon=self.character.weapon, stats=dict(self.stats), arts=self.arts)

    # ------------------------------------------------------------------ 내부 변경
    def _add_stats(self, deltas: Dict[str, int]) -> Dict[str, int]:
        applied: Dict[str, int] = {}
        for stat, delta in deltas.items():
            before = self.stats[stat]
            self.stats[stat] = max(1, min(MAX_STAT, before + delta))
            applied[stat] = self.stats[stat] - before
        return applied

    def _change_stamina(self, delta: int) -> None:
        self.stamina = max(0, min(MAX_STAMINA, self.stamina + delta))

    def _change_mood(self, delta: int) -> None:
        self.mood = max(0, min(len(MOODS) - 1, self.mood + delta))

    def _ensure_can_act(self) -> None:
        if self.finished:
            raise RuntimeError("육성이 이미 종료되었습니다.")
        if self.pending_event:
            raise RuntimeError("먼저 사건의 선택지를 골라야 합니다.")

    def _ensure_regular_turn(self) -> None:
        self._ensure_can_act()
        if self.current_tournament():
            raise RuntimeError("이번 달은 대회에 참가해야 합니다.")

    def _learn_random_art(self) -> Optional[str]:
        options = self.available_arts()
        if not options:
            return None
        art = self.rng.choice(options)
        self.arts.append(art["id"])
        return art["name"]

    def _apply_effects(self, effects: Dict, result: ActionResult) -> None:
        if "duel" in effects:
            duel = effects["duel"]
            opponent = generate_opponent(
                int(expected_power(self.turn) * duel["power_scale"]), self.rng, art_count=self.turn // 12
            )
            outcome = simulate_duel(self.player_fighter(), opponent, self.rng)
            result.duel_log = outcome.log
            if outcome.won:
                result.messages.append(f"{opponent.name}을(를) 꺾었다!")
                self._apply_effects(duel["win"], result)
            else:
                result.success = False
                result.messages.append(f"{opponent.name}에게 패하고 말았다...")
                self._apply_effects(duel["lose"], result)
        if "stats" in effects:
            applied = self._add_stats(effects["stats"])
            for stat, value in applied.items():
                result.gains[stat] = result.gains.get(stat, 0) + value
        if "stamina" in effects:
            self._change_stamina(effects["stamina"])
        if "mood" in effects:
            self._change_mood(effects["mood"])
        if "insight" in effects:
            self.insight += effects["insight"]
            result.messages.append(f"깨달음 +{effects['insight']}")
        if "fame" in effects:
            self.fame += effects["fame"]
            result.messages.append(f"명성 +{effects['fame']}")
        if effects.get("random_art"):
            name = self._learn_random_art()
            if name:
                result.messages.append(f"무공 [{name}]을(를) 깨우쳤다!")
            else:
                self.insight += 40
                result.messages.append("이미 아는 무공이었다. 깨달음 +40")
        chance = effects.get("injury_chance", 0)
        if chance and self.rng.random() < chance:
            self.injured = True
            result.messages.append("부상을 입었다! (수련 효율 절반, 휴식으로 회복)")

    def _end_turn(self, result: ActionResult) -> ActionResult:
        self.history.append(f"[{self.date_label()}] {result.title}")
        if self.injured and self.rng.random() < 0.3:
            self._change_mood(-1)
            result.messages.append("상처가 욱신거려 심경이 나빠졌다.")
        if self.rng.random() < EVENT_CHANCE:
            self.pending_event = self._pick_event()
        self._advance()
        return result

    def _advance(self) -> None:
        if self.turn % MONTHS_PER_YEAR == 0:
            self.age += 1
        if self.turn >= TOTAL_TURNS:
            self.finished = True
            self.ending = self._build_ending()
        else:
            self.turn += 1

    def _pick_event(self) -> Optional[Dict]:
        pool = [e for e in EVENTS if e.get("min_turn", 0) <= self.turn]
        if not pool:
            return None
        weights = [e.get("weight", 1.0) for e in pool]
        return self.rng.choices(pool, weights=weights, k=1)[0]

    # ------------------------------------------------------------------ 행동
    def train(self, training_id: str) -> ActionResult:
        self._ensure_regular_turn()
        training = TRAININGS_BY_ID[training_id]
        result = ActionResult(title=training["name"])
        cost = training["stamina"]

        if self.rng.random() < self.failure_rate():
            main_stat = next(iter(training["gains"]))
            result.success = False
            result.gains = self._add_stats({main_stat: -self.rng.randint(5, 12)})
            self._change_stamina(min(cost, 0))
            self._change_mood(-1)
            result.messages.append("무리한 수련으로 기혈이 뒤틀렸다! 수련 실패.")
            if self.rng.random() < (0.6 if self.stamina < 15 else 0.3):
                self.injured = True
                result.messages.append("부상을 입었다! (수련 효율 절반, 휴식으로 회복)")
            return self._end_turn(result)

        mult = self.gain_multiplier(training_id)
        deltas = {
            stat: max(1, round(base * mult * self.rng.uniform(0.9, 1.1)))
            for stat, base in training["gains"].items()
        }
        result.gains = self._add_stats(deltas)
        self._change_stamina(cost)
        self.insight += training["insight"]
        level_before = self.training_level(training_id)
        self.training_uses[training_id] += 1
        if self.training_level(training_id) > level_before:
            result.messages.append(f"{training['name']} 숙련도가 {self.training_level(training_id)}단계로 올랐다!")
        if self.rng.random() < 0.1:
            self._change_mood(1)
            result.messages.append("수련이 잘 풀려 기분이 좋아졌다.")
        return self._end_turn(result)

    def rest(self) -> ActionResult:
        self._ensure_regular_turn()
        result = ActionResult(title="휴식")
        amount = REST_STAMINA + self.rng.randint(-10, 10)
        self._change_stamina(amount)
        result.messages.append(f"푹 쉬었다. 기력 +{amount}")
        if self.injured:
            self.injured = False
            result.messages.append("부상이 나았다.")
        return self._end_turn(result)

    def outing(self) -> ActionResult:
        self._ensure_regular_turn()
        result = ActionResult(title="유람")
        boost = 2 if self.rng.random() < 0.25 else 1
        self._change_mood(boost)
        self._change_stamina(OUTING_STAMINA)
        place = self.rng.choice(["저잣거리", "서호(西湖)", "찻집", "산사(山寺)", "기루의 연회", "장터"])
        result.messages.append(f"{place}에서 하루를 보냈다. 심경이 {self.mood_name}(으)로 바뀌었다.")
        return self._end_turn(result)

    def spar(self) -> ActionResult:
        """아무 때나 할 수 있는 비무. 이기면 명성과 깨달음을 얻는다."""
        self._ensure_regular_turn()
        result = ActionResult(title="비무")
        self._change_stamina(SPAR_STAMINA)
        self._apply_effects(
            {"duel": {
                "power_scale": 0.95,
                "win": {"fame": 6, "insight": 18,
                        "stats": {self.rng.choice(ALL_STATS): 10, self.rng.choice(ALL_STATS): 10}},
                "lose": {"insight": 6, "mood": -1, "injury_chance": 0.15},
            }},
            result,
        )
        return self._end_turn(result)

    def enter_tournament(self) -> TournamentResult:
        self._ensure_can_act()
        tournament = self.current_tournament()
        if not tournament:
            raise RuntimeError("이번 달에는 대회가 없습니다.")
        index = TOURNAMENTS.index(tournament)
        outcome = TournamentResult(name=tournament["name"], rounds=tournament["rounds"])
        for round_no in range(tournament["rounds"]):
            power = tournament["base_power"] + tournament["step"] * round_no
            opponent = generate_opponent(power, self.rng, art_count=index + round_no // 2)
            outcome.opponents.append(opponent.name)
            duel = simulate_duel(self.player_fighter(), opponent, self.rng)
            outcome.logs.append(duel.log)
            if not duel.won:
                break
            outcome.rounds_won += 1

        ratio = outcome.rounds_won / outcome.rounds
        self.fame += int(tournament["fame"] * ratio) + (tournament["fame"] if outcome.champion else 0)
        self.insight += int(tournament["insight"] * (0.5 + ratio))
        bonus = 4 * outcome.rounds_won
        self._add_stats({stat: bonus for stat in ALL_STATS})
        self._change_mood(1 if outcome.champion else (-1 if outcome.rounds_won == 0 else 0))
        self.stamina = max(self.stamina, 40)
        self.tournament_results.append(outcome)
        verdict = "우승" if outcome.champion else f"{outcome.rounds_won}승 후 탈락"
        self.history.append(f"[{self.date_label()}] {tournament['name']} {verdict}")
        self._advance()
        return outcome

    def learn_art(self, art_id: str) -> bool:
        """깨달음을 소모해 무공을 익힌다. 턴을 소모하지 않는다."""
        art = ARTS_BY_ID.get(art_id)
        if not art or art not in self.available_arts() or self.insight < art["cost"]:
            return False
        self.insight -= art["cost"]
        self.arts.append(art_id)
        return True

    def resolve_event(self, choice_index: int) -> ActionResult:
        if not self.pending_event:
            raise RuntimeError("처리할 사건이 없습니다.")
        event = self.pending_event
        choice = event["choices"][choice_index]
        self.pending_event = None
        result = ActionResult(title=event["title"], messages=[choice["result"]])
        self._apply_effects(choice["effects"], result)
        return result

    # ------------------------------------------------------------------ 엔딩
    def score(self) -> int:
        tourney_score = sum(r.rounds_won * 60 + (200 if r.champion else 0) for r in self.tournament_results)
        return self.total_stats() + self.fame * 3 + len(self.arts) * 40 + tourney_score

    def _build_ending(self) -> Ending:
        score = self.score()
        rank = next(label for threshold, label in RANKS if score >= threshold)
        best_stat = max(self.stats, key=self.stats.get)
        epithet = STAT_EPITHETS[best_stat]
        final = self.tournament_results[-1] if len(self.tournament_results) == len(TOURNAMENTS) else None
        name = self.character.name
        he = "그녀" if self.character.gender == "여성" else "그"

        if final and final.champion:
            title = "천하제일인"
            text = (f"천하제일 비무대회의 마지막 상대마저 쓰러뜨린 {name}. "
                    f"강호는 이제 {he}를 '{epithet}'이자 천하제일인이라 부른다. "
                    f"{he}의 이름은 문파의 현판과 함께 백 년을 전해질 것이다.")
        elif final and final.rounds_won >= 3:
            title = f"천하오절 · {epithet}"
            text = (f"비록 정상에는 닿지 못했으나, {name}의 무위는 천하의 고수들과 어깨를 나란히 했다. "
                    f"사람들은 {he}를 당대의 절정고수로 손꼽는다.")
        elif self.fame >= 120:
            title = f"협객 · {epithet}"
            text = (f"{name}의 협행은 저잣거리의 이야기꾼들 입에 오르내린다. "
                    f"무공의 고하를 떠나, 약자를 돕는 {he}의 이름은 강호에 널리 알려졌다.")
        elif score >= 2500:
            title = epithet
            text = (f"{name}은(는) 문파의 기둥으로 성장했다. "
                    f"아직 강호에 이름을 떨치진 못했지만, {he}의 칼끝은 날로 매서워지고 있다.")
        elif score >= 1600:
            title = "표국의 표사"
            text = (f"수련을 마친 {name}은(는) 표국에 들어가 표물을 호송하며 생계를 꾸린다. "
                    "평범하지만 성실한 삶이다.")
        else:
            title = "이름 없는 낭인"
            text = (f"{name}은(는) 문파를 떠나 강호를 떠돈다. "
                    "언젠가 다시 검을 들 날이 올지도 모른다.")
        return Ending(title=title, rank=rank, score=score, text=text)

    def apply_to_character(self) -> Character:
        """육성 결과를 원래 인물에 반영한다."""
        char = self.character
        char.stats = dict(self.stats)
        char.arts = list(self.arts)
        char.fame = self.fame
        char.age = self.age
        if self.ending:
            char.title = self.ending.title
        return char
