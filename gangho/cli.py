"""강호육성기 텍스트 모드."""
from __future__ import annotations

from typing import List

from .data.training_data import TOTAL_TURNS, TRAININGS
from .systems.candidates import generate_candidates
from .systems.training import ARTS_BY_ID, ActionResult, TrainingSession


class TrainingCli:
    """텍스트 기반 육성 흐름."""

    def run(self) -> None:
        print("=" * 60)
        print("                    강호육성기")
        print("=" * 60)
        print("문하에 들기를 청하는 이들이 찾아왔습니다.")
        candidates = generate_candidates()
        for idx, candidate in enumerate(candidates, start=1):
            print(f"-- {idx} --\n{candidate.describe()}")
        character = candidates[self._ask("제자로 받을 후보", len(candidates)) - 1]
        session = TrainingSession(character)
        print(f"\n{character.name}의 {TOTAL_TURNS}개월 수련이 시작됩니다.\n")

        while not session.finished:
            if session.pending_event:
                self._handle_event(session)
                continue
            self._print_status(session)
            if session.current_tournament():
                input(f"{session.current_tournament()['name']}에 출전합니다. (엔터)")
                result = session.enter_tournament()
                for i, opponent in enumerate(result.opponents):
                    print(f"  {i + 1}회전 {opponent}: {'승' if i < result.rounds_won else '패'}")
                print("  => 우승!" if result.champion else f"  => {result.rounds_won}승 후 탈락")
                continue
            self._choose_action(session)

        ending = session.ending
        session.apply_to_character()
        print("=" * 60)
        print(f"수련 종료! 평가 {ending.rank} ({ending.score}점)")
        print(f"칭호: {ending.title}")
        print(ending.text)
        print(character.describe())
        print("=" * 60)

    def _print_status(self, s: TrainingSession) -> None:
        goal = s.next_tournament()
        goal_text = f"다음 목표: {goal['name']} ({goal['turn'] - s.turn}개월 후)" if goal else ""
        print("-" * 60)
        print(f"{s.date_label()} ({s.turn}/{TOTAL_TURNS}턴)  {goal_text}")
        print(f"기력 {s.stamina}  심경 {s.mood_name}  {'[부상] ' if s.injured else ''}깨달음 {s.insight}  명성 {s.fame}")
        print("  " + "  ".join(f"{k} {v}" for k, v in s.stats.items()))

    def _choose_action(self, s: TrainingSession) -> None:
        options: List[str] = []
        fail = s.failure_rate()
        for idx, training in enumerate(TRAININGS, start=1):
            preview = ", ".join(f"{k}+{v}" for k, v in s.preview_training(training["id"]).items())
            risk = f" 실패 {int(fail * 100)}%" if fail else ""
            print(f"  {idx}. {training['name']} Lv{s.training_level(training['id'])} ({preview}){risk}")
            options.append(training["id"])
        extra = ["휴식", "유람", "비무", "무공 습득"]
        for offset, label in enumerate(extra, start=len(TRAININGS) + 1):
            print(f"  {offset}. {label}")
        choice = self._ask("행동", len(options) + len(extra))
        if choice <= len(options):
            self._show(s.train(options[choice - 1]))
        elif choice == 6:
            self._show(s.rest())
        elif choice == 7:
            self._show(s.outing())
        elif choice == 8:
            self._show(s.spar())
        else:
            self._learn_art(s)

    def _learn_art(self, s: TrainingSession) -> None:
        arts = s.available_arts()
        if not arts:
            print("더 익힐 무공이 없습니다.")
            return
        for idx, art in enumerate(arts, start=1):
            print(f"  {idx}. {art['name']} ({art['cost']}) - {art['desc']}")
        print("  0. 취소")
        raw = input(f"깨달음 {s.insight} / 익힐 무공 번호: ").strip()
        if raw.isdigit() and 1 <= int(raw) <= len(arts):
            art = arts[int(raw) - 1]
            if s.learn_art(art["id"]):
                print(f"[{ARTS_BY_ID[art['id']]['name']}] 습득!")
            else:
                print("깨달음이 부족합니다.")

    def _handle_event(self, s: TrainingSession) -> None:
        event = s.pending_event
        print(f"\n★ 사건: {event['title']}\n{event['text']}")
        for idx, choice in enumerate(event["choices"], start=1):
            print(f"  {idx}. {choice['label']}")
        self._show(s.resolve_event(self._ask("선택", len(event["choices"])) - 1))

    @staticmethod
    def _show(result: ActionResult) -> None:
        gains = "  ".join(f"{k} {v:+d}" for k, v in result.gains.items() if v)
        print(f"\n[{result.title}] {gains}")
        for message in result.messages:
            print(f"  {message}")

    @staticmethod
    def _ask(label: str, max_index: int) -> int:
        while True:
            raw = input(f"{label} 번호 (1-{max_index}): ").strip()
            if raw.isdigit() and 1 <= int(raw) <= max_index:
                return int(raw)
            print("올바른 번호를 입력해주세요.")


def main() -> None:
    TrainingCli().run()


if __name__ == "__main__":
    main()
