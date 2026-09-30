import { useState } from "preact/hooks";
import { getCharacter } from "../../data/characters";
import type { Shimdeuk } from "../../core/types";
import { STAT_KEYS, STAT_NAMES } from "../../core/types";
import { CharacterPortrait } from "../components";
import { ShimdeukSkillsView } from "./Result";

export function ShimdeukListScreen({ shimdeuks, onBack, onDelete }: { shimdeuks: Shimdeuk[]; onBack: () => void; onDelete: (id: string) => void }) {
  // 브라우저 확인창 대신 두 번 눌러 확인한다.
  const [armed, setArmed] = useState<string | null>(null);
  return (
    <div class="screen no-bar">
      <div class="row between">
        <h2>심득 보관함</h2>
        <button class="btn sm ghost" onClick={onBack}>뒤로</button>
      </div>
      {shimdeuks.length === 0 && <p class="dim">아직 완성한 심득이 없습니다.</p>}
      {[...shimdeuks].reverse().map((s) => {
        const c = getCharacter(s.characterId);
        return (
          <div class="card col" key={s.id}>
            <div class="row" style={{ gap: 10 }}>
              <CharacterPortrait character={c} size={36} />
              <div class="grow">
                <b>{s.name}</b>
                <div class="small dim">{c.name} · {s.grade} · {s.score}점</div>
              </div>
              {armed === s.id ? (
                <button class="btn sm danger" onClick={() => { onDelete(s.id); setArmed(null); }}>정말 버리기</button>
              ) : (
                <button class="btn sm ghost" onClick={() => setArmed(s.id)}>버리기</button>
              )}
            </div>
            <div class="row wrap small" style={{ gap: 10 }}>
              {STAT_KEYS.map((k) => <span key={k}>{STAT_NAMES[k]}(수련) {s.stats[k]}</span>)}
            </div>
            <ShimdeukSkillsView shimdeuk={s} />
          </div>
        );
      })}
    </div>
  );
}
