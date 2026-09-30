"""pygame 기반 GUI 화면."""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, TYPE_CHECKING

import pygame

from ..data.constants import (
    ACTION_ICONS,
    DEFAULT_PROFILE_IMAGE,
    EMBLEM_MARKS,
    WEAPON_STRENGTHS,
)
from ..models.clan import Clan
from ..systems.recruitment import generate_candidates
from . import common

TOWN_BACKGROUND = "images/town.png"


class ScreenBase:
    """모든 GUI 화면의 기본 클래스."""

    def enter(self, app: "GameApp") -> None:
        """화면이 활성화될 때 호출된다."""

    def handle_event(self, event: pygame.event.Event, app: "GameApp") -> None:
        """사용자 입력을 처리한다."""

    def update(self, dt: float, app: "GameApp") -> None:
        """필요 시 상태를 갱신한다."""

    def draw(self, surface: pygame.Surface, app: "GameApp") -> None:
        """화면을 렌더링한다."""


class StartScreen(ScreenBase):
    def __init__(self) -> None:
        self.title_font: Optional[pygame.font.Font] = None
        self.subtitle_font: Optional[pygame.font.Font] = None
        self.hint_font: Optional[pygame.font.Font] = None
        self.background: Optional[pygame.Surface] = None

    def enter(self, app: "GameApp") -> None:
        self.title_font = common.load_brush_font(140)
        self.subtitle_font = common.load_brush_font(60)
        self.hint_font = common.load_brush_font(40)
        try:
            image = pygame.image.load(str(common.START_BACKGROUND_PATH)).convert()
            self.background = pygame.transform.smoothscale(image, common.SCREEN_SIZE)
        except (FileNotFoundError, pygame.error):
            self.background = None

    def handle_event(self, event: pygame.event.Event, app: "GameApp") -> None:
        if event.type == pygame.KEYDOWN and event.key in (pygame.K_RETURN, pygame.K_SPACE):
            app.change_screen(ClanSelectionScreen())
        elif event.type == pygame.MOUSEBUTTONDOWN:
            app.change_screen(ClanSelectionScreen())

    def draw(self, surface: pygame.Surface, app: "GameApp") -> None:
        if self.background:
            surface.blit(self.background, (0, 0))
        else:
            surface.fill(common.BACKGROUND_COLOR)

        overlay = pygame.Surface(common.SCREEN_SIZE, pygame.SRCALPHA)
        overlay.fill((0, 0, 0, common.OVERLAY_ALPHA))
        surface.blit(overlay, (0, 0))

        if not self.title_font or not self.subtitle_font or not self.hint_font:
            return

        center_x = surface.get_width() // 2
        center_y = surface.get_height() // 2

        title = self.title_font.render("호포문", True, common.ACCENT_COLOR)
        subtitle = self.subtitle_font.render("강호의 기록이 시작됩니다", True, common.TEXT_COLOR)
        hint = self.hint_font.render("엔터 또는 클릭으로 시작", True, common.TEXT_COLOR)

        surface.blit(title, title.get_rect(center=(center_x, center_y - 110)))
        surface.blit(subtitle, subtitle.get_rect(center=(center_x, center_y - 20)))
        surface.blit(hint, hint.get_rect(center=(center_x, center_y + 70)))


class ClanSelectionScreen(ScreenBase):
    COLUMNS = 3

    def __init__(self) -> None:
        self.stage: str = "name"
        self.name_input: str = "호포문"
        self.composition_text: str = ""
        self.selected_index: int = 0
        self.pending_click_index: Optional[int] = None
        self.double_click_timer: float = 0.0
        self.title_font: Optional[pygame.font.Font] = None
        self.text_font: Optional[pygame.font.Font] = None
        self.info_font: Optional[pygame.font.Font] = None
        self.mark_surfaces: List[pygame.Surface] = []
        self.mark_rects: List[pygame.Rect] = []
        self.name_confirm_rect: Optional[pygame.Rect] = None

    def enter(self, app: "GameApp") -> None:
        self.stage = "name"
        self.name_input = "호포문"
        self.composition_text = ""
        self.selected_index = 0
        self.pending_click_index = None
        self.double_click_timer = 0.0
        self.title_font = common.load_font(46)
        self.text_font = common.load_font(28)
        self.info_font = common.load_font(20)
        self._load_mark_surfaces()
        pygame.key.start_text_input()

    def _load_mark_surfaces(self) -> None:
        self.mark_surfaces = []
        for mark in EMBLEM_MARKS:
            path = common.ASSET_ROOT / mark["image"]
            try:
                image = pygame.image.load(str(path)).convert_alpha()
                surface = pygame.transform.smoothscale(image, (160, 160))
            except (FileNotFoundError, pygame.error):
                surface = pygame.Surface((160, 160), pygame.SRCALPHA)
                surface.fill((80, 80, 80, 255))
            self.mark_surfaces.append(surface)

    def _build_mark_rects(self, surface: pygame.Surface) -> List[pygame.Rect]:
        columns = self.COLUMNS
        card_w = 190
        card_h = 210
        gap = 30
        total_width = columns * card_w + (columns - 1) * gap
        start_x = max(40, (surface.get_width() - total_width) // 2)
        start_y = 230
        rects: List[pygame.Rect] = []
        for idx, _mark in enumerate(EMBLEM_MARKS):
            row = idx // columns
            col = idx % columns
            x = start_x + col * (card_w + gap)
            y = start_y + row * (card_h + gap)
            rects.append(pygame.Rect(x, y, card_w, card_h))
        return rects

    def handle_event(self, event: pygame.event.Event, app: "GameApp") -> None:
        if self.stage == "name":
            if event.type == pygame.TEXTINPUT:
                upcoming = self.name_input + self.composition_text + event.text
                if len(upcoming) <= 18:
                    self.name_input += event.text
                self.composition_text = ""
                return
            if event.type == pygame.TEXTEDITING:
                self.composition_text = event.text
                return
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_BACKSPACE:
                    if self.composition_text:
                        self.composition_text = ""
                    else:
                        self.name_input = self.name_input[:-1]
                elif event.key == pygame.K_RETURN:
                    self._confirm_name(app)
                elif event.key == pygame.K_ESCAPE:
                    pygame.key.stop_text_input()
                    app.change_screen(StartScreen())
            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                if self.name_confirm_rect and self.name_confirm_rect.collidepoint(event.pos):
                    self._confirm_name(app)
            return

        if event.type == pygame.KEYDOWN and self.stage == "emblem":
            mark_count = len(EMBLEM_MARKS)
            if event.key in (pygame.K_RIGHT, pygame.K_d):
                self.selected_index = (self.selected_index + 1) % mark_count
            elif event.key in (pygame.K_LEFT, pygame.K_a):
                self.selected_index = (self.selected_index - 1) % mark_count
            elif event.key in (pygame.K_DOWN, pygame.K_s):
                self.selected_index = (self.selected_index + self.COLUMNS) % mark_count
            elif event.key in (pygame.K_UP, pygame.K_w):
                self.selected_index = (self.selected_index - self.COLUMNS) % mark_count
            elif event.key == pygame.K_RETURN:
                self._finalize_clan(app)
            elif event.key == pygame.K_ESCAPE:
                self.stage = "name"
                pygame.key.start_text_input()
            return

        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1 and self.stage == "emblem":
            rects = self.mark_rects or self._build_mark_rects(app.surface)
            clicked_index = None
            for idx, rect in enumerate(rects):
                if rect.collidepoint(event.pos):
                    clicked_index = idx
                    break
            if clicked_index is not None:
                current_time = pygame.time.get_ticks() / 1000.0
                if self.pending_click_index == clicked_index and current_time - self.double_click_timer <= 0.4:
                    self.selected_index = clicked_index
                    self._finalize_clan(app)
                    self.pending_click_index = None
                else:
                    self.selected_index = clicked_index
                    self.pending_click_index = clicked_index
                    self.double_click_timer = current_time

    def update(self, dt: float, app: "GameApp") -> None:
        if self.stage == "emblem" and self.pending_click_index is not None:
            current_time = pygame.time.get_ticks() / 1000.0
            if current_time - self.double_click_timer > 0.4:
                self.pending_click_index = None

    def _confirm_name(self, app: "GameApp") -> None:
        candidate_name = (self.name_input + self.composition_text).strip()
        if candidate_name:
            self.name_input = candidate_name
            self.composition_text = ""
            self.stage = "emblem"
            pygame.key.stop_text_input()
        else:
            app.set_toast("문파 이름을 먼저 입력하세요.")

    def _finalize_clan(self, app: "GameApp") -> None:
        mark = EMBLEM_MARKS[self.selected_index]
        name = self.name_input.strip() or "호포문 문파"
        app.clan = Clan(name=name, emblem_id=mark["id"], emblem_path=mark["image"])
        app.set_toast("문양이 확정되었습니다.")
        app.change_screen(ClanManagementScreen())

    def draw(self, surface: pygame.Surface, app: "GameApp") -> None:
        surface.fill(common.BACKGROUND_COLOR)
        if not self.title_font or not self.text_font or not self.info_font:
            return

        margin = 120
        title = self.title_font.render("문파 창설", True, common.ACCENT_COLOR)
        surface.blit(title, (surface.get_width() // 2 - title.get_width() // 2, 60))

        if self.stage == "name":
            prompt = self.text_font.render("문파 이름을 입력한 뒤 확인 버튼을 누르세요.", True, common.TEXT_COLOR)
            surface.blit(prompt, (margin, 150))
            input_rect = pygame.Rect(margin, 195, surface.get_width() - margin * 2 - 140, 64)
            pygame.draw.rect(surface, common.PANEL_COLOR, input_rect, border_radius=8)
            composed = self.name_input + (self.composition_text or "")
            display_text = self.text_font.render(composed or "_", True, common.ACCENT_COLOR)
            surface.blit(display_text, (input_rect.left + 18, input_rect.top + 16))

            button_rect = pygame.Rect(input_rect.right + 20, input_rect.top, 120, 64)
            self.name_confirm_rect = button_rect
            is_hovered = button_rect.collidepoint(pygame.mouse.get_pos())
            common.draw_button(surface, button_rect, "확인", self.text_font, is_hovered=is_hovered)

            hint = self.info_font.render("Esc 키로 시작 화면으로 돌아갈 수 있습니다.", True, common.TEXT_COLOR)
            surface.blit(hint, (margin, 280))
        else:
            prompt = self.text_font.render("가문의 문양을 선택 후 더블클릭으로 확정하세요.", True, common.TEXT_COLOR)
            surface.blit(prompt, (margin, 160))
            self.mark_rects = self._build_mark_rects(surface)
            for idx, (rect, image_surface) in enumerate(zip(self.mark_rects, self.mark_surfaces)):
                is_selected = idx == self.selected_index
                pygame.draw.rect(surface, common.PANEL_COLOR, rect, border_radius=12)
                border_color = common.ACCENT_COLOR if is_selected else common.SLATE
                pygame.draw.rect(surface, border_color, rect, width=2, border_radius=12)

                img_rect = image_surface.get_rect(center=(rect.centerx, rect.top + 90))
                surface.blit(image_surface, img_rect)

            hint = self.info_font.render("마우스 클릭으로 선택, 더블클릭으로 확정합니다.", True, common.TEXT_COLOR)
            surface.blit(hint, (margin, self.mark_rects[-1].bottom + 20))


class ClanManagementScreen(ScreenBase):
    ICON_SIZE = 64
    ICON_GAP = 28

    def __init__(self) -> None:
        self.clan_name_font: Optional[pygame.font.Font] = None
        self.profile_surface: Optional[pygame.Surface] = None
        self.emblem_surface: Optional[pygame.Surface] = None
        self.town_surface: Optional[pygame.Surface] = None
        self.actions = ACTION_ICONS
        self.icon_surfaces: List[pygame.Surface] = []
        self.icon_rects: List[pygame.Rect] = []
        self.active_modal: Optional["RecruitmentModal"] = None

    def enter(self, app: "GameApp") -> None:
        self.clan_name_font = common.load_font(20)
        self.icon_surfaces = [self._create_icon_surface(action) for action in self.actions]
        self.icon_rects = []
        self.active_modal = None

        try:
            profile_path = common.ASSET_ROOT / DEFAULT_PROFILE_IMAGE
            image = pygame.image.load(str(profile_path)).convert_alpha()
            self.profile_surface = pygame.transform.smoothscale(image, (96, 96))
        except (FileNotFoundError, pygame.error):
            self.profile_surface = None

        self.emblem_surface = None
        if app.clan:
            path = common.ASSET_ROOT / app.clan.emblem_path
            try:
                image = pygame.image.load(str(path)).convert_alpha()
                self.emblem_surface = pygame.transform.smoothscale(image, (96, 96))
            except (FileNotFoundError, pygame.error):
                self.emblem_surface = None

        try:
            town_path = common.ASSET_ROOT / TOWN_BACKGROUND
            town_image = pygame.image.load(str(town_path)).convert()
            self.town_surface = pygame.transform.smoothscale(town_image, common.SCREEN_SIZE)
        except (FileNotFoundError, pygame.error):
            self.town_surface = None

    def _create_icon_surface(self, action: dict) -> pygame.Surface:
        size = self.ICON_SIZE
        surface = pygame.Surface((size, size), pygame.SRCALPHA)
        color = action.get("color", (120, 120, 120))
        pygame.draw.circle(surface, color, (size // 2, size // 2), size // 2)
        fg = common.WHITE
        cx, cy = size // 2, size // 2
        action_id = action.get("id", "")
        if action_id == "battle":
            pygame.draw.line(surface, fg, (cx - 14, cy - 10), (cx + 14, cy + 10), 3)
            pygame.draw.line(surface, fg, (cx + 14, cy - 10), (cx - 14, cy + 10), 3)
        elif action_id == "training":
            pygame.draw.circle(surface, fg, (cx, cy - 10), 8, 2)
            pygame.draw.rect(surface, fg, pygame.Rect(cx - 16, cy + 2, 32, 12), 2, border_radius=4)
        elif action_id == "administration":
            for i, width in enumerate((30, 22, 14)):
                pygame.draw.rect(surface, fg, pygame.Rect(cx - width // 2, cy - 18 + i * 12, width, 6), 2, border_radius=2)
        elif action_id == "recruitment":
            pygame.draw.circle(surface, fg, (cx, cy - 6), 10, 2)
            pygame.draw.line(surface, fg, (cx, cy + 2), (cx, cy + 20), 3)
            pygame.draw.line(surface, fg, (cx - 10, cy + 12), (cx + 10, cy + 12), 3)
        elif action_id == "exit":
            pygame.draw.line(surface, fg, (cx - 12, cy - 12), (cx + 12, cy + 12), 4)
            pygame.draw.line(surface, fg, (cx + 12, cy - 12), (cx - 12, cy + 12), 4)
        return surface

    def handle_event(self, event: pygame.event.Event, app: "GameApp") -> None:
        if self.active_modal:
            self.active_modal.handle_event(event)
            return

        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            for action, rect in zip(self.actions, self.icon_rects):
                if rect.collidepoint(event.pos):
                    self._trigger_action(action, app)
                    break
        elif event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
            app.request_exit()

    def update(self, dt: float, app: "GameApp") -> None:
        if self.active_modal:
            self.active_modal.update(dt)

    def draw(self, surface: pygame.Surface, app: "GameApp") -> None:
        if self.town_surface:
            surface.blit(self.town_surface, (0, 0))
        else:
            surface.fill(common.BACKGROUND_COLOR)

        padding = 30
        mouse_pos = pygame.mouse.get_pos()

        icon_total_width = len(self.actions) * self.ICON_SIZE + (len(self.actions) - 1) * self.ICON_GAP
        start_x = max(padding * 2 + self.ICON_SIZE, (surface.get_width() - icon_total_width) // 2)
        icon_y = padding + 10
        self.icon_rects = []
        hover_label: Optional[str] = None
        hover_rect: Optional[pygame.Rect] = None

        for idx, (action, icon_surface) in enumerate(zip(self.actions, self.icon_surfaces)):
            x = start_x + idx * (self.ICON_SIZE + self.ICON_GAP)
            rect = pygame.Rect(x, icon_y, self.ICON_SIZE, self.ICON_SIZE)
            if rect.right > surface.get_width() - padding:
                rect.x = surface.get_width() - padding - self.ICON_SIZE
            self.icon_rects.append(rect)
            if rect.collidepoint(mouse_pos):
                pygame.draw.rect(surface, common.ACCENT_COLOR, rect.inflate(12, 12), width=2, border_radius=12)
                hover_label = action.get("label", "")
                hover_rect = rect
            surface.blit(icon_surface, rect)

        if hover_label and hover_rect and self.clan_name_font:
            tooltip = self.clan_name_font.render(hover_label, True, common.TEXT_COLOR)
            bg_rect = tooltip.get_rect(midtop=(hover_rect.centerx, hover_rect.bottom + 12))
            bg_rect.inflate_ip(14, 8)
            pygame.draw.rect(surface, common.PANEL_COLOR, bg_rect, border_radius=6)
            pygame.draw.rect(surface, common.ACCENT_COLOR, bg_rect, width=1, border_radius=6)
            surface.blit(tooltip, tooltip.get_rect(center=bg_rect.center))

        if self.profile_surface:
            profile_rect = self.profile_surface.get_rect(topleft=(padding, padding))
            pygame.draw.circle(surface, common.SLATE, profile_rect.center, profile_rect.width // 2 + 6, 2)
            surface.blit(self.profile_surface, profile_rect)

        if self.emblem_surface and self.clan_name_font and app.clan:
            emblem_rect = self.emblem_surface.get_rect(topright=(surface.get_width() - padding, padding))
            pygame.draw.circle(surface, common.ACCENT_COLOR, emblem_rect.center, emblem_rect.width // 2 + 4, 2)
            surface.blit(self.emblem_surface, emblem_rect)
            name_surface = self.clan_name_font.render(app.clan.name, True, common.TEXT_COLOR)
            name_rect = name_surface.get_rect(center=(emblem_rect.centerx, emblem_rect.bottom + 18))
            surface.blit(name_surface, name_rect)

        if self.active_modal:
            overlay = pygame.Surface(surface.get_size(), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 150))
            surface.blit(overlay, (0, 0))
            self.active_modal.draw(surface)

    def _trigger_action(self, action: dict, app: "GameApp") -> None:
        action_id = action["id"]
        if action_id == "recruitment":
            app.change_screen(RecruitmentScreen())
        elif action_id == "training":
            from .training_screens import DiscipleSelectScreen

            app.change_screen(DiscipleSelectScreen())
        elif action_id == "exit":
            app.request_exit()
        else:
            app.set_toast(f"{action['label']} 시스템은 준비 중입니다.")

    def _open_recruitment_modal(self, app: "GameApp") -> None:
        self.active_modal = RecruitmentModal(on_close=self._close_modal)

    def _close_modal(self) -> None:
        self.active_modal = None


class RecruitmentModal:
    WIDTH = 480
    HEIGHT = 320

    def __init__(self, on_close) -> None:
        self.on_close = on_close
        self.font = common.load_font(26)
        self.small_font = common.load_font(18)
        self.close_rect: Optional[pygame.Rect] = None

    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
            self.on_close()
        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.close_rect and self.close_rect.collidepoint(event.pos):
                self.on_close()

    def update(self, dt: float) -> None:
        del dt

    def draw(self, surface: pygame.Surface) -> None:
        modal_rect = pygame.Rect(0, 0, self.WIDTH, self.HEIGHT)
        modal_rect.center = (surface.get_width() // 2, surface.get_height() // 2)
        pygame.draw.rect(surface, (24, 28, 36), modal_rect, border_radius=16)
        pygame.draw.rect(surface, common.ACCENT_COLOR, modal_rect, width=2, border_radius=16)

        title = self.font.render("등용문", True, common.ACCENT_COLOR)
        surface.blit(title, title.get_rect(midtop=(modal_rect.centerx, modal_rect.top + 24)))

        message = self.small_font.render("등용문 시스템은 준비 중입니다.", True, common.TEXT_COLOR)
        surface.blit(message, message.get_rect(center=modal_rect.center))

        button_rect = pygame.Rect(0, 0, 120, 44)
        button_rect.center = (modal_rect.centerx, modal_rect.bottom - 50)
        self.close_rect = button_rect
        hover = button_rect.collidepoint(pygame.mouse.get_pos())
        common.draw_button(surface, button_rect, "닫기", self.small_font, base_color=common.SLATE, hover_color=common.ACCENT_COLOR, is_hovered=hover)


@dataclass
class CandidateCard:
    character: "Character"
    rect: pygame.Rect


class RecruitmentScreen(ScreenBase):
    def __init__(self) -> None:
        self.title_font: Optional[pygame.font.Font] = None
        self.card_font: Optional[pygame.font.Font] = None
        self.small_font: Optional[pygame.font.Font] = None
        self.candidates: List[CandidateCard] = []
        self.back_rect: Optional[pygame.Rect] = None

    def enter(self, app: "GameApp") -> None:
        self.title_font = common.load_font(46)
        self.card_font = common.load_font(24)
        self.small_font = common.load_font(18)
        self.candidates = []
        card_width = 260
        card_height = 320
        spacing = 30
        start_x = (common.SCREEN_SIZE[0] - (card_width * 3 + spacing * 2)) // 2
        cards = generate_candidates()
        for idx, candidate in enumerate(cards):
            rect = pygame.Rect(start_x + idx * (card_width + spacing), 170, card_width, card_height)
            self.candidates.append(CandidateCard(candidate, rect))
        self.back_rect = pygame.Rect(40, common.SCREEN_SIZE[1] - 70, 140, 50)

    def handle_event(self, event: pygame.event.Event, app: "GameApp") -> None:
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.back_rect and self.back_rect.collidepoint(event.pos):
                app.change_screen(ClanManagementScreen())
                return
            for card in self.candidates:
                if card.rect.collidepoint(event.pos):
                    if app.clan:
                        app.clan.add_member(card.character)
                        app.set_toast(f"{card.character.name}이(가) 문파에 합류했습니다.")
                    app.change_screen(ClanManagementScreen())
                    break
        elif event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
            app.change_screen(ClanManagementScreen())

    def draw(self, surface: pygame.Surface, app: "GameApp") -> None:
        surface.fill(common.BACKGROUND_COLOR)
        if not self.title_font or not self.card_font or not self.small_font:
            return

        title = self.title_font.render("문파원 영입", True, common.ACCENT_COLOR)
        surface.blit(title, (surface.get_width() // 2 - title.get_width() // 2, 60))

        mouse_pos = pygame.mouse.get_pos()
        for card in self.candidates:
            is_hovered = card.rect.collidepoint(mouse_pos)
            pygame.draw.rect(surface, common.PANEL_COLOR, card.rect, border_radius=12)
            border_color = common.ACCENT_COLOR if is_hovered else common.SLATE
            pygame.draw.rect(surface, border_color, card.rect, width=2, border_radius=12)

            y = card.rect.top + 16
            lines = card.character.describe().splitlines()
            for line in lines:
                rendered = self.card_font.render(line, True, common.TEXT_COLOR)
                surface.blit(rendered, (card.rect.left + 14, y))
                y += 28

            advantage = WEAPON_STRENGTHS.get(card.character.weapon)
            if advantage:
                adv_text = self.small_font.render(
                    f"{card.character.weapon} ▶ {advantage} 상성 우위 (치명/회피 +30%)",
                    True,
                    common.GOLD,
                )
                surface.blit(adv_text, (card.rect.left + 14, card.rect.bottom - 44))

            hint_text = self.small_font.render("클릭하여 영입", True, common.TEXT_COLOR)
            surface.blit(hint_text, (card.rect.centerx - hint_text.get_width() // 2, card.rect.bottom - 24))

        if self.back_rect:
            is_hovered = self.back_rect.collidepoint(mouse_pos)
            common.draw_button(
                surface,
                self.back_rect,
                "뒤로",
                self.card_font,
                is_hovered=is_hovered,
                base_color=common.SLATE,
            )


if TYPE_CHECKING:
    from ..models.character import Character
    from .app import GameApp
