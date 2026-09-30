/**
 * 수련(육성 1회) 상태 머신.
 * 상태(TrainingState)는 순수 JSON이라 그대로 저장/불러오기 할 수 있고,
 * 난수 상태도 안에 들어 있어 같은 입력이면 같은 결과가 나온다.
 */
import {
  BOND_EVENT_TURNS, BOSS_STAT_REWARD, CHARACTER_EVENT_TURNS, EVOLVE_OFFER_CHANCE, EVOLVE_PRICE, FAIL_GAIN_RATIO,
  FAIL_RATE_PER_POINT, FAIL_THRESHOLD, FINAL_LOSE_STAT_REWARD, FINAL_TURN, FINAL_WIN_STAT_REWARD, FOCUS_MULT,
  GRADE_WEIGHTS, HOME_REGION_BONUS, MAX_FAIL_RATE, MAX_STAMINA, PERSONAL_EVENT_CHANCE, PREMIUM_REST_AMOUNT,
  PREMIUM_REST_COST, PREMIUM_REST_CRIT_CHANCE, QUEST_LOSS_REWARD, QUEST_POWER_SCALE, QUEST_REWARD, START_SILVER,
  BOSS_SILVER_REWARD,
  REGION_EVENT_CHANCE, REGION_EVENT_TURNS_IN_REGION, REST_AMOUNT, REST_CRIT_AMOUNT, REST_CRIT_CHANCE, RETURN_TURN,
  SHOP_OFFER_COUNT, SHOP_REROLL_BASE, SHOP_REROLL_STEP, SHOP_TURNS_IN_REGION, TAG_MATCH_WEIGHT, TIER_GROWTH,
  TRAINING_LEVEL_BONUS, TRAINING_LEVEL_EXP, TRAININGS, TRAIN_CRIT_CHANCE, TRAIN_CRIT_MULT, TURNS_PER_REGION,
  type TrainingId,
} from "../data/balance";
import { bondKey, getCharacter } from "../data/characters";
import { BOND_EVENTS, CHARACTER_EVENTS, REGION_EVENTS, type EventDef, type EventEffects } from "../data/events";
import { ITEMS } from "../data/items";
import { getRegion, REGIONS, regionsOfTier } from "../data/regions";
import { POOL_ACTIVES, POOL_PASSIVES, SKILLS } from "../data/skills";
import { TRAITS } from "../data/traits";
import { runBattle, type BattleResult } from "./battle";
import { bossCombatant, characterCombatant, foeCombatant, shadowCombatant } from "./combatants";
import { Rng } from "./rng";
import { finalizeShimdeuk } from "./shimdeuk";
import type { OwnedSkill, Shimdeuk, ShimdeukSkills, SkillDef, SkillGrade, StatKey, Stats } from "./types";
import { STAT_KEYS, STAT_NAMES } from "./types";

// ---------------------------------------------------------------- 상태
export type Phase =
  | "choose_region" // 지역 선택
  | "event" // 이벤트 선택지 대기
  | "shop" // 상점 열림
  | "action" // 훈련 · 의뢰 · 휴식 선택
  | "boss" // 보스 결투 대기
  | "skill_choice" // 보스 보상 스킬 3택 1
  | "return" // 41턴 본진 귀환
  | "final" // 42턴 최종 시험
  | "done";

export type SkillSlot = "active1" | "passive1" | "active2" | "passive2";
const SLOT_BY_TIER: SkillSlot[] = ["active1", "passive1", "active2", "passive2"];

export interface ShopOffer {
  kind: "item" | "evolve";
  itemId?: string;
  price: number;
  sold: boolean;
}

export interface PendingEvent {
  id: string;
  source: "region" | "character" | "bond";
}

export interface TrainingState {
  version: 1;
  characterId: string;
  seed: number;
  rng: number;
  turn: number;
  phase: Phase;
  regions: string[];
  regionOptions: string[];
  stats: Stats;
  startStats: Stats;
  stamina: number;
  silver: number;
  trainingExp: Record<TrainingId, number>;
  skills: ShimdeukSkills;
  eventQueue: PendingEvent[];
  shop: { offers: ShopOffer[]; rerolls: number } | null;
  skillChoice: { slot: SkillSlot; candidates: OwnedSkill[] } | null;
  seenEvents: string[];
  bossesDefeated: number;
  finalTest: "win" | "lose" | "none";
  log: string[];
  result: Shimdeuk | null;
}

/** 스킬 획득 · 진화 알림 (화면에서 전용 팝업으로 보여준다) */
export interface Acquired {
  kind: "skill" | "ultimate" | "evolve";
  id: string;
  grade?: SkillGrade;
  from?: SkillGrade;
  level?: 1 | 2;
}

export interface ActionResult {
  title: string;
  messages: string[];
  gains: Partial<Stats>;
  success: boolean;
  crit: boolean;
  battle?: BattleResult;
  acquired?: Acquired;
  levelUp?: { id: TrainingId; level: number };
  stamina?: { before: number; after: number };
  silver?: number;
}

// ---------------------------------------------------------------- 조회
export function regionIndex(state: TrainingState): number {
  return Math.min(3, Math.floor((state.turn - 1) / TURNS_PER_REGION));
}

export function turnInRegion(state: TrainingState): number {
  return ((state.turn - 1) % TURNS_PER_REGION) + 1;
}

export function currentRegionId(state: TrainingState): string | undefined {
  return state.regions[regionIndex(state)];
}

export function trainingLevel(state: TrainingState, id: TrainingId): number {
  const exp = state.trainingExp[id];
  return TRAINING_LEVEL_EXP.filter((t) => exp >= t).length;
}

/** 훈련별 실패 확률: 훈련 후 예상 기력이 기준보다 낮을수록 높아진다. */
export function failRate(state: TrainingState, id: TrainingId): number {
  const def = TRAININGS.find((t) => t.id === id)!;
  if (!def.canFail) return 0;
  const after = state.stamina + def.stamina;
  if (after >= FAIL_THRESHOLD) return 0;
  return Math.min(MAX_FAIL_RATE, (FAIL_THRESHOLD - after) * FAIL_RATE_PER_POINT);
}

/** 훈련 레벨 진행도: 현재 레벨 안에서의 경험치 / 다음 레벨까지 필요량 */
export function trainingProgress(state: TrainingState, id: TrainingId): { level: number; exp: number; need: number } {
  const level = trainingLevel(state, id);
  const exp = state.trainingExp[id];
  if (level >= TRAINING_LEVEL_EXP.length) return { level, exp: 1, need: 1 };
  const floor = TRAINING_LEVEL_EXP[level - 1];
  return { level, exp: exp - floor, need: TRAINING_LEVEL_EXP[level] - floor };
}

function growthMult(state: TrainingState, stat: StatKey): number {
  const region = getRegion(currentRegionId(state)!);
  let mult = TIER_GROWTH[region.tier];
  if (region.focus.includes(stat)) mult *= FOCUS_MULT;
  if (region.homeFaction === getCharacter(state.characterId).faction) mult *= HOME_REGION_BONUS;
  return mult;
}

/** 성공 시 예상 상승치 (크리티컬 · 편차 제외) */
export function trainingPreview(state: TrainingState, id: TrainingId): Partial<Stats> {
  const def = TRAININGS.find((t) => t.id === id)!;
  const levelMult = 1 + TRAINING_LEVEL_BONUS * (trainingLevel(state, id) - 1);
  const out: Partial<Stats> = {};
  for (const [stat, base] of Object.entries(def.gains) as [StatKey, number][]) {
    out[stat] = Math.max(1, Math.round(base * levelMult * growthMult(state, stat)));
  }
  return out;
}

export function rerollCost(state: TrainingState): number {
  return SHOP_REROLL_BASE + SHOP_REROLL_STEP * (state.shop?.rerolls ?? 0);
}

export function premiumRestCost(): number {
  return PREMIUM_REST_COST;
}

export function currentEvent(state: TrainingState): EventDef | null {
  const pending = state.eventQueue[0];
  if (!pending) return null;
  return findEvent(pending.id);
}

export function findEvent(id: string): EventDef {
  const pools = [...Object.values(REGION_EVENTS).flat(), ...Object.values(CHARACTER_EVENTS), ...Object.values(BOND_EVENTS).flat()];
  const event = pools.find((e) => e.id === id);
  if (!event) throw new Error(`이벤트 없음: ${id}`);
  return event;
}

// ---------------------------------------------------------------- 생성
export function createTraining(characterId: string, seed: number): TrainingState {
  const character = getCharacter(characterId);
  const state: TrainingState = {
    version: 1,
    characterId,
    seed,
    rng: seed >>> 0,
    turn: 1,
    phase: "choose_region",
    regions: [],
    regionOptions: regionsOfTier(0).map((r) => r.id),
    stats: { ...character.trainingStart },
    startStats: { ...character.trainingStart },
    stamina: MAX_STAMINA,
    silver: character.startSilver ?? START_SILVER,
    trainingExp: { outer: 0, inner: 0, guard: 0, vital: 0, meditate: 0 },
    skills: {},
    eventQueue: [],
    shop: null,
    skillChoice: null,
    seenEvents: [],
    bossesDefeated: 0,
    finalTest: "none",
    log: [],
    result: null,
  };
  return state;
}

function withRng<T>(state: TrainingState, fn: (rng: Rng) => T): T {
  const rng = new Rng(state.rng);
  const out = fn(rng);
  state.rng = rng.state;
  return out;
}

function expectPhase(state: TrainingState, ...phases: Phase[]): void {
  if (!phases.includes(state.phase)) throw new Error(`지금은 할 수 없습니다 (현재 단계: ${state.phase})`);
}

// ---------------------------------------------------------------- 턴 진행
export function chooseRegion(state: TrainingState, regionId: string): void {
  expectPhase(state, "choose_region");
  if (!state.regionOptions.includes(regionId)) throw new Error("선택할 수 없는 지역입니다.");
  state.regions.push(regionId);
  state.regionOptions = [];
  state.log.push(`[${state.turn}턴] ${getRegion(regionId).name}(으)로 향했다.`);
  beginTurn(state);
}

/** 턴 시작: 보스/이벤트/상점을 준비하고 알맞은 단계로 전환 */
function beginTurn(state: TrainingState): void {
  if (state.turn === RETURN_TURN) {
    state.phase = "return";
    return;
  }
  if (state.turn === FINAL_TURN) {
    state.phase = "final";
    return;
  }
  const inRegion = turnInRegion(state);
  if (inRegion === TURNS_PER_REGION) {
    state.phase = "boss";
    return;
  }
  withRng(state, (rng) => {
    const region = currentRegionId(state)!;
    if (REGION_EVENT_TURNS_IN_REGION.includes(inRegion) && rng.chance(REGION_EVENT_CHANCE)) {
      const options = (REGION_EVENTS[region] ?? []).filter((e) => !state.seenEvents.includes(e.id));
      if (options.length) state.eventQueue.push({ id: rng.pick(options).id, source: "region" });
    }
    const character = getCharacter(state.characterId);
    if (CHARACTER_EVENT_TURNS.includes(state.turn) && rng.chance(PERSONAL_EVENT_CHANCE)) {
      const options = character.events.filter((id) => !state.seenEvents.includes(id));
      if (options.length) state.eventQueue.push({ id: rng.pick(options), source: "character" });
    }
    if (BOND_EVENT_TURNS.includes(state.turn) && rng.chance(PERSONAL_EVENT_CHANCE)) {
      const options = (BOND_EVENTS[bondKey(character.id, character.bond)] ?? []).filter((e) => !state.seenEvents.includes(e.id));
      if (options.length) state.eventQueue.push({ id: rng.pick(options).id, source: "bond" });
    }
    if (SHOP_TURNS_IN_REGION.includes(inRegion)) state.shop = { offers: rollShop(state, rng), rerolls: 0 };
  });
  advancePhase(state);
}

/** 대기 중인 이벤트 → 상점 → 행동 순서로 단계를 정한다. */
function advancePhase(state: TrainingState): void {
  if (state.eventQueue.length > 0) state.phase = "event";
  else if (state.shop) state.phase = "shop";
  else state.phase = "action";
}

function endTurn(state: TrainingState): void {
  state.turn += 1;
  const idx = regionIndex(state);
  if (state.turn <= RETURN_TURN - 1 && turnInRegion(state) === 1 && state.regions.length <= idx) {
    state.phase = "choose_region";
    state.regionOptions = regionsOfTier(idx).map((r) => r.id);
    return;
  }
  beginTurn(state);
}

// ---------------------------------------------------------------- 이벤트
function applyEffects(state: TrainingState, effects: EventEffects, result: ActionResult): void {
  if (effects.stats) {
    for (const [stat, value] of Object.entries(effects.stats) as [StatKey, number][]) {
      const scaled = Math.round(value * (value > 0 ? TIER_GROWTH[regionIndex(state)] : 1));
      state.stats[stat] = Math.max(0, state.stats[stat] + scaled);
      result.gains[stat] = (result.gains[stat] ?? 0) + scaled;
    }
  }
  if (effects.stamina) {
    state.stamina = clampStamina(state.stamina + effects.stamina);
    result.messages.push(`기력 ${effects.stamina > 0 ? "+" : ""}${effects.stamina}`);
  }
  if (effects.silver) {
    const amount = Math.max(-state.silver, Math.round(effects.silver * (effects.silver > 0 ? TIER_GROWTH[regionIndex(state)] : 1)));
    state.silver += amount;
    result.messages.push(`은자 ${amount > 0 ? "+" : ""}${amount}`);
  }
  if (effects.trainingExp) {
    state.trainingExp[effects.trainingExp.id] += effects.trainingExp.amount;
    const name = TRAININGS.find((t) => t.id === effects.trainingExp!.id)!.name;
    result.messages.push(`${name} 경험치 +${effects.trainingExp.amount}`);
  }
}

export function resolveEvent(state: TrainingState, choiceIndex: number): ActionResult {
  expectPhase(state, "event");
  const pending = state.eventQueue.shift()!;
  const event = findEvent(pending.id);
  const choice = event.choices[choiceIndex];
  if (!choice) throw new Error("없는 선택지입니다.");
  state.seenEvents.push(event.id);
  const result = newResult(event.title);
  result.messages.push(choice.result);
  applyEffects(state, choice.effects, result);
  state.log.push(`[${state.turn}턴] ${event.title}: ${choice.label}`);
  advancePhase(state);
  return result;
}

// ---------------------------------------------------------------- 상점
function rollShop(state: TrainingState, rng: Rng): ShopOffer[] {
  const tier = regionIndex(state);
  const canEvolve = tier >= 1 && evolvableSlots(state).length > 0;
  const offers: ShopOffer[] = [];
  for (let i = 0; i < SHOP_OFFER_COUNT; i++) {
    if (canEvolve && !offers.some((o) => o.kind === "evolve") && rng.chance(EVOLVE_OFFER_CHANCE)) {
      offers.push({ kind: "evolve", price: Math.round(EVOLVE_PRICE * TIER_GROWTH[tier]), sold: false });
      continue;
    }
    const item = rng.weighted(ITEMS, (it) => it.weight);
    // 스탯 상품은 난이도에 따라 효과와 가격이 함께 오르고, 기력 상품은 고정가.
    const price = item.stats ? Math.round(item.price * TIER_GROWTH[tier]) : item.price;
    offers.push({ kind: "item", itemId: item.id, price, sold: false });
  }
  return offers;
}

export function evolvableSlots(state: TrainingState): SkillSlot[] {
  return SLOT_BY_TIER.filter((slot) => state.skills[slot] && state.skills[slot]!.grade !== "S");
}

const NEXT_GRADE: Record<SkillGrade, SkillGrade> = { C: "B", B: "A", A: "S", S: "S" };

export function shopBuy(state: TrainingState, offerIndex: number): ActionResult {
  expectPhase(state, "shop");
  const offer = state.shop!.offers[offerIndex];
  if (!offer || offer.sold) throw new Error("살 수 없는 상품입니다.");
  if (state.silver < offer.price) throw new Error("은자가 부족합니다.");
  const result = newResult("상점");
  if (offer.kind === "evolve") {
    const slots = evolvableSlots(state);
    if (slots.length === 0) throw new Error("진화할 스킬이 없습니다.");
    // 진화할 스킬은 무작위로 하나 정해진다.
    const slot = withRng(state, (rng) => rng.pick(slots));
    const skill = state.skills[slot]!;
    const from = skill.grade;
    skill.grade = NEXT_GRADE[skill.grade];
    result.acquired = { kind: "evolve", id: skill.id, grade: skill.grade, from };
    result.messages.push(`「${SKILLS[skill.id].name}」이(가) ${skill.grade}등급으로 진화했다!`);
  } else {
    const item = ITEMS.find((it) => it.id === offer.itemId)!;
    const tierMult = TIER_GROWTH[regionIndex(state)];
    if (item.stats) {
      for (const [stat, value] of Object.entries(item.stats) as [StatKey, number][]) {
        const amount = Math.round(value * tierMult);
        state.stats[stat] += amount;
        result.gains[stat] = amount;
      }
    }
    if (item.stamina) state.stamina = clampStamina(state.stamina + item.stamina);
    result.messages.push(`${item.name} 구매`);
  }
  state.silver -= offer.price;
  offer.sold = true;
  return result;
}

export function shopReroll(state: TrainingState): void {
  expectPhase(state, "shop");
  const cost = rerollCost(state);
  if (state.silver < cost) throw new Error("은자가 부족합니다.");
  state.silver -= cost;
  withRng(state, (rng) => {
    state.shop!.offers = rollShop(state, rng);
  });
  state.shop!.rerolls += 1;
}

export function shopClose(state: TrainingState): void {
  expectPhase(state, "shop");
  state.shop = null;
  advancePhase(state);
}

// ---------------------------------------------------------------- 턴 행동
function newResult(title: string): ActionResult {
  return { title, messages: [], gains: {}, success: true, crit: false };
}

function clampStamina(value: number): number {
  return Math.max(0, Math.min(MAX_STAMINA, value));
}

export function train(state: TrainingState, id: TrainingId): ActionResult {
  expectPhase(state, "action");
  const def = TRAININGS.find((t) => t.id === id)!;
  const result = newResult(def.name);
  const preview = trainingPreview(state, id);
  withRng(state, (rng) => {
    const failed = rng.chance(failRate(state, id));
    const crit = !failed && rng.chance(TRAIN_CRIT_CHANCE);
    result.success = !failed;
    result.crit = crit;
    for (const [stat, base] of Object.entries(preview) as [StatKey, number][]) {
      let amount = base * rng.range(0.9, 1.1);
      if (failed) amount *= FAIL_GAIN_RATIO;
      if (crit) amount *= TRAIN_CRIT_MULT;
      const value = Math.max(1, Math.round(amount));
      state.stats[stat] += value;
      result.gains[stat] = value;
    }
    if (failed) result.messages.push("기력이 부족해 훈련이 제대로 되지 않았다.");
    if (crit) result.messages.push("깨달음이 왔다! 성장치 증가.");
  });
  const levelBefore = trainingLevel(state, id);
  const staminaBefore = state.stamina;
  state.stamina = clampStamina(state.stamina + def.stamina);
  result.stamina = { before: staminaBefore, after: state.stamina };
  state.trainingExp[id] += 1;
  if (trainingLevel(state, id) > levelBefore) {
    result.levelUp = { id, level: trainingLevel(state, id) };
    result.messages.push(`${def.name} Lv${trainingLevel(state, id)} 달성!`);
  }
  state.log.push(`[${state.turn}턴] ${def.name}${result.success ? "" : " (실패)"}${result.crit ? " (크리티컬)" : ""}`);
  endTurn(state);
  return result;
}

export function rest(state: TrainingState, premium = false): ActionResult {
  expectPhase(state, "action");
  const result = newResult(premium ? "고급 휴식" : "휴식");
  if (premium) {
    const cost = premiumRestCost();
    if (state.silver < cost) throw new Error("은자가 부족합니다.");
    state.silver -= cost;
  }
  withRng(state, (rng) => {
    let amount: number;
    if (premium) {
      result.crit = rng.chance(PREMIUM_REST_CRIT_CHANCE);
      amount = result.crit ? MAX_STAMINA : PREMIUM_REST_AMOUNT;
    } else {
      result.crit = rng.chance(REST_CRIT_CHANCE);
      amount = result.crit ? REST_CRIT_AMOUNT : REST_AMOUNT;
    }
    const before = state.stamina;
    state.stamina = clampStamina(state.stamina + amount);
    result.stamina = { before, after: state.stamina };
    result.messages.push(`기력 +${state.stamina - before}${result.crit ? (premium ? " (완전 회복!)" : " (푹 쉬었다!)") : ""}`);
  });
  state.log.push(`[${state.turn}턴] ${result.title}`);
  endTurn(state);
  return result;
}

export function quest(state: TrainingState): ActionResult {
  expectPhase(state, "action");
  const region = getRegion(currentRegionId(state)!);
  const result = newResult("의뢰");
  withRng(state, (rng) => {
    const foeName = rng.pick(region.questFoes);
    const scale = QUEST_POWER_SCALE * (0.8 + 0.03 * turnInRegion(state));
    const foe = foeCombatant(foeName, region.tier, scale, rng.chance(0.5) ? "outer" : "inner", 90 + 10 * region.tier);
    const battle = runBattle([playerCombatant(state)], [foe], rng.int(0, 2 ** 31));
    result.battle = battle;
    result.success = battle.winner === 0;
    const reward = result.success
      ? Math.round(QUEST_REWARD[region.tier] * rng.range(0.9, 1.1))
      : QUEST_LOSS_REWARD;
    state.silver += reward;
    result.silver = reward;
    result.messages.push(result.success ? `${foeName}을(를) 물리쳤다! 은자 +${reward}` : `${foeName}에게 밀려났다… 은자 +${reward}`);
  });
  state.log.push(`[${state.turn}턴] 의뢰 ${result.success ? "성공" : "실패"}`);
  endTurn(state);
  return result;
}

/** 수련 중 전투: 기본 스탯은 더하지 않고 수련 스탯만 쓴다. */
export function playerCombatant(state: TrainingState) {
  return characterCombatant({ characterId: state.characterId, trainingStats: state.stats, skills: state.skills, inTraining: true });
}

// ---------------------------------------------------------------- 보스
export function fightBoss(state: TrainingState): ActionResult {
  expectPhase(state, "boss");
  const region = getRegion(currentRegionId(state)!);
  const result = newResult(`${region.boss.title} ${region.boss.name}`);
  const battle = withRng(state, (rng) => runBattle([playerCombatant(state)], [bossCombatant(region.boss, region.tier)], rng.int(0, 2 ** 31)));
  result.battle = battle;
  result.success = battle.winner === 0;
  if (!result.success) {
    result.messages.push("패배… 수련이 여기서 끝난다.");
    state.log.push(`[${state.turn}턴] ${region.boss.name}에게 패배`);
    finish(state);
    return result;
  }
  state.bossesDefeated += 1;
  const reward = BOSS_STAT_REWARD[region.tier];
  for (const key of STAT_KEYS) {
    state.stats[key] += reward;
    result.gains[key] = reward;
  }
  const silver = BOSS_SILVER_REWARD[region.tier];
  state.silver += silver;
  result.silver = silver;
  result.messages.push(`${region.boss.name}을(를) 꺾었다! 모든 수련 능력치 +${reward}, 은자 +${silver}`);
  state.log.push(`[${state.turn}턴] ${region.boss.name} 격파`);
  const slot = SLOT_BY_TIER[region.tier];
  state.skillChoice = { slot, candidates: withRng(state, (rng) => rollSkillCandidates(state, slot, rng)) };
  state.phase = "skill_choice";
  return result;
}

/** 보스 보상 스킬 후보 3개: 계열 제한, 천성 태그 가중치, 등급 확률 */
export function rollSkillCandidates(state: TrainingState, slot: SkillSlot, rng: Rng): OwnedSkill[] {
  const character = getCharacter(state.characterId);
  const tag = TRAITS[character.trait].tag;
  const pool: SkillDef[] = (slot.startsWith("active") ? POOL_ACTIVES : POOL_PASSIVES).filter(
    (s) => (s.affinity === "common" || s.affinity === character.attackType)
      && !Object.values(state.skills).some((owned) => owned?.id === s.id),
  );
  const picked = rng.weightedSample(pool, 3, (s) => (s.tags.includes(tag) ? TAG_MATCH_WEIGHT : 1));
  const grades = Object.keys(GRADE_WEIGHTS) as SkillGrade[];
  return picked.map((s) => ({ id: s.id, grade: rng.weighted(grades, (g) => GRADE_WEIGHTS[g]) }));
}

export function chooseSkill(state: TrainingState, index: number): ActionResult {
  expectPhase(state, "skill_choice");
  const choice = state.skillChoice!;
  const skill = choice.candidates[index];
  if (!skill) throw new Error("없는 후보입니다.");
  state.skills[choice.slot] = { ...skill };
  state.skillChoice = null;
  const result = newResult("스킬 습득");
  result.acquired = { kind: "skill", id: skill.id, grade: skill.grade };
  state.log.push(`[${state.turn}턴] 「${SKILLS[skill.id].name}」(${skill.grade}) 습득`);
  endTurn(state);
  return result;
}

// ---------------------------------------------------------------- 귀환 · 최종 시험
export function returnHome(state: TrainingState): ActionResult {
  expectPhase(state, "return");
  const result = newResult("본진 귀환");
  const before = state.stamina;
  state.stamina = MAX_STAMINA;
  result.messages.push(`본진에서 하루를 쉬었다. 기력 +${MAX_STAMINA - before}`);
  state.log.push(`[${state.turn}턴] 본진 귀환`);
  state.turn += 1;
  state.phase = "final";
  return result;
}

export function finalTest(state: TrainingState): ActionResult {
  expectPhase(state, "final");
  const result = newResult("최종 시험: 심마(心魔)");
  const me = playerCombatant(state);
  const battle = withRng(state, (rng) => runBattle([me], [shadowCombatant(me)], rng.int(0, 2 ** 31)));
  result.battle = battle;
  result.success = battle.winner === 0;
  state.finalTest = result.success ? "win" : "lose";
  const reward = result.success ? FINAL_WIN_STAT_REWARD : FINAL_LOSE_STAT_REWARD;
  for (const key of STAT_KEYS) {
    state.stats[key] += reward;
    result.gains[key] = reward;
  }
  const character = getCharacter(state.characterId);
  const ultimate = withRng(state, (rng) => rng.pick(character.ultimates));
  state.skills.ultimate = { id: ultimate, level: 1 };
  result.acquired = { kind: "ultimate", id: ultimate, level: 1 };
  result.messages.push(result.success ? "심마를 이겨냈다!" : "심마에게 졌지만, 깨달음은 남았다.");
  result.messages.push(`필살기를 깨우쳤다!`);
  state.log.push(`[${state.turn}턴] 최종 시험 ${result.success ? "통과" : "실패"}`);
  finish(state);
  return result;
}

function finish(state: TrainingState): void {
  state.phase = "done";
  state.shop = null;
  state.eventQueue = [];
  state.result = withRng(state, (rng) => finalizeShimdeuk(state, rng));
}

export function describeGains(gains: Partial<Stats>): string {
  return (Object.entries(gains) as [StatKey, number][])
    .filter(([, v]) => v)
    .map(([k, v]) => `${STAT_NAMES[k]} ${v > 0 ? "+" : ""}${v}`)
    .join(" ");
}

export const ALL_REGIONS = REGIONS;
