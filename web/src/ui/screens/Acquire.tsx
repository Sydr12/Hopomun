import { useState } from "preact/hooks";
import { getCharacter } from "../../data/characters";
import { SKILLS } from "../../data/skills";
import { TRAITS } from "../../data/traits";
import type { Acquired, TrainingState } from "../../core/training";
import { GradeBadge, Modal, SkillDetail, Sparks } from "../components";

const SLOT_LABEL = { active1: "액티브 스킬", active2: "액티브 스킬", passive1: "패시브 스킬", passive2: "패시브 스킬" } as const;

/** 보스 격파 보상: 스킬 3개 중 1개 선택 */
export function SkillChoice({ state, onChoose }: { state: TrainingState; onChoose: (i: number) => void }) {
  const choice = state.skillChoice!;
  const [selected, setSelected] = useState<number | null>(null);
  const tag = TRAITS[getCharacter(state.characterId).trait].tag;
  return (
    <Modal>
      <div class="col" style={{ alignItems: "center", gap: 2 }}>
        <span class="eyebrow">보스 격파 보상</span>
        <h2>{SLOT_LABEL[choice.slot]} 하나를 새긴다</h2>
        <p class="tiny faint">고른 스킬은 이번 심득에 담깁니다</p>
      </div>
      {choice.candidates.map((c, i) => (
        <button key={i} class={`card ${selected === i ? "selected" : ""}`} onClick={() => setSelected(i)}>
          <SkillDetail def={SKILLS[c.id]} grade={c.grade} traitTag={tag} />
        </button>
      ))}
      <button class="btn primary block" disabled={selected === null} onClick={() => selected !== null && onChoose(selected)}>이 스킬로 결정</button>
    </Modal>
  );
}

/** 스킬 획득 · 필살기 개안 · 스킬 진화 알림 */
export function AcquireModal({ acquired, onClose }: { acquired: Acquired; onClose: () => void }) {
  const def = SKILLS[acquired.id];
  const heading = acquired.kind === "ultimate" ? "필살기 개안(開眼)" : acquired.kind === "evolve" ? "스킬 진화" : "스킬 습득";
  return (
    <div class="overlay center" style={{ zIndex: 35 }}>
      <div class="modal acquire" style={{ position: "relative", overflow: "hidden" }}>
        <div class="ray" />
        <Sparks count={16} />
        <span class="eyebrow">{heading}</span>
        {acquired.kind === "evolve" ? (
          <div class="row" style={{ justifyContent: "center", gap: 10 }}>
            <GradeBadge grade={acquired.from!} lg />
            <span class="gold" style={{ fontSize: 22 }}>→</span>
            <GradeBadge grade={acquired.grade!} lg />
          </div>
        ) : acquired.kind === "ultimate" ? (
          <span class="chip gold" style={{ height: 26, fontSize: 13 }}>{acquired.level}단계</span>
        ) : (
          <GradeBadge grade={acquired.grade!} lg />
        )}
        <h1 style={{ color: "var(--gold)" }}>「{def.name}」</h1>
        <div style={{ width: "100%", textAlign: "left" }}>
          <SkillDetail def={def} hideName />
        </div>
        <button class="btn primary block" onClick={onClose}>확인</button>
      </div>
    </div>
  );
}
