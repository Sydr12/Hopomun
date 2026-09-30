"""GUI 공용 유틸리티."""
from __future__ import annotations

from pathlib import Path
from typing import Iterable, Tuple

import pygame

Color = Tuple[int, int, int]

WHITE: Color = (245, 245, 245)
BLACK: Color = (20, 20, 20)
GOLD: Color = (207, 181, 59)
JADE: Color = (34, 139, 116)
CRIMSON: Color = (178, 34, 34)
SLATE: Color = (47, 79, 79)

SCREEN_SIZE = (1200, 675)
BACKGROUND_COLOR = (18, 24, 32)
PANEL_COLOR = (32, 42, 54)
TEXT_COLOR = WHITE
ACCENT_COLOR = GOLD
OVERLAY_ALPHA = 160

PACKAGE_ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = PACKAGE_ROOT / "data"
FONT_PATH = ASSET_ROOT / "font" / "NanumBarunGothicBold.ttf"
BRUSH_FONT_PATH = ASSET_ROOT / "font" / "NanumBrush.ttf"
START_BACKGROUND_PATH = ASSET_ROOT / "images" / "start_background.png"


def load_font(size: int) -> pygame.font.Font:
    """본문용 나눔바른고딕 폰트 로더."""
    try:
        return pygame.font.Font(str(FONT_PATH), size)
    except FileNotFoundError:
        return pygame.font.Font(None, size)


def load_brush_font(size: int) -> pygame.font.Font:
    """시작 화면에 사용할 나눔브러시 폰트 로더."""
    try:
        return pygame.font.Font(str(BRUSH_FONT_PATH), size)
    except FileNotFoundError:
        return pygame.font.Font(None, size)


def render_multiline(
    surface: pygame.Surface,
    lines: Iterable[str],
    font: pygame.font.Font,
    color: Color,
    start_pos: Tuple[int, int],
    line_height: int,
) -> None:
    """여러 줄 텍스트를 일정 간격으로 그린다."""
    x, y = start_pos
    for line in lines:
        text_surf = font.render(line, True, color)
        surface.blit(text_surf, (x, y))
        y += line_height


def draw_button(
    surface: pygame.Surface,
    rect: pygame.Rect,
    label: str,
    font: pygame.font.Font,
    *,
    base_color: Color = PANEL_COLOR,
    hover_color: Color = SLATE,
    text_color: Color = WHITE,
    is_hovered: bool = False,
) -> None:
    """간단한 버튼을 그린다."""
    pygame.draw.rect(surface, hover_color if is_hovered else base_color, rect, border_radius=8)
    text = font.render(label, True, text_color)
    text_rect = text.get_rect(center=rect.center)
    surface.blit(text, text_rect)


def wrap_text(text: str, font: pygame.font.Font, max_width: int) -> list:
    """주어진 폭에 맞게 글자 단위로 줄을 나눈다 (한글은 공백이 적어 글자 단위가 자연스럽다)."""
    lines = []
    for paragraph in text.split("\n"):
        current = ""
        for char in paragraph:
            trial = current + char
            if font.size(trial)[0] > max_width and current:
                lines.append(current)
                current = char.lstrip()
            else:
                current = trial
        lines.append(current)
    return lines
