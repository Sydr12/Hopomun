/** 심득(心得): 수련 1회의 결과물. 이름 · 점수 · 등급 · 종료 보상 · 보관. */
import { GRADE_REWARDS, GRADE_THRESHOLDS } from "../data/balance";
import { getCharacter } from "../data/characters";
import { getRegion } from "../data/regions";
import type { CharacterBuild } from "./combatants";
import { defaultPriority } from "./combatants";
import type { Rng } from "./rng";
import type { TrainingState } from "./training";
import type { Shimdeuk, ShimdeukGrade, SkillGrade } from "./types";
import { STAT_KEYS } from "./types";

export const SHIMDEUK_SLOTS = 5;

const GRADE_POINTS: Record<SkillGrade, number> = { C: 10, B: 20, A: 35, S: 60 };
const NEXT_GRADE: Record<SkillGrade, SkillGrade> = { C: "B", B: "A", A: "S", S: "S" };

/** 이름: 최고급 + 고급 지역. 도달하지 못했으면 도달한 가장 높은 두 지역. */
export function shimdeukName(regionIds: string[]): string {
  const sorted = regionIds.map(getRegion).sort((a, b) => b.tier - a.tier);
  const parts = sorted.slice(0, 2).map((r) => r.short);
  return `${parts.join("")} 심득`;
}

export function scoreOf(state: TrainingState): number {
  const statGain = STAT_KEYS.reduce((sum, k) => sum + (state.stats[k] - state.startStats[k]), 0);
  const skillPoints = (["active1", "passive1", "active2", "passive2"] as const)
    .map((slot) => state.skills[slot])
    .reduce((sum, s) => sum + (s ? GRADE_POINTS[s.grade] : 0), 0);
  const bossPoints = state.bossesDefeated * 50;
  const finalPoints = state.finalTest === "win" ? 100 : state.finalTest === "lose" ? 30 : 0;
  return Math.max(0, Math.round(statGain + skillPoints + bossPoints + finalPoints));
}

export function gradeOf(score: number): ShimdeukGrade {
  return (GRADE_THRESHOLDS.find(([min]) => score >= min) ?? GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1])[1];
}

/** 수련 종료: 점수 · 등급 산정 후 등급 보상(스탯 · 스킬 업그레이드) 적용 */
export function finalizeShimdeuk(state: TrainingState, rng: Rng): Shimdeuk {
  const score = scoreOf(state);
  const grade = gradeOf(score);
  const reward = GRADE_REWARDS[grade];
  const stats = { ...state.stats };
  for (const key of STAT_KEYS) stats[key] = Math.round(stats[key] * (1 + reward.statPct));

  const skills = structuredClone(state.skills);
  for (const slot of ["active1", "passive1", "active2", "passive2"] as const) {
    const skill = skills[slot];
    if (skill && skill.grade !== "S" && rng.chance(reward.skillUp)) skill.grade = NEXT_GRADE[skill.grade];
  }
  if (skills.ultimate && skills.ultimate.level === 1 && rng.chance(reward.ultUp)) skills.ultimate.level = 2;

  const character = getCharacter(state.characterId);
  return {
    id: `${state.characterId}-${state.seed}`,
    characterId: state.characterId,
    name: state.regions.length ? shimdeukName(state.regions) : "미완의 심득",
    stats,
    skills,
    priority: defaultPriority(skills, character.basicSkill),
    regions: [...state.regions],
    bossesDefeated: state.bossesDefeated,
    finalTest: state.finalTest,
    score,
    grade,
    seed: state.seed,
  };
}

/** 심득을 전투용 빌드로 */
export function buildFromShimdeuk(shimdeuk: Shimdeuk): CharacterBuild {
  return {
    characterId: shimdeuk.characterId,
    trainingStats: shimdeuk.stats,
    skills: shimdeuk.skills,
    priority: shimdeuk.priority,
  };
}

/** 보관함에 추가. 5개가 넘으면 에러 (UI에서 버릴 심득을 먼저 고르게 한다). */
export function storeShimdeuk(storage: Shimdeuk[], shimdeuk: Shimdeuk): Shimdeuk[] {
  const mine = storage.filter((s) => s.characterId === shimdeuk.characterId);
  if (mine.length >= SHIMDEUK_SLOTS) throw new Error(`심득은 캐릭터당 ${SHIMDEUK_SLOTS}개까지 보관할 수 있습니다.`);
  return [...storage, shimdeuk];
}
