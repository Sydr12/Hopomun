import { useState } from "preact/hooks";
import { START_SILVER } from "../../data/balance";
import { getCharacter } from "../../data/characters";
import { FACTIONS } from "../../data/factions";
import { SKILLS } from "../../data/skills";
import { TRAITS } from "../../data/traits";
import { STAT_KEYS, STAT_NAMES } from "../../core/types";
import { CharacterBust } from "../art";
import { SkillDetail, TraitLine } from "../components";

function wealth(silver: number): { label: string; cls: string } {
  if (silver === 0) return { label: "빈털터리 · 은자 0", cls: "red" };
  if (silver > START_SILVER) return { label: `부유 · 은자 ${silver}`, cls: "gold" };
  return { label: `은자 ${silver}`, cls: "" };
}

export function PickScreen({ candidates, onPick, onBack }: { candidates: string[]; onPick: (id: string) => void; onBack: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div class="screen">
      <div class="row between">
        <div><span class="eyebrow">입문 · 제자 선발</span><h2>누구를 받아들일까</h2></div>
        <button class="btn ghost sm" onClick={onBack}>뒤로</button>
      </div>
      {candidates.map((id) => {
        const c = getCharacter(id);
        const w = wealth(c.startSilver ?? START_SILVER);
        const open = selected === id;
        return (
          <button class={`card ${open ? "selected" : ""}`} key={id} onClick={() => setSelected(id)} style={{ padding: 0, overflow: "hidden" }}>
            <div class="row" style={{ alignItems: "stretch", gap: 0 }}>
              <div style={{ position: "relative", width: 92, minHeight: 104, flexShrink: 0, background: "rgba(0,0,0,.25)" }}>
                <CharacterBust characterId={id} className="fill" />
              </div>
              <div class="col grow" style={{ padding: "10px 12px", gap: 4 }}>
                <div class="row between">
                  <h3>{c.name}</h3>
                  <span class="chip" style={{ color: FACTIONS[c.faction].color }}>{FACTIONS[c.faction].name} · {c.sect}</span>
                </div>
                <div class="row wrap" style={{ gap: 4 }}>
                  <span class="chip gold">{c.attackType === "outer" ? "외공" : "내공"}</span>
                  <span class="chip">천성 {TRAITS[c.trait].name.split("(")[0]}</span>
                  <span class="chip">신법 {c.agility}</span>
                  <span class={`chip ${w.cls}`}>{w.label}</span>
                </div>
                <p class="tiny dim">{c.intro}</p>
              </div>
            </div>
            {open && (
              <div class="col" style={{ padding: "0 12px 12px", gap: 8 }}>
                <TraitLine character={c} />
                <SkillDetail def={SKILLS[c.basicSkill]} />
                <div class="row wrap tiny" style={{ gap: 10 }}>
                  {STAT_KEYS.map((k) => (
                    <span key={k} class={(k === "outer" || k === "inner") && k !== c.attackType ? "faint" : ""}>
                      {STAT_NAMES[k]} <b class="num">{c.baseStats[k]}</b><span class="faint"> +수련 {c.trainingStart[k]}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </button>
        );
      })}
      <div class="bottom-bar">
        <button class="btn primary" disabled={!selected} onClick={() => selected && onPick(selected)}>
          {selected ? `${getCharacter(selected).name}을(를) 제자로 받는다` : "제자를 고르세요"}
        </button>
      </div>
    </div>
  );
}
