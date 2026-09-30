"""강호육성기 GUI 화면."""
from __future__ import annotations

from typing import Callable, Dict, List, Optional, Tuple, TYPE_CHECKING

import pygame

from ..data.constants import ALL_STATS, INTERNAL_STATS, PHYSICAL_STATS
from ..data.training_data import MAX_STAMINA, MOODS, TOTAL_TURNS, TRAININGS
from ..models.character import Character
from ..systems.candidates import generate_candidates
from ..systems.training import ARTS_BY_ID, ActionResult, TournamentResult, TrainingSession
from . import common
from .app import ScreenBase

if TYPE_CHECKING:
    from .app import GameApp

STAT_BAR_MAX = 600
MOOD_COLORS = [(150, 70, 200), (90, 120, 200), (200, 200, 200), (240, 170, 60), (240, 90, 90)]
GREEN = (110, 210, 120)
RED = (220, 90, 90)
MUTED = (160, 170, 180)
MODAL_BG = (24, 28, 36)


def _to_title(app: "GameApp") -> None:
    app.change_screen(TitleScreen())


class Button:
    """클릭 가능한 사각형과 콜백."""

    def __init__(self, rect: pygame.Rect, label: str, on_click: Callable[[], None], *,
                 sublabel: str = "", enabled: bool = True, hover_key: Optional[str] = None) -> None:
        self.rect = rect
        self.label = label
        self.sublabel = sublabel
        self.on_click = on_click
        self.enabled = enabled
        self.hover_key = hover_key

    def draw(self, surface: pygame.Surface, font: pygame.font.Font, small: pygame.font.Font,
             base_color: Tuple[int, int, int] = common.PANEL_COLOR) -> None:
        hovered = self.enabled and self.rect.collidepoint(pygame.mouse.get_pos())
        color = common.SLATE if hovered else base_color
        if not self.enabled:
            color = (40, 44, 50)
        pygame.draw.rect(surface, color, self.rect, border_radius=10)
        border = common.ACCENT_COLOR if hovered else (70, 80, 92)
        pygame.draw.rect(surface, border, self.rect, width=2, border_radius=10)
        text_color = common.TEXT_COLOR if self.enabled else (100, 100, 100)
        label = font.render(self.label, True, text_color)
        if self.sublabel:
            surface.blit(label, label.get_rect(center=(self.rect.centerx, self.rect.centery - 11)))
            sub = small.render(self.sublabel, True, MUTED if self.enabled else (90, 90, 90))
            surface.blit(sub, sub.get_rect(center=(self.rect.centerx, self.rect.centery + 14)))
        else:
            surface.blit(label, label.get_rect(center=self.rect.center))

    def hit(self, pos: Tuple[int, int]) -> bool:
        return self.enabled and self.rect.collidepoint(pos)


# ---------------------------------------------------------------------------
# 타이틀 · 제자 선택
# ---------------------------------------------------------------------------
class TitleScreen(ScreenBase):
    """시작 화면과 이번 실행에서 키운 제자들(명예의 전당)."""

    def __init__(self) -> None:
        self.title_font = common.load_brush_font(130)
        self.sub_font = common.load_brush_font(44)
        self.font = common.load_font(20)
        self.small = common.load_font(16)
        self.buttons: List[Button] = []

    def enter(self, app: "GameApp") -> None:
        cx = common.SCREEN_SIZE[0] // 2
        self.buttons = [
            Button(pygame.Rect(cx - 130, 380, 260, 56), "새 제자 받기", lambda: app.change_screen(DiscipleSelectScreen())),
            Button(pygame.Rect(cx - 130, 450, 260, 56), "종료", app.request_exit),
        ]

    def handle_event(self, event: pygame.event.Event, app: "GameApp") -> None:
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            for button in self.buttons:
                if button.hit(event.pos):
                    button.on_click()
                    return
        elif event.type == pygame.KEYDOWN:
            if event.key in (pygame.K_RETURN, pygame.K_SPACE):
                self.buttons[0].on_click()
            elif event.key == pygame.K_ESCAPE:
                app.request_exit()

    def draw(self, surface: pygame.Surface, app: "GameApp") -> None:
        surface.fill(common.BACKGROUND_COLOR)
        cx = surface.get_width() // 2
        title = self.title_font.render("강호육성기", True, common.ACCENT_COLOR)
        surface.blit(title, title.get_rect(center=(cx, 170)))
        sub = self.sub_font.render(f"{TOTAL_TURNS}개월, 한 명의 제자를 천하제일인으로", True, common.TEXT_COLOR)
        surface.blit(sub, sub.get_rect(center=(cx, 290)))
        for button in self.buttons:
            button.draw(surface, self.font, self.small)

        if app.hall_of_fame:
            heading = self.small.render("명예의 전당", True, common.ACCENT_COLOR)
            surface.blit(heading, (40, 540))
            for i, disciple in enumerate(app.hall_of_fame[-4:][::-1]):
                line = self.small.render(f"[{disciple.title}] {disciple.name} · 명성 {disciple.fame}",
                                         True, common.TEXT_COLOR)
                surface.blit(line, (40 + (i % 2) * 380, 566 + (i // 2) * 26))


class DiscipleSelectScreen(ScreenBase):
    """입문을 청한 후보 3명 중 한 명을 제자로 받는다."""

    CARD_W = 340
    CARD_H = 300
    MAX_REROLLS = 3

    def __init__(self) -> None:
        self.title_font = common.load_font(40)
        self.font = common.load_font(20)
        self.small = common.load_font(16)
        self.choices: List[Character] = []
        self.cards: List[pygame.Rect] = []
        self.rerolls_left = self.MAX_REROLLS
        self.buttons: List[Button] = []

    def enter(self, app: "GameApp") -> None:
        self.choices = generate_candidates(3)
        start_x = (common.SCREEN_SIZE[0] - (3 * self.CARD_W + 2 * 24)) // 2
        self.cards = [pygame.Rect(start_x + i * (self.CARD_W + 24), 150, self.CARD_W, self.CARD_H) for i in range(3)]
        bottom = common.SCREEN_SIZE[1] - 80
        self.buttons = [
            Button(pygame.Rect(30, bottom, 130, 50), "뒤로", lambda: app.change_screen(TitleScreen())),
            Button(pygame.Rect(common.SCREEN_SIZE[0] - 250, bottom, 220, 50), "", self._reroll),
        ]
        self._refresh_reroll()

    def _refresh_reroll(self) -> None:
        button = self.buttons[1]
        button.label = f"다른 후보 보기 ({self.rerolls_left})"
        button.enabled = self.rerolls_left > 0

    def _reroll(self) -> None:
        self.rerolls_left -= 1
        self.choices = generate_candidates(3)
        self._refresh_reroll()

    def handle_event(self, event: pygame.event.Event, app: "GameApp") -> None:
        if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
            app.change_screen(TitleScreen())
        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            for button in self.buttons:
                if button.hit(event.pos):
                    button.on_click()
                    return
            for character, rect in zip(self.choices, self.cards):
                if rect.collidepoint(event.pos):
                    app.change_screen(TrainingScreen(character))
                    return

    def draw(self, surface: pygame.Surface, app: "GameApp") -> None:
        surface.fill(common.BACKGROUND_COLOR)
        title = self.title_font.render("입문 제자 선택", True, common.ACCENT_COLOR)
        surface.blit(title, title.get_rect(center=(surface.get_width() // 2, 60)))
        guide = self.font.render("문하에 들기를 청하는 이들이 찾아왔습니다. 한 명을 제자로 받아 수련을 시작하세요.",
                                 True, common.TEXT_COLOR)
        surface.blit(guide, guide.get_rect(center=(surface.get_width() // 2, 108)))

        mouse = pygame.mouse.get_pos()
        for character, rect in zip(self.choices, self.cards):
            hovered = rect.collidepoint(mouse)
            pygame.draw.rect(surface, common.PANEL_COLOR, rect, border_radius=12)
            pygame.draw.rect(surface, common.ACCENT_COLOR if hovered else common.SLATE, rect, width=2, border_radius=12)
            name = self.font.render(character.name, True, common.ACCENT_COLOR)
            surface.blit(name, (rect.left + 16, rect.top + 14))
            tier = self.font.render(f"성장 {character.growth_tier}", True, common.TEXT_COLOR)
            surface.blit(tier, tier.get_rect(topright=(rect.right - 16, rect.top + 14)))
            info = self.small.render(f"{character.gender} · {character.age}세 · {character.weapon}", True, common.TEXT_COLOR)
            surface.blit(info, (rect.left + 16, rect.top + 44))
            origin = self.small.render(character.origin, True, MUTED)
            surface.blit(origin, (rect.left + 16, rect.top + 66))
            for i, key in enumerate(ALL_STATS):
                col, row = i % 2, i // 2
                line = self.small.render(f"{key} {character.stats.get(key, 0)}", True, common.TEXT_COLOR)
                surface.blit(line, (rect.left + 16 + col * 150, rect.top + 100 + row * 26))
            hint = self.small.render("클릭하여 제자로 받기", True, MUTED)
            surface.blit(hint, hint.get_rect(midbottom=(rect.centerx, rect.bottom - 12)))

        for button in self.buttons:
            button.draw(surface, self.font, self.small)

# ---------------------------------------------------------------------------
# 모달
# ---------------------------------------------------------------------------
class Modal:
    WIDTH = 760
    HEIGHT = 470

    def __init__(self) -> None:
        self.title_font = common.load_font(30)
        self.font = common.load_font(20)
        self.small = common.load_font(16)
        self.buttons: List[Button] = []
        self.rect = pygame.Rect(0, 0, self.WIDTH, self.HEIGHT)
        self.rect.center = (common.SCREEN_SIZE[0] // 2, common.SCREEN_SIZE[1] // 2)

    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            for button in self.buttons:
                if button.hit(event.pos):
                    button.on_click()
                    return
        elif event.type == pygame.KEYDOWN and event.key in (pygame.K_RETURN, pygame.K_SPACE):
            enabled = [b for b in self.buttons if b.enabled]
            if len(enabled) == 1:
                enabled[0].on_click()

    def draw_frame(self, surface: pygame.Surface, title: str) -> int:
        overlay = pygame.Surface(surface.get_size(), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 160))
        surface.blit(overlay, (0, 0))
        pygame.draw.rect(surface, MODAL_BG, self.rect, border_radius=16)
        pygame.draw.rect(surface, common.ACCENT_COLOR, self.rect, width=2, border_radius=16)
        heading = self.title_font.render(title, True, common.ACCENT_COLOR)
        surface.blit(heading, heading.get_rect(midtop=(self.rect.centerx, self.rect.top + 20)))
        return self.rect.top + 70

    def draw_lines(self, surface: pygame.Surface, lines: List[Tuple[str, Tuple[int, int, int]]], y: int,
                   font: Optional[pygame.font.Font] = None, gap: int = 28) -> int:
        font = font or self.font
        for text, color in lines:
            for wrapped in common.wrap_text(text, font, self.rect.width - 80):
                surface.blit(font.render(wrapped, True, color), (self.rect.left + 40, y))
                y += gap
        return y

    def draw_buttons(self, surface: pygame.Surface) -> None:
        for button in self.buttons:
            button.draw(surface, self.font, self.small, base_color=common.SLATE)

    def draw(self, surface: pygame.Surface) -> None:
        raise NotImplementedError


def gains_text(gains: Dict[str, int]) -> str:
    return "  ".join(f"{k} {v:+d}" for k, v in gains.items() if v)


class ResultModal(Modal):
    """행동/사건 결과를 보여준다."""

    HEIGHT = 380

    def __init__(self, result: ActionResult, on_close: Callable[[], None]) -> None:
        super().__init__()
        self.rect.height = self.HEIGHT
        self.rect.center = (common.SCREEN_SIZE[0] // 2, common.SCREEN_SIZE[1] // 2)
        self.result = result
        self.buttons = [Button(pygame.Rect(self.rect.centerx - 70, self.rect.bottom - 64, 140, 44), "확인", on_close)]

    def draw(self, surface: pygame.Surface) -> None:
        y = self.draw_frame(surface, self.result.title)
        lines: List[Tuple[str, Tuple[int, int, int]]] = []
        if self.result.gains:
            color = GREEN if self.result.success else RED
            lines.append((gains_text(self.result.gains), color))
        lines += [(m, common.TEXT_COLOR) for m in self.result.messages]
        y = self.draw_lines(surface, lines, y)
        if self.result.duel_log:
            tail = self.result.duel_log[-4:]
            self.draw_lines(surface, [(line, MUTED) for line in tail], y + 6, self.small, 22)
        self.draw_buttons(surface)


class EventModal(Modal):
    """선택지가 있는 사건."""

    def __init__(self, event: Dict, on_choice: Callable[[int], None]) -> None:
        super().__init__()
        self.event = event
        self.buttons = []
        for i, choice in enumerate(event["choices"]):
            rect = pygame.Rect(self.rect.left + 60, self.rect.bottom - 150 + i * 62, self.rect.width - 120, 50)
            self.buttons.append(Button(rect, choice["label"], lambda i=i: on_choice(i)))

    def draw(self, surface: pygame.Surface) -> None:
        y = self.draw_frame(surface, f"사건 - {self.event['title']}")
        self.draw_lines(surface, [(self.event["text"], common.TEXT_COLOR)], y + 10, gap=32)
        self.draw_buttons(surface)


class TournamentModal(Modal):
    """대회 결과를 회전별로 보여준다."""

    def __init__(self, result: TournamentResult, on_close: Callable[[], None]) -> None:
        super().__init__()
        self.result = result
        self.selected = len(result.logs) - 1
        self.buttons = [Button(pygame.Rect(self.rect.centerx - 70, self.rect.bottom - 60, 140, 44), "확인", on_close)]
        self.round_rects: List[pygame.Rect] = []

    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            for i, rect in enumerate(self.round_rects):
                if rect.collidepoint(event.pos):
                    self.selected = i
                    return
        super().handle_event(event)

    def draw(self, surface: pygame.Surface) -> None:
        r = self.result
        verdict = "우승!" if r.champion else f"{r.rounds_won}승 후 탈락"
        y = self.draw_frame(surface, f"{r.name} - {verdict}")
        self.round_rects = []
        for i, opponent in enumerate(r.opponents):
            won = i < r.rounds_won
            rect = pygame.Rect(self.rect.left + 30, y + i * 44, 250, 38)
            self.round_rects.append(rect)
            selected = i == self.selected
            pygame.draw.rect(surface, common.SLATE if selected else common.PANEL_COLOR, rect, border_radius=8)
            text = self.small.render(f"{i + 1}회전 {opponent}", True, common.TEXT_COLOR)
            surface.blit(text, (rect.left + 10, rect.top + 9))
            mark = self.small.render("승" if won else "패", True, GREEN if won else RED)
            surface.blit(mark, mark.get_rect(midright=(rect.right - 10, rect.centery)))
        for i in range(len(r.opponents), r.rounds):
            text = self.small.render(f"{i + 1}회전 -", True, (90, 90, 90))
            surface.blit(text, (self.rect.left + 40, y + i * 44 + 9))

        log = r.logs[self.selected] if r.logs else []
        shown = log[:2] + ["..."] + log[-9:] if len(log) > 12 else log
        ly = y
        for line in shown:
            for wrapped in common.wrap_text(line, self.small, self.rect.width - 340):
                surface.blit(self.small.render(wrapped, True, MUTED), (self.rect.left + 300, ly))
                ly += 22
        self.draw_buttons(surface)


class ArtsModal(Modal):
    """깨달음을 소모해 무공을 익힌다."""

    def __init__(self, session: TrainingSession, on_close: Callable[[], None], on_learn: Callable[[str], None]) -> None:
        super().__init__()
        self.session = session
        self.on_learn = on_learn
        self.on_close = on_close
        self.rebuild()

    def rebuild(self) -> None:
        self.buttons = [Button(pygame.Rect(self.rect.centerx - 70, self.rect.bottom - 60, 140, 44), "닫기", self.on_close)]
        arts = self.session.available_arts()
        for i, art in enumerate(arts[:8]):
            col, row = i % 2, i // 2
            rect = pygame.Rect(self.rect.left + 30 + col * 355, self.rect.top + 110 + row * 66, 340, 58)
            affordable = self.session.insight >= art["cost"]
            self.buttons.append(Button(rect, f"{art['name']} ({art['cost']})", lambda a=art["id"]: self.on_learn(a),
                                       sublabel=art["desc"], enabled=affordable))

    def draw(self, surface: pygame.Surface) -> None:
        y = self.draw_frame(surface, "무공 습득")
        info = self.small.render(f"보유 깨달음: {self.session.insight}   (무공 습득은 턴을 소모하지 않습니다)",
                                 True, common.TEXT_COLOR)
        surface.blit(info, info.get_rect(center=(self.rect.centerx, y + 4)))
        if len(self.buttons) == 1:
            self.draw_lines(surface, [("더 익힐 수 있는 무공이 없습니다.", MUTED)], y + 60)
        self.draw_buttons(surface)


class EndingModal(Modal):
    HEIGHT = 560

    def __init__(self, session: TrainingSession, on_close: Callable[[], None]) -> None:
        super().__init__()
        self.rect.height = self.HEIGHT
        self.rect.center = (common.SCREEN_SIZE[0] // 2, common.SCREEN_SIZE[1] // 2)
        self.session = session
        self.rank_font = common.load_brush_font(110)
        self.buttons = [Button(pygame.Rect(self.rect.centerx - 110, self.rect.bottom - 62, 220, 44),
                               "처음 화면으로", on_close)]

    def draw(self, surface: pygame.Surface) -> None:
        ending = self.session.ending
        assert ending is not None
        y = self.draw_frame(surface, "수련 종료")
        rank = self.rank_font.render(ending.rank, True, common.ACCENT_COLOR)
        surface.blit(rank, rank.get_rect(topleft=(self.rect.left + 50, y - 10)))
        name = self.title_font.render(f"[{ending.title}] {self.session.character.name}", True, common.TEXT_COLOR)
        surface.blit(name, (self.rect.left + 220, y + 10))
        score = self.font.render(f"평가 점수 {ending.score}   명성 {self.session.fame}   무공 {len(self.session.arts)}종",
                                 True, MUTED)
        surface.blit(score, (self.rect.left + 220, y + 56))
        ty = self.draw_lines(surface, [(ending.text, common.TEXT_COLOR)], y + 120, gap=30)
        stats = self.session.stats
        for i, key in enumerate(ALL_STATS):
            col, row = i % 4, i // 4
            text = self.font.render(f"{key} {stats[key]}", True, common.TEXT_COLOR)
            surface.blit(text, (self.rect.left + 40 + col * 175, ty + 14 + row * 30))
        history = " / ".join(h.split("] ", 1)[1] for h in self.session.history if "대회" in h)
        self.draw_lines(surface, [(history, MUTED)], ty + 84, self.small, 22)
        self.draw_buttons(surface)


# ---------------------------------------------------------------------------
# 메인 육성 화면
# ---------------------------------------------------------------------------
class TrainingScreen(ScreenBase):
    """한 턴씩 행동을 골라 제자를 성장시킨다."""

    def __init__(self, character: Character, session: Optional[TrainingSession] = None) -> None:
        self.session = session or TrainingSession(character)
        self.character = character
        self.big_font = common.load_font(30)
        self.font = common.load_font(20)
        self.small = common.load_font(16)
        self.buttons: List[Button] = []
        self.modal: Optional[Modal] = None
        self.hover_training: Optional[str] = None
        self.app: Optional["GameApp"] = None

    # -------------------------------------------------------------- 수명주기
    def enter(self, app: "GameApp") -> None:
        self.app = app
        self._rebuild_buttons()

    def update(self, dt: float, app: "GameApp") -> None:
        del dt, app
        self.hover_training = None
        if self.modal:
            return
        mouse = pygame.mouse.get_pos()
        for button in self.buttons:
            if button.hover_key and button.rect.collidepoint(mouse):
                self.hover_training = button.hover_key

    def handle_event(self, event: pygame.event.Event, app: "GameApp") -> None:
        if self.modal:
            self.modal.handle_event(event)
            return
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            for button in self.buttons:
                if button.hit(event.pos):
                    button.on_click()
                    return
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                app.set_toast("수련을 중단하려면 [중단] 버튼을 누르세요.")
            elif pygame.K_1 <= event.key <= pygame.K_5 and not self.session.current_tournament():
                self._do(lambda: self.session.train(TRAININGS[event.key - pygame.K_1]["id"]))

    # -------------------------------------------------------------- 버튼
    def _rebuild_buttons(self) -> None:
        s = self.session
        self.buttons = []
        width, height, gap = 212, 64, 14
        start_x = (common.SCREEN_SIZE[0] - (5 * width + 4 * gap)) // 2
        row1, row2 = 500, 580
        if s.finished:
            return
        if s.current_tournament():
            rect = pygame.Rect(common.SCREEN_SIZE[0] // 2 - 200, row1 + 20, 400, 90)
            name = s.current_tournament()["name"]
            self.buttons.append(Button(rect, f"{name} 출전", self._enter_tournament, sublabel="이번 달은 대회에 참가합니다"))
            return
        fail = s.failure_rate()
        for i, training in enumerate(TRAININGS):
            rect = pygame.Rect(start_x + i * (width + gap), row1, width, height)
            sub = f"Lv{s.training_level(training['id'])}"
            sub += f"  실패 {int(fail * 100)}%" if fail else f"  기력 {training['stamina']:+d}"
            self.buttons.append(Button(rect, f"{i + 1}. {training['name']}",
                                       lambda t=training["id"]: self._do(lambda: s.train(t)),
                                       sublabel=sub, hover_key=training["id"]))
        extra = [
            ("휴식", "기력 회복 · 부상 치료", lambda: self._do(s.rest)),
            ("유람", "심경 상승 · 기력 +15", lambda: self._do(s.outing)),
            ("비무", "강호 무인과 대련", lambda: self._do(s.spar)),
            ("무공 습득", f"깨달음 {s.insight}", self._open_arts),
            ("포기", "수련을 그만둔다", self._quit),
        ]
        for i, (label, sub, callback) in enumerate(extra):
            rect = pygame.Rect(start_x + i * (width + gap), row2, width, height)
            self.buttons.append(Button(rect, label, callback, sublabel=sub))

    # -------------------------------------------------------------- 행동 처리
    def _do(self, action: Callable[[], ActionResult]) -> None:
        result = action()
        self.modal = ResultModal(result, self._after_result)

    def _after_result(self) -> None:
        self.modal = None
        s = self.session
        if s.pending_event:
            self.modal = EventModal(s.pending_event, self._choose_event)
        elif s.finished:
            self.modal = EndingModal(s, self._finish)
        self._rebuild_buttons()

    def _choose_event(self, index: int) -> None:
        result = self.session.resolve_event(index)
        self.modal = ResultModal(result, self._after_result)

    def _enter_tournament(self) -> None:
        result = self.session.enter_tournament()
        self.modal = TournamentModal(result, self._after_result)

    def _open_arts(self) -> None:
        def learn(art_id: str) -> None:
            if self.session.learn_art(art_id) and self.app:
                self.app.set_toast(f"[{ARTS_BY_ID[art_id]['name']}] 습득!")
            if isinstance(self.modal, ArtsModal):
                self.modal.rebuild()

        def close() -> None:
            self.modal = None
            self._rebuild_buttons()

        self.modal = ArtsModal(self.session, close, learn)

    def _quit(self) -> None:
        if self.app:
            self.app.set_toast(f"{self.character.name}은(는) 수련을 그만두고 하산했습니다.")
            _to_title(self.app)

    def _finish(self) -> None:
        self.session.apply_to_character()
        if self.app:
            self.app.hall_of_fame.append(self.character)
            self.app.set_toast(f"{self.character.name}이(가) [{self.character.title}]의 칭호를 얻었습니다.")
            _to_title(self.app)

    # -------------------------------------------------------------- 그리기
    def draw(self, surface: pygame.Surface, app: "GameApp") -> None:
        surface.fill(common.BACKGROUND_COLOR)
        self._draw_header(surface)
        self._draw_profile(surface)
        self._draw_stats(surface)
        self._draw_log(surface)
        for button in self.buttons:
            button.draw(surface, self.font, self.small)
        if self.modal:
            self.modal.draw(surface)

    def _panel(self, surface: pygame.Surface, rect: pygame.Rect, title: str) -> None:
        pygame.draw.rect(surface, common.PANEL_COLOR, rect, border_radius=12)
        pygame.draw.rect(surface, (60, 72, 86), rect, width=1, border_radius=12)
        heading = self.small.render(title, True, common.ACCENT_COLOR)
        surface.blit(heading, (rect.left + 14, rect.top + 10))

    def _draw_header(self, surface: pygame.Surface) -> None:
        s = self.session
        pygame.draw.rect(surface, (26, 34, 44), pygame.Rect(0, 0, surface.get_width(), 70))
        date = self.big_font.render(s.date_label(), True, common.ACCENT_COLOR)
        surface.blit(date, (24, 18))
        turn = self.font.render(f"{s.turn} / {TOTAL_TURNS}턴", True, common.TEXT_COLOR)
        surface.blit(turn, (24 + date.get_width() + 18, 26))

        goal = s.next_tournament()
        if s.finished:
            text, color = "수련 종료", common.ACCENT_COLOR
        elif goal:
            remaining = goal["turn"] - s.turn
            text = f"목표: {goal['name']}" + (" - 이번 달!" if remaining == 0 else f" ({remaining}개월 후)")
            color = RED if remaining <= 2 else common.TEXT_COLOR
        else:
            text, color = "모든 대회가 끝났습니다", MUTED
        goal_surface = self.font.render(text, True, color)
        surface.blit(goal_surface, goal_surface.get_rect(topright=(surface.get_width() - 24, 26)))

        progress = pygame.Rect(0, 66, surface.get_width(), 4)
        pygame.draw.rect(surface, (40, 48, 60), progress)
        done = progress.copy()
        done.width = int(progress.width * (s.turn - 1) / TOTAL_TURNS)
        pygame.draw.rect(surface, common.ACCENT_COLOR, done)

    def _draw_profile(self, surface: pygame.Surface) -> None:
        s = self.session
        c = self.character
        rect = pygame.Rect(20, 86, 340, 396)
        self._panel(surface, rect, "제자")
        x, y = rect.left + 16, rect.top + 36
        name = self.big_font.render(c.name, True, common.TEXT_COLOR)
        surface.blit(name, (x, y))
        y += 40
        info = self.small.render(f"{c.gender} · {s.age}세 · {c.weapon} · 성장 등급 {c.growth_tier}", True, MUTED)
        surface.blit(info, (x, y))
        y += 34

        surface.blit(self.font.render("기력", True, common.TEXT_COLOR), (x, y))
        bar = pygame.Rect(x + 60, y + 4, 230, 18)
        pygame.draw.rect(surface, (40, 48, 60), bar, border_radius=6)
        fill = bar.copy()
        fill.width = int(bar.width * s.stamina / MAX_STAMINA)
        stamina_color = GREEN if s.stamina >= 50 else ((230, 180, 60) if s.stamina >= 30 else RED)
        pygame.draw.rect(surface, stamina_color, fill, border_radius=6)
        value = self.small.render(f"{s.stamina}", True, common.TEXT_COLOR)
        surface.blit(value, value.get_rect(center=bar.center))
        y += 36

        surface.blit(self.font.render("심경", True, common.TEXT_COLOR), (x, y))
        for i, mood in enumerate(MOODS):
            chip = pygame.Rect(x + 60 + i * 46, y, 42, 26)
            active = i == s.mood
            pygame.draw.rect(surface, MOOD_COLORS[i] if active else (44, 52, 64), chip, border_radius=6)
            label = self.small.render(mood, True, common.BLACK if active else (120, 120, 120))
            surface.blit(label, label.get_rect(center=chip.center))
        y += 40

        status = "부상 (수련 효율 절반)" if s.injured else "양호"
        surface.blit(self.font.render(f"상태  {status}", True, RED if s.injured else common.TEXT_COLOR), (x, y))
        y += 32
        surface.blit(self.font.render(f"깨달음  {s.insight}", True, common.TEXT_COLOR), (x, y))
        surface.blit(self.font.render(f"명성  {s.fame}", True, common.TEXT_COLOR), (x + 160, y))
        y += 38
        surface.blit(self.small.render("익힌 무공", True, common.ACCENT_COLOR), (x, y))
        y += 24
        names = [ARTS_BY_ID[a]["name"] for a in s.arts] or ["없음"]
        for line in common.wrap_text(", ".join(names), self.small, rect.width - 32)[:4]:
            surface.blit(self.small.render(line, True, common.TEXT_COLOR), (x, y))
            y += 22

    def _draw_stats(self, surface: pygame.Surface) -> None:
        s = self.session
        rect = pygame.Rect(376, 86, 420, 396)
        self._panel(surface, rect, "능력치")
        preview = s.preview_training(self.hover_training) if self.hover_training else {}
        y = rect.top + 40
        for group, keys in (("외공", PHYSICAL_STATS), ("내공", INTERNAL_STATS)):
            surface.blit(self.small.render(group, True, MUTED), (rect.left + 16, y))
            y += 22
            for key in keys:
                value = s.stats[key]
                surface.blit(self.font.render(key, True, common.TEXT_COLOR), (rect.left + 16, y))
                bar = pygame.Rect(rect.left + 76, y + 5, 240, 16)
                pygame.draw.rect(surface, (40, 48, 60), bar, border_radius=5)
                fill = bar.copy()
                fill.width = int(bar.width * min(1.0, value / STAT_BAR_MAX))
                pygame.draw.rect(surface, common.JADE, fill, border_radius=5)
                if key in preview:
                    extra = bar.copy()
                    extra.left = fill.right
                    extra.width = max(2, int(bar.width * preview[key] / STAT_BAR_MAX))
                    pygame.draw.rect(surface, GREEN, extra, border_radius=5)
                num = self.font.render(str(value), True, common.TEXT_COLOR)
                surface.blit(num, (bar.right + 10, y))
                if key in preview:
                    plus = self.small.render(f"+{preview[key]}", True, GREEN)
                    surface.blit(plus, (bar.right + 56, y + 3))
                y += 34
            y += 6

    def _draw_log(self, surface: pygame.Surface) -> None:
        s = self.session
        rect = pygame.Rect(812, 86, 368, 396)
        self._panel(surface, rect, "수련 일지")
        y = rect.top + 38
        if self.hover_training:
            training = next(t for t in TRAININGS if t["id"] == self.hover_training)
            for line in common.wrap_text(training["desc"], self.small, rect.width - 32):
                surface.blit(self.small.render(line, True, common.ACCENT_COLOR), (rect.left + 16, y))
                y += 22
            y += 8
        for entry in s.history[-14:][::-1]:
            if y > rect.bottom - 26:
                break
            surface.blit(self.small.render(entry, True, common.TEXT_COLOR), (rect.left + 16, y))
            y += 24
