"""CLI entry point retained for text-mode demo."""
from __future__ import annotations

from .screens.start_screen import StartScreen
from .screens.clan_selection import ClanSelectionScreen
from .screens.clan_management import ClanManagementScreen
from .screens.recruitment_screen import RecruitmentScreen
from .screens.training_screen import TrainingScreen


def main() -> None:
    """Run the original CLI demo flow."""
    StartScreen().show()

    selection_screen = ClanSelectionScreen()
    clan = selection_screen.prompt_for_clan()

    management_screen = ClanManagementScreen()
    recruitment_screen = RecruitmentScreen()
    training_screen = TrainingScreen()

    while True:
        choice = management_screen.choose_system(clan)
        if choice == "등용문":
            recruitment_screen.recruit_member(clan)
        elif choice == "수련":
            training_screen.run(clan)
        elif choice == "종료":
            print("Farewell, grand master.")
            break
        else:
            print(f"The {choice} system is under construction.\n")


if __name__ == "__main__":
    main()
