import type { GameSave } from "../save";
import { getCharacter } from "../../data/characters";

export function TitleScreen({ save, onNew, onContinue, onShimdeuks }: {
  save: GameSave; onNew: () => void; onContinue: () => void; onShimdeuks: () => void;
}) {
  const inProgress = save.training && save.training.phase !== "done" ? save.training : null;
  return (
    <div class="screen no-bar">
      <div class="title-hero">
        <div class="seal">心得</div>
        <h1>강호육성기</h1>
        <p class="dim" style={{ margin: 0 }}>네 명의 제자, 마흔두 번의 수련</p>
      </div>
      <div class="col">
        {inProgress && (
          <button class="btn primary block" onClick={onContinue}>
            이어하기 · {getCharacter(inProgress.characterId).name} {inProgress.turn}턴
          </button>
        )}
        <button class={`btn block ${inProgress ? "" : "primary"}`} onClick={onNew}>새 수련 시작</button>
        <button class="btn block ghost" onClick={onShimdeuks}>심득 보관함 ({save.shimdeuks.length})</button>
      </div>
      <p class="small faint" style={{ textAlign: "center" }}>개발 버전 · 수련 코어 테스트용 (팀 운영은 다음 단계)</p>
    </div>
  );
}
