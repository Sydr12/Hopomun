/**
 * 밸런스 수치 모음. 시뮬레이터(scripts/sim.ts)로 조정한다.
 */
import type { SkillGrade, StatKey } from "../core/types";

// ---------------------------------------------------------------- 수련 구조
export const TURNS_PER_REGION = 10;
export const REGION_COUNT = 4;
export const RETURN_TURN = 41;
export const FINAL_TURN = 42;
export const SHOP_TURNS_IN_REGION = [5, 9];
export const REGION_EVENT_TURNS_IN_REGION = [3, 7];
export const REGION_EVENT_CHANCE = 0.45;
export const CHARACTER_EVENT_TURNS = [6, 26];
export const BOND_EVENT_TURNS = [16, 36];
export const PERSONAL_EVENT_CHANCE = 0.6;

// ---------------------------------------------------------------- 기력 · 훈련
export const MAX_STAMINA = 100;
/** 실패 확률은 "훈련 후 예상 기력" 기준: 이 값보다 낮아지는 만큼 확률이 오른다. */
export const FAIL_THRESHOLD = 30;
export const FAIL_RATE_PER_POINT = 0.02;
export const MAX_FAIL_RATE = 0.9;
export const FAIL_GAIN_RATIO = 0.3;
export const TRAIN_CRIT_CHANCE = 0.1;
export const TRAIN_CRIT_MULT = 1.5;

/** 훈련 레벨 경험치 누적 기준 (Lv1..Lv5) */
export const TRAINING_LEVEL_EXP = [0, 2, 4, 7, 10];
export const TRAINING_LEVEL_BONUS = 0.15;

/** 난이도(지역 순번)별 성장 배율 */
export const TIER_GROWTH = [1.0, 1.15, 1.35, 1.6];
/** 지역 주요 상승 능력치 배율 */
export const FOCUS_MULT = 1.3;
/** 지역 연고 세력 성장 보너스 */
export const HOME_REGION_BONUS = 1.1;

export type TrainingId = "outer" | "inner" | "guard" | "vital" | "meditate";

export interface TrainingDef {
  id: TrainingId;
  name: string;
  gains: Partial<Record<StatKey, number>>;
  stamina: number; // 음수 = 소모
  canFail: boolean;
}

export const TRAININGS: TrainingDef[] = [
  { id: "outer", name: "외공 훈련", gains: { outer: 12, vital: 3, guard: 1 }, stamina: -20, canFail: true },
  { id: "inner", name: "내공 훈련", gains: { inner: 12, vital: 2, guard: 2 }, stamina: -20, canFail: true },
  { id: "guard", name: "호신 훈련", gains: { guard: 12, vital: 4 }, stamina: -18, canFail: true },
  { id: "vital", name: "기혈 훈련", gains: { vital: 13, guard: 3 }, stamina: -18, canFail: true },
  { id: "meditate", name: "명상", gains: { guard: 4, vital: 4 }, stamina: 10, canFail: false },
];

// ---------------------------------------------------------------- 휴식
export const REST_AMOUNT = 40;
export const REST_CRIT_CHANCE = 0.15;
export const REST_CRIT_AMOUNT = 60;
/**
 * 기력 가치: 기력환(+30)이 은자 40 → 기력 1 ≈ 은자 1.3.
 * 고급 휴식은 일반 휴식보다 기력 +25 더 회복(+크리티컬 시 완전 회복) → 약 은자 30으로 고정.
 */
export const PREMIUM_REST_COST = 30;
export const PREMIUM_REST_AMOUNT = 65;
export const PREMIUM_REST_CRIT_CHANCE = 0.25;

// ---------------------------------------------------------------- 의뢰 · 재화
export const QUEST_REWARD = [40, 60, 85, 115];
export const START_SILVER = 50;
/** 보스 격파 은자 보상 (난이도별) */
export const BOSS_SILVER_REWARD = [60, 90, 120, 150];
export const QUEST_LOSS_REWARD = 10;
export const QUEST_POWER_SCALE = 0.7;

// ---------------------------------------------------------------- 상점
export const SHOP_OFFER_COUNT = 3;
export const SHOP_REROLL_BASE = 20;
export const SHOP_REROLL_STEP = 10;
export const EVOLVE_OFFER_CHANCE = 0.05;
export const EVOLVE_PRICE = 150;

// ---------------------------------------------------------------- 보스 · 시험
/**
 * 난이도별 기준 전투 스탯: 무난한 플레이(봇)가 그 보스 직전에 갖는 평균 (scripts/calib.ts 로 측정).
 * 보스 스탯 = 기준 × 보스 프로필 × 난이도 계수.
 */
export const TIER_REFERENCE = [
  { atk: 194, guard: 116, vital: 153 },
  { atk: 305, guard: 174, vital: 232 },
  { atk: 457, guard: 248, vital: 337 },
  { atk: 654, guard: 347, vital: 475 },
];
export const BOSS_DIFFICULTY = [0.72, 0.8, 0.73, 0.79];
export const BOSS_STAT_REWARD = [12, 18, 26, 36];
export const FINAL_WIN_STAT_REWARD = 40;
export const FINAL_LOSE_STAT_REWARD = 15;
/** 심마(心魔)는 자신의 능력치 × 이 배율 */
export const SHADOW_SCALE = 0.95;

// ---------------------------------------------------------------- 스킬 등급
export const GRADE_WEIGHTS: Record<SkillGrade, number> = { S: 1, A: 3, B: 3, C: 3 };
export const GRADE_POWER: Record<SkillGrade, number> = { C: 1.0, B: 1.15, A: 1.3, S: 1.5 };
export const ULT_LEVEL_POWER = { 1: 1.0, 2: 1.5 } as const;
export const TAG_MATCH_WEIGHT = 2;

// ---------------------------------------------------------------- 심득 평가
/** 봇 기준 분포 목표: 범품 10% · 정품 25% · 상품 35% · 절품 22% · 신품 8% */
export const GRADE_THRESHOLDS: [number, "범품" | "정품" | "상품" | "절품" | "신품"][] = [
  [2060, "신품"],
  [1985, "절품"],
  [1785, "상품"],
  [935, "정품"],
  [0, "범품"],
];
/** 등급별 종료 보상: 수련 스탯 추가 비율, 스킬 업그레이드 확률, 필살기 업그레이드 확률 */
export const GRADE_REWARDS = {
  범품: { statPct: 0.0, skillUp: 0.0, ultUp: 0.0 },
  정품: { statPct: 0.03, skillUp: 0.1, ultUp: 0.0 },
  상품: { statPct: 0.06, skillUp: 0.2, ultUp: 0.03 },
  절품: { statPct: 0.1, skillUp: 0.3, ultUp: 0.06 },
  신품: { statPct: 0.15, skillUp: 0.45, ultUp: 0.12 },
} as const;

// ---------------------------------------------------------------- 전투
export const GAUGE_FULL = 1000;
export const BASE_HP = 400;
export const HP_PER_VITAL = 10;
export const ATK_FLAT = 20;
export const GUARD_FACTOR = 0.3;
export const BASE_CRIT = 0.1;
export const CRIT_DMG = 1.5;
export const BASE_DODGE = 0.05;
export const MAX_ACTIONS = 300;
/** 중독: 중첩당 시전자 공격력 비율, 최대 중첩 */
export const POISON_PER_STACK = 0.06;
export const POISON_MAX_STACKS = 8;
