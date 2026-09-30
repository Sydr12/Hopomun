"""pygame 실행기."""
from __future__ import annotations

from typing import List, Optional

import pygame

from ..models.character import Character
from . import common


class ScreenBase:
    def enter(self, app: "GameApp") -> None:
        """화면이 활성화될 때 호출된다."""

    def handle_event(self, event: pygame.event.Event, app: "GameApp") -> None:
        """입력 처리."""

    def update(self, dt: float, app: "GameApp") -> None:
        """상태 갱신."""

    def draw(self, surface: pygame.Surface, app: "GameApp") -> None:
        """렌더링."""


class GameApp:
    def __init__(self) -> None:
        pygame.init()
        pygame.display.set_caption("강호육성기")
        self.surface = pygame.display.set_mode(common.SCREEN_SIZE)
        self.clock = pygame.time.Clock()
        self.running = True
        self.hall_of_fame: List[Character] = []
        self.toast_message: Optional[str] = None
        self.toast_time = 0.0

        from .screens import TitleScreen

        self.active_screen: ScreenBase = TitleScreen()
        self.active_screen.enter(self)

    def change_screen(self, screen: ScreenBase) -> None:
        self.active_screen = screen
        screen.enter(self)

    def request_exit(self) -> None:
        self.running = False

    def set_toast(self, message: str, duration: float = 2.5) -> None:
        self.toast_message = message
        self.toast_time = duration

    def draw_toast(self) -> None:
        if not self.toast_message or self.toast_time <= 0:
            return
        text = common.load_font(22).render(self.toast_message, True, common.WHITE)
        rect = text.get_rect(center=(common.SCREEN_SIZE[0] // 2, common.SCREEN_SIZE[1] - 40))
        background = rect.inflate(24, 24)
        pygame.draw.rect(self.surface, common.SLATE, background, border_radius=12)
        pygame.draw.rect(self.surface, common.ACCENT_COLOR, background, width=2, border_radius=12)
        self.surface.blit(text, rect)

    def run(self) -> None:
        while self.running:
            dt = self.clock.tick(60) / 1000
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False
                    break
                self.active_screen.handle_event(event, self)
            self.active_screen.update(dt, self)
            self.surface.fill(common.BACKGROUND_COLOR)
            self.active_screen.draw(self.surface, self)
            if self.toast_message and self.toast_time > 0:
                self.toast_time -= dt
                self.draw_toast()
            else:
                self.toast_message = None
            pygame.display.flip()
        pygame.quit()


def run() -> None:
    GameApp().run()
