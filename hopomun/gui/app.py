"""pygame 기반 게임 실행기."""
from __future__ import annotations

from typing import Optional

import pygame

from . import common
from .screens import ScreenBase, StartScreen


class GameApp:
    """화면 전환과 공용 상태를 관리한다."""

    def __init__(self) -> None:
        pygame.init()
        pygame.display.set_caption("호포문")
        self.surface = pygame.display.set_mode(common.SCREEN_SIZE)
        self.clock = pygame.time.Clock()
        self.running = True

        self.active_screen: ScreenBase = StartScreen()
        self.active_screen.enter(self)

        self.clan = None
        self.toast_message: Optional[str] = None
        self.toast_time: float = 0.0
        self.toast_font = common.load_font(22)

    def change_screen(self, screen: ScreenBase) -> None:
        """새 화면으로 전환한다."""
        self.active_screen = screen
        screen.enter(self)

    def request_exit(self) -> None:
        """메인 루프 종료를 요청한다."""
        self.running = False

    def set_toast(self, message: str, duration: float = 2.0) -> None:
        """일시적으로 표시할 토스트 메시지를 설정한다."""
        self.toast_message = message
        self.toast_time = duration

    def draw_toast(self) -> None:
        if not self.toast_message or self.toast_time <= 0:
            return
        text = self.toast_font.render(self.toast_message, True, common.WHITE)
        padding = 12
        rect = text.get_rect()
        rect.center = (common.SCREEN_SIZE[0] // 2, common.SCREEN_SIZE[1] - 40)
        background = pygame.Rect(
            rect.left - padding,
            rect.top - padding,
            rect.width + padding * 2,
            rect.height + padding * 2,
        )
        pygame.draw.rect(self.surface, common.SLATE, background, border_radius=12)
        pygame.draw.rect(self.surface, common.ACCENT_COLOR, background, width=2, border_radius=12)
        self.surface.blit(text, rect)

    def run(self) -> None:
        """메인 루프."""
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
    """패키지 진입점에서 사용하는 실행 함수."""
    GameApp().run()
