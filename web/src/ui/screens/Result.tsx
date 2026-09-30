import { getCharacter } from "../../data/characters";
import { SKILLS } from "../../data/skills";
import type { Shimdeuk } from "../../core/types";
import { STAT_KEYS, STAT_NAMES } from "../../core/types";
import { CharacterPortrait, GradeBadge, skillName } from "../components";

const GRADE_COLORS: Record<string, string> = { 범품: "#8a8178", 정품: "#7ea6c9", 상품: "#7fb77e", 절품: "#b48be0", 신품: "#d4af5f" };

export function ShimdeukSkillsView({ shimdeuk }: { shimdeuk: Shimdeuk }) {
  const c = getCharacter(shimdeuk.characterId);
  const rows: [string, string | undefined, string | undefined][] = [
    ["기본", c.basicSkill, undefined],
    ["액티브1", shimdeuk.skills.active1?.id, shimdeuk.skills.active1?.grade],
    ["액티브2", shimdeuk.skills.active2?.id, shimdeuk.skills.active2?.grade],
    ["필살기", shimdeuk.skills.ultimate?.id, shimdeuk.skills.ultimate ? String(shimdeuk.skills.ultimate.level) : undefined],
    ["패시브1", shimdeuk.skills.passive1?.id, shimdeuk.skills.passive1?.grade],
    ["패시브2", shimdeuk.skills.passive2?.id, shimdeuk.skills.passive2?.grade],
  ];
  return (
    <div class="col" style={{ gap: 4 }}>
      {rows.map(([label, id, grade]) => (
        <div class="row small" key={label}>
          <span class="faint" style={{ width: 52 }}>{label}</span>
          {id ? (
            <>
              {grade && (label === "필살기" ? <span class="chip gold">{grade}단계</span> : <GradeBadge grade={grade} />)}
              <span>{skillName(id)}</span>
              <span class="faint grow" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{SKILLS[id]?.desc}</span>
            </>
          ) : (
            <span class="faint">—</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function ResultScreen({ shimdeuk, stored, onDone }: { shimdeuk: Shimdeuk; stored: boolean; onDone: () => void }) {
  const c = getCharacter(shimdeuk.characterId);
  const color = GRADE_COLORS[shimdeuk.grade];
  return (
    <div class="screen">
      <p class="dim small" style={{ margin: 0, textAlign: "center" }}>수련 종료</p>
      <div class="card col" style={{ alignItems: "center", textAlign: "center", borderColor: color }}>
        <CharacterPortrait character={c} size={88} />
        <h1 style={{ color }}>{shimdeuk.name}</h1>
        <div class="row" style={{ justifyContent: "center" }}>
          <span class="chip" style={{ color, borderColor: color, fontSize: 16, padding: "2px 14px" }}>{shimdeuk.grade}</span>
          <span class="chip">{shimdeuk.score}점</span>
        </div>
        <p class="small dim" style={{ margin: 0 }}>
          {c.name} · 보스 {shimdeuk.bossesDefeated}/4 격파 · 최종 시험 {shimdeuk.finalTest === "win" ? "통과" : shimdeuk.finalTest === "lose" ? "실패" : "미응시"}
        </p>
      </div>
      <div class="card col">
        <h3>심득 수련 스탯</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {STAT_KEYS.map((k) => (
            <div key={k} class={`col ${(k === "outer" || k === "inner") && k !== c.attackType ? "faint" : ""}`} style={{ gap: 0, alignItems: "center" }}>
              <span class="tiny dim">{STAT_NAMES[k]}</span>
              <b class="num" style={{ fontSize: 17 }}>{shimdeuk.stats[k]}</b>
              <span class="tiny faint num">적용 시 {c.baseStats[k] + shimdeuk.stats[k]}</span>
            </div>
          ))}
        </div>
        <p class="tiny faint">심득을 적용하면 기본 스탯에 수련 스탯이 더해집니다 (팀전 등 수련 밖에서 적용).</p>
      </div>
      <div class="card col">
        <h3>스킬</h3>
        <ShimdeukSkillsView shimdeuk={shimdeuk} />
      </div>
      <p class="small dim" style={{ textAlign: "center", margin: 0 }}>
        {stored ? "심득 보관함에 저장되었습니다." : "보관함이 가득 찼습니다 (캐릭터당 5개). 보관함에서 정리한 뒤 다시 수련하세요."}
      </p>
      <div class="bottom-bar">
        <button class="btn primary" onClick={onDone}>처음으로</button>
      </div>
    </div>
  );
}
