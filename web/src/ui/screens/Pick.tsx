import { useState } from "preact/hooks";
import { getCharacter } from "../../data/characters";
import { FACTIONS } from "../../data/factions";
import { TRAITS } from "../../data/traits";
import { STAT_KEYS, STAT_NAMES } from "../../core/types";
import { CharacterPortrait, skillName } from "../components";

export function PickScreen({ candidates, onPick, onBack }: { candidates: string[]; onPick: (id: string) => void; onBack: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div class="screen">
      <div class="row between">
        <h2>제자 선발</h2>
        <button class="btn sm ghost" onClick={onBack}>뒤로</button>
      </div>
      <p class="dim small" style={{ margin: 0 }}>문하에 들기를 청하는 세 사람. 한 명을 골라 수련을 시작합니다.</p>
      {candidates.map((id) => {
        const c = getCharacter(id);
        const trait = TRAITS[c.trait];
        return (
          <button class={`card ${selected === id ? "selected" : ""}`} key={id} onClick={() => setSelected(id)}>
            <div class="row" style={{ alignItems: "flex-start", gap: 12 }}>
              <CharacterPortrait character={c} />
              <div class="grow col" style={{ gap: 4 }}>
                <div class="row between">
                  <h3>{c.name}</h3>
                  <span class="chip" style={{ color: FACTIONS[c.faction].color }}>{FACTIONS[c.faction].name} · {c.sect}</span>
                </div>
                <div class="row wrap" style={{ gap: 4 }}>
                  <span class="chip gold">{c.attackType === "outer" ? "외공" : "내공"} 계열</span>
                  <span class="chip">신법 {c.agility}</span>
                  <span class="chip">천성 {trait.name.split("(")[0]}</span>
                </div>
                <p class="small dim" style={{ margin: 0 }}>{c.intro}</p>
              </div>
            </div>
            {selected === id && (
              <div class="col" style={{ marginTop: 10, gap: 6 }}>
                <p class="small" style={{ margin: 0 }}><b class="gold">{trait.name}</b> {trait.desc}</p>
                <p class="small faint" style={{ margin: 0 }}>공명: {trait.resonance}</p>
                <p class="small" style={{ margin: 0 }}>기본기 「{skillName(c.basicSkill)}」</p>
                <div class="row wrap small" style={{ gap: 10 }}>
                  {STAT_KEYS.map((k) => (
                    <span key={k} class={(k === "outer" || k === "inner") && k !== c.attackType ? "faint" : ""}>
                      {STAT_NAMES[k]} {c.baseStats[k]}<span class="faint">+{c.trainingStart[k]}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </button>
        );
      })}
      <div class="action-bar single">
        <button class="btn primary" disabled={!selected} onClick={() => selected && onPick(selected)}>
          {selected ? `${getCharacter(selected).name}을(를) 제자로 받는다` : "제자를 고르세요"}
        </button>
      </div>
    </div>
  );
}
