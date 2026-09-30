/** 캐릭터 · 보스 · 적을 전투 입력(CombatantSpec)으로 바꾼다. */
import { BOSS_DIFFICULTY, GRADE_POWER, SHADOW_SCALE, TIER_REFERENCE, ULT_LEVEL_POWER } from "../data/balance";
import { getCharacter } from "../data/characters";
import type { BossDef } from "../data/regions";
import { getActive } from "../data/skills";
import type { ActiveLoadout, CombatantSpec, Position } from "./battle";
import type {
  ActiveSlot, AttackType, CharacterDef, PriorityEntry, ShimdeukSkills, SkillCondition, Stats,
} from "./types";
import { STAT_KEYS } from "./types";

export const FRONT_CENTER: Position = { col: 0, row: 1 };

export function addStats(a: Stats, b: Stats): Stats {
  return { outer: a.outer + b.outer, inner: a.inner + b.inner, guard: a.guard + b.guard, vital: a.vital + b.vital };
}

export function scaleStats(a: Stats, k: number): Stats {
  const out = { ...a };
  for (const key of STAT_KEYS) out[key] = Math.round(a[key] * k);
  return out;
}

/** 스킬 기본 추천 조건 */
export function defaultCondition(skillId: string): SkillCondition {
  return getActive(skillId).defaultCondition ?? { kind: "always" };
}

/** 기본 우선순위: 필살기 → 액티브2 → 액티브1 → 기본기 */
export function defaultPriority(skills: ShimdeukSkills, basicSkill: string): PriorityEntry[] {
  const out: PriorityEntry[] = [];
  if (skills.ultimate) out.push({ slot: "ultimate", condition: defaultCondition(skills.ultimate.id) });
  if (skills.active2) out.push({ slot: "active2", condition: defaultCondition(skills.active2.id) });
  if (skills.active1) out.push({ slot: "active1", condition: defaultCondition(skills.active1.id) });
  out.push({ slot: "basic", condition: defaultCondition(basicSkill) });
  return out;
}

function slotLoadout(character: CharacterDef, skills: ShimdeukSkills, slot: ActiveSlot): Omit<ActiveLoadout, "condition"> | null {
  switch (slot) {
    case "basic":
      return { skillId: character.basicSkill, power: 1 };
    case "active1":
      return skills.active1 ? { skillId: skills.active1.id, power: GRADE_POWER[skills.active1.grade] } : null;
    case "active2":
      return skills.active2 ? { skillId: skills.active2.id, power: GRADE_POWER[skills.active2.grade] } : null;
    case "ultimate":
      return skills.ultimate ? { skillId: skills.ultimate.id, power: ULT_LEVEL_POWER[skills.ultimate.level] } : null;
  }
}

export interface CharacterBuild {
  characterId: string;
  trainingStats: Stats;
  skills: ShimdeukSkills;
  priority?: PriorityEntry[];
}

/** 캐릭터 + 수련 결과(진행 중이거나 심득) → 전투 입력 */
export function characterCombatant(build: CharacterBuild, pos: Position = FRONT_CENTER): CombatantSpec {
  const character = getCharacter(build.characterId);
  const priority = build.priority ?? defaultPriority(build.skills, character.basicSkill);
  const actives: ActiveLoadout[] = [];
  for (const entry of priority) {
    const loadout = slotLoadout(character, build.skills, entry.slot);
    if (loadout) actives.push({ ...loadout, condition: entry.condition });
  }
  if (!priority.some((p) => p.slot === "basic")) {
    actives.push({ skillId: character.basicSkill, power: 1, condition: { kind: "always" } });
  }
  const passives = [build.skills.passive1, build.skills.passive2]
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({ skillId: p.id, power: GRADE_POWER[p.grade] }));
  return {
    id: character.id,
    name: character.name,
    attackType: character.attackType,
    stats: addStats(character.baseStats, build.trainingStats),
    agility: character.agility,
    trait: character.trait,
    faction: character.faction,
    actives,
    passives,
    pos,
  };
}

function statsFromProfile(attackType: AttackType, tier: number, profile: BossDef["profile"], scale: number): Stats {
  const ref = TIER_REFERENCE[tier];
  const atk = Math.round(ref.atk * profile.atk * scale);
  return {
    outer: attackType === "outer" ? atk : 0,
    inner: attackType === "inner" ? atk : 0,
    guard: Math.round(ref.guard * profile.guard * scale),
    vital: Math.round(ref.vital * profile.vital * scale),
  };
}

export function bossCombatant(boss: BossDef, tier: number, pos: Position = FRONT_CENTER): CombatantSpec {
  return {
    id: boss.id,
    name: boss.name,
    attackType: boss.attackType,
    stats: statsFromProfile(boss.attackType, tier, boss.profile, BOSS_DIFFICULTY[tier]),
    agility: boss.agility,
    trait: boss.trait,
    isBoss: true,
    actives: boss.skills.map((id) => ({ skillId: id, power: 1, condition: { kind: "always" } as SkillCondition })),
    passives: [],
    mods: boss.mods,
    pos,
  };
}

/** 의뢰 · 이벤트용 일반 적. scale = 기준 스탯 대비 강도 */
export function foeCombatant(name: string, tier: number, scale: number, attackType: AttackType, agility: number): CombatantSpec {
  return {
    id: `foe_${name}`,
    name,
    attackType,
    stats: statsFromProfile(attackType, tier, { atk: 1.0, guard: 0.9, vital: 1.0 }, scale),
    agility,
    actives: [
      { skillId: "e_heavy", power: 1, condition: { kind: "always" } },
      { skillId: "e_strike", power: 1, condition: { kind: "always" } },
    ],
    passives: [],
    pos: FRONT_CENTER,
  };
}

/** 최종 시험 상대 심마(心魔): 자신의 분신 */
export function shadowCombatant(self: CombatantSpec): CombatantSpec {
  return {
    ...self,
    id: `shadow_${self.id}`,
    name: `심마(心魔)`,
    faction: undefined,
    isBoss: true,
    stats: scaleStats(self.stats, SHADOW_SCALE),
    pos: FRONT_CENTER,
  };
}
