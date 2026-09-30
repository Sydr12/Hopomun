/** 게임 전반에서 쓰는 자료형. 저장 데이터는 모두 순수 JSON으로 직렬화 가능해야 한다. */

// ---------------------------------------------------------------- 스탯
/** outer=외공(공격1), inner=내공(공격2), guard=호신(방어), vital=기혈(체력) */
export type StatKey = "outer" | "inner" | "guard" | "vital";
export const STAT_KEYS: readonly StatKey[] = ["outer", "inner", "guard", "vital"];
export const STAT_NAMES: Record<StatKey, string> = {
  outer: "외공",
  inner: "내공",
  guard: "호신",
  vital: "기혈",
};
export type Stats = Record<StatKey, number>;

/** 공격 계열: 외공 또는 내공 중 하나만 공격력으로 쓴다. */
export type AttackType = "outer" | "inner";
/** 스킬 계열 제한 */
export type SkillAffinity = AttackType | "common";

export type FactionId = "jeongpa" | "sapa" | "magyo" | "sega" | "saeoe";

export type TraitId =
  | "counter" // 후발제인
  | "poison_hand" // 독수
  | "swift_blade" // 쾌검
  | "flowing" // 유수
  | "vajra" // 금강불괴
  | "iron_wall" // 철벽
  | "guardian" // 호위
  | "healer" // 의선
  | "strategist" // 군사
  | "acupoint" // 점혈
  | "chain" // 연환
  | "blood_art" // 혈공
  | "assassin" // 살수
  | "quickdraw" // 발도
  | "unshaken" // 부동심
  | "frost"; // 빙백

export type SkillTag =
  | "counter"
  | "poison"
  | "multi"
  | "evade"
  | "shield"
  | "guard"
  | "taunt"
  | "heal"
  | "buff"
  | "debuff"
  | "chain"
  | "blood"
  | "execute"
  | "first"
  | "immune"
  | "freeze";

// ---------------------------------------------------------------- 스킬
export type SkillGrade = "C" | "B" | "A" | "S";
export const SKILL_GRADES: readonly SkillGrade[] = ["C", "B", "A", "S"];

export type StatusType =
  | "stun" // 기절
  | "freeze" // 빙결
  | "seal" // 봉인
  | "slow" // 둔화
  | "confuse" // 혼란
  | "bleed_seal" // 봉혈(회복 불가)
  | "taunt" // 도발
  | "poison" // 중독
  | "atk_up"
  | "atk_down"
  | "def_up"
  | "def_down"
  | "invincible" // 무적
  | "cc_immune"; // CC 면역

export type TargetRange =
  | "single" // 앞열 우선 · 같은 행 우선
  | "pierce" // 대상이 있는 행 전체
  | "column" // 가장 앞 열 전체
  | "snipe" // 가장 뒤 적
  | "lowest" // 기혈 비율이 가장 낮은 적
  | "all" // 적 전체
  | "self"
  | "ally_lowest" // 기혈 비율이 가장 낮은 아군
  | "ally_cc" // CC에 걸린 아군 (없으면 기혈 최저 아군)
  | "allies"; // 아군 전체

export type SkillEffect =
  | { kind: "damage"; power: number; hits?: number; bonusVsLow?: number }
  | { kind: "heal"; power: number } // 시전자 공격력 × power
  | { kind: "heal_ally"; power: number } // 대상과 별개로 기혈 최저 아군 치료
  | { kind: "shield"; ratio: number } // 대상 최대 기혈 × ratio
  | { kind: "status"; status: StatusType; chance: number; turns: number; value?: number; stacks?: number }
  | { kind: "self_status"; status: StatusType; turns: number; value?: number }
  | { kind: "ally_status"; status: StatusType; turns: number } // CC 걸린 아군 우선, 없으면 기혈 최저 아군 (자신 제외)
  | { kind: "gauge"; amount: number } // 대상 게이지 증감 (1000 = 한 번의 행동)
  | { kind: "push" }
  | { kind: "pull" }
  | { kind: "cleanse" }
  | { kind: "hp_cost"; ratio: number }; // 시전자 현재 기혈 비율 소모

export interface ActiveSkillDef {
  id: string;
  name: string;
  type: "active";
  affinity: SkillAffinity;
  tags: SkillTag[];
  cooldown: number;
  initialCooldown?: number;
  range: TargetRange;
  effects: SkillEffect[];
  desc: string;
  /** 추천 발동 조건 */
  defaultCondition?: SkillCondition;
}

export interface PassiveMods {
  atkPct?: number;
  defPct?: number;
  hpPct?: number;
  speedPct?: number;
  critRate?: number;
  critDmg?: number;
  dodge?: number;
  startGauge?: number;
  regenPct?: number;
  statusChance?: number;
  lifesteal?: number;
  evadeGauge?: number;
  extraHits?: number;
  firstCcNull?: boolean;
  poisonImmune?: boolean;
}

export interface PassiveSkillDef {
  id: string;
  name: string;
  type: "passive";
  affinity: SkillAffinity;
  tags: SkillTag[];
  mods: PassiveMods;
  desc: string;
}

export type SkillDef = ActiveSkillDef | PassiveSkillDef;

/** 보유 스킬 (등급 포함). 필살기는 grade 대신 ultLevel(1|2). */
export interface OwnedSkill {
  id: string;
  grade: SkillGrade;
}

export interface OwnedUltimate {
  id: string;
  level: 1 | 2;
}

// ---------------------------------------------------------------- 발동 조건
export type SkillCondition =
  | { kind: "always" }
  | { kind: "ally_hp_below"; pct: number }
  | { kind: "target_hp_below"; pct: number }
  | { kind: "enemies_in_line"; count: number }
  | { kind: "after_turn"; turn: number }
  | { kind: "ally_cc" };

/** 액티브 슬롯 이름 */
export type ActiveSlot = "basic" | "active1" | "active2" | "ultimate";

export interface PriorityEntry {
  slot: ActiveSlot;
  condition: SkillCondition;
}

// ---------------------------------------------------------------- 캐릭터
export interface CharacterDef {
  id: string;
  name: string;
  faction: FactionId;
  sect: string;
  attackType: AttackType;
  /** 고유 스탯 */
  baseStats: Stats;
  /** 수련 초기 스탯 */
  trainingStart: Stats;
  /** 신법 (속도, 고정) */
  agility: number;
  trait: TraitId;
  basicSkill: string;
  ultimates: [string, string];
  bond: string;
  /** 수련 시작 자금 (기본 50, 부자 기믹 100~200, 거지 기믹 0) */
  startSilver?: number;
  /** 고유 이벤트 3종 id */
  events: [string, string, string];
  intro: string;
}

// ---------------------------------------------------------------- 심득
export type ShimdeukGrade = "범품" | "정품" | "상품" | "절품" | "신품";

export interface ShimdeukSkills {
  active1?: OwnedSkill;
  passive1?: OwnedSkill;
  active2?: OwnedSkill;
  passive2?: OwnedSkill;
  ultimate?: OwnedUltimate;
}

export interface Shimdeuk {
  id: string;
  characterId: string;
  name: string;
  /** 수련 스탯 (최종) */
  stats: Stats;
  skills: ShimdeukSkills;
  priority: PriorityEntry[];
  regions: string[];
  bossesDefeated: number;
  finalTest: "win" | "lose" | "none";
  score: number;
  grade: ShimdeukGrade;
  seed: number;
}
