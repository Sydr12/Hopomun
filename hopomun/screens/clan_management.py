"""문파 관리 메뉴."""
from __future__ import annotations

from ..models.clan import Clan


class ClanManagementScreen:
    """문파에서 이용 가능한 시스템을 출력한다."""

    OPTIONS = {
        "1": "전투",
        "2": "수련",
        "3": "내정",
        "4": "등용문",
        "5": "종료",
    }

    def choose_system(self, clan: Clan) -> str:
        print("=" * 60)
        print(clan.describe())
        print("=" * 60)
        print("실행할 시스템을 선택하세요:")
        for key, label in self.OPTIONS.items():
            print(f"  {key}. {label}")
        while True:
            selection = input("선택 번호: ").strip()
            if selection in self.OPTIONS:
                return self.OPTIONS[selection]
            print("목록에 있는 번호를 입력해주세요.")

