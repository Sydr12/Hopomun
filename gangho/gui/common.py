"""GUI 공용 유틸리티."""
from __future__ import annotations

from pathlib import Path
from typing import List, Tuple

import pygame

Color = Tuple[int, int, int]

WHITE: Color = (245, 245, 245)
BLACK: Color = (20, 20, 20)
GOLD: Color = (207, 181, 59)
JADE: Color = (34, 139, 116)
SLATE: Color = (47, 79, 79)

SCREEN_SIZE = (1200, 675)
BACKGROUND_COLOR: Color = (18, 24, 32)
PANEL_COLOR: Color = (32, 42, 54)
TEXT_COLOR = WHITE
ACCENT_COLOR = GOLD

ASSET_ROOT = Path(__file__).resolve().parents[1] / "assets"
FONT_PATH = ASSET_ROOT / "font" / "NanumBarunGothicBold.ttf"
BRUSH_FONT_PATH = ASSET_ROOT / "font" / "NanumBrush.ttf"

_font_cache: dict = {}


def _load(path: Path, size: int) -> pygame.font.Font:
    key = (path, size)
    if key not in _font_cache:
        try:
            _font_cache[key] = pygame.font.Font(str(path), size)
        except (FileNotFoundError, OSError):
            _font_cache[key] = pygame.font.Font(None, size)
    return _font_cache[key]


def load_font(size: int) -> pygame.font.Font:
    return _load(FONT_PATH, size)


def load_brush_font(size: int) -> pygame.font.Font:
    return _load(BRUSH_FONT_PATH, size)


def wrap_text(text: str, font: pygame.font.Font, max_width: int) -> List[str]:
    """주어진 폭에 맞게 글자 단위로 줄을 나눈다."""
    lines: List[str] = []
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
