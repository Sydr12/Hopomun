"""강호육성기 로직 테스트."""
import random

import pytest

from gangho.data.constants import ALL_STATS
from gangho.data.training_data import MAX_STAT, TOTAL_TURNS, TOURNAMENTS, TRAININGS
from gangho.models.character import Character
from gangho.systems.combat import Fighter, simulate_duel
from gangho.systems.training import TrainingSession


def make_character(**overrides) -> Character:
    base = dict(
        name="이강호",
        age=18,
        gender="남성",
        weapon="검",
        stats={key: 50 for key in ALL_STATS},
        growth_tier="B",
    )
    base.update(overrides)
    return Character(**base)


def play_full_run(seed: int) -> TrainingSession:
    rng = random.Random(seed)
    session = TrainingSession(make_character(), rng)
    while not session.finished:
        if session.pending_event:
            session.resolve_event(0)
        elif session.current_tournament():
            session.enter_tournament()
        elif session.stamina < 40:
            session.rest()
        else:
            session.train(TRAININGS[session.turn % len(TRAININGS)]["id"])
    return session


def test_training_raises_stats_and_costs_stamina():
    session = TrainingSession(make_character(), random.Random(1))
    result = session.train("oegong")
    assert result.success
    assert result.gains["위력"] > 0
    assert session.stats["위력"] > 50
    assert session.stamina == 80
    assert session.turn == 2


def test_low_stamina_can_fail():
    session = TrainingSession(make_character(), random.Random(0))
    session.stamina = 0
    assert session.failure_rate() == pytest.approx(0.9)
    session.stamina = 60
    assert session.failure_rate() == 0.0


def test_training_level_increases_with_repetition():
    session = TrainingSession(make_character(), random.Random(3))
    session.training_uses["ungi"] = 3
    assert session.training_level("ungi") == 1
    session.training_uses["ungi"] = 4
    assert session.training_level("ungi") == 2


def test_rest_heals_injury():
    session = TrainingSession(make_character(), random.Random(5))
    session.injured = True
    session.stamina = 10
    session.rest()
    assert not session.injured
    assert session.stamina > 10


def test_tournament_turn_blocks_regular_actions():
    session = TrainingSession(make_character(), random.Random(2))
    session.turn = TOURNAMENTS[0]["turn"]
    with pytest.raises(RuntimeError):
        session.train("oegong")
    outcome = session.enter_tournament()
    assert 0 <= outcome.rounds_won <= outcome.rounds
    assert session.turn == TOURNAMENTS[0]["turn"] + 1


def test_pending_event_must_be_resolved_first():
    session = TrainingSession(make_character(), random.Random(4))
    from gangho.data.training_data import EVENTS
    session.pending_event = EVENTS[0]
    with pytest.raises(RuntimeError):
        session.rest()
    session.resolve_event(1)
    assert session.pending_event is None


def test_learn_art_spends_insight_and_respects_weapon():
    session = TrainingSession(make_character(weapon="검"), random.Random(6))
    session.insight = 100
    assert not session.learn_art("hangryong")  # 권갑 전용
    assert session.learn_art("dokgo")
    assert session.insight == 20
    assert not session.learn_art("dokgo")  # 중복 습득 불가


@pytest.mark.parametrize("seed", range(10))
def test_full_run_reaches_ending(seed):
    session = play_full_run(seed)
    assert session.finished
    assert session.turn == TOTAL_TURNS
    assert len(session.tournament_results) == len(TOURNAMENTS)
    assert session.ending is not None
    assert all(1 <= value <= MAX_STAT for value in session.stats.values())

    character = session.apply_to_character()
    assert character.title == session.ending.title
    assert character.age == 21
    assert character.stats == session.stats


def test_stronger_fighter_usually_wins():
    rng = random.Random(7)
    strong = {k: 300 for k in ["위력", "신속", "급소", "혈맥", "불굴", "심체", "회피", "집중"]}
    weak = {k: 100 for k in strong}
    wins = sum(
        simulate_duel(Fighter("강자", "부채", strong), Fighter("약자", "부채", weak), rng).won
        for _ in range(50)
    )
    assert wins >= 48


def test_candidates_are_complete():
    from gangho.systems.candidates import generate_candidates

    for candidate in generate_candidates(20, random.Random(9)):
        assert set(candidate.stats) == set(ALL_STATS)
        assert candidate.name and candidate.origin
