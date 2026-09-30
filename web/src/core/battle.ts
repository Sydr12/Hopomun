/**
 * 전투 엔진: 속도 게이지 턴제 · 9칸 배치 · 스킬 우선순위 자동 발동.
 * 입력(편성)과 시드가 같으면 결과가 항상 같다.
 */
import {
  ATK_FLAT, BASE_CRIT, BASE_DODGE, BASE_HP, CRIT_DMG, GAUGE_FULL, GUARD_FACTOR, HP_PER_VITAL, MAX_ACTIONS,
  POISON_MAX_STACKS, POISON_PER_STACK,
} from "../data/balance";
import { BOND_BUFFS, bondKey } from "../data/characters";
import { getActive, getPassive } from "../data/skills";
import type {
  ActiveSkillDef, AttackType, FactionId, PassiveMods, SkillCondition, SkillEffect, Stats, StatusType, TraitId,
} from "./types";
import { Rng } from "./rng";

// ---------------------------------------------------------------- 입력
export interface Position {
  col: 0 | 1 | 2; // 0 = 전열, 2 = 후열
  row: 0 | 1 | 2;
}

export interface ActiveLoadout {
  skillId: string;
  /** 등급/레벨에 따른 위력 배율 */
  power: number;
  condition: SkillCondition;
}

export interface CombatantSpec {
  id: string;
  name: string;
  attackType: AttackType;
  stats: Stats;
  agility: number;
  trait?: TraitId;
  faction?: FactionId;
  isBoss?: boolean;
  /** 우선순위 순서. 기본기(쿨타임 0)를 반드시 포함해야 한다. */
  actives: ActiveLoadout[];
  passives: { skillId: string; power: number }[];
  mods?: PassiveMods;
  pos: Position;
}

// ---------------------------------------------------------------- 결과
export interface HitRecord {
  uid: string;
  damage?: number;
  heal?: number;
  shield?: number;
  crit?: boolean;
  evaded?: boolean;
  blocked?: boolean;
  status?: StatusType;
  resisted?: StatusType;
}

export interface BattleEvent {
  seq: number;
  actor: string;
  kind: "skill" | "skip" | "dot" | "counter" | "trait" | "death" | "buff";
  skill?: string;
  text: string;
  hits: HitRecord[];
  hp: Record<string, number>;
}

export interface UnitSummary {
  uid: string;
  id: string;
  name: string;
  attackType: AttackType;
  isBoss: boolean;
  side: 0 | 1;
  maxHp: number;
  hp: number;
  pos: Position;
}

export interface BattleResult {
  winner: 0 | 1;
  timeout: boolean;
  actions: number;
  events: BattleEvent[];
  units: UnitSummary[];
}

// ---------------------------------------------------------------- 내부 상태
const CC_TYPES: StatusType[] = ["stun", "freeze", "seal", "slow", "confuse"];
const DEBUFF_TYPES: StatusType[] = [...CC_TYPES, "bleed_seal", "poison", "atk_down", "def_down"];

interface Status {
  type: StatusType;
  turns: number;
  value: number;
  stacks: number;
  /** 자기 턴 중에 걸린 상태: 이번 턴 종료 시에는 줄지 않는다 (다음 자기 턴 종료까지 유지). */
  fresh?: boolean;
}

interface Unit {
  uid: string;
  spec: CombatantSpec;
  name: string;
  side: 0 | 1;
  pos: Position;
  maxHp: number;
  hp: number;
  shield: number;
  gauge: number;
  alive: boolean;
  statuses: Status[];
  cooldowns: number[];
  actives: { def: ActiveSkillDef; power: number; condition: SkillCondition }[];
  mods: Required<Omit<PassiveMods, "firstCcNull" | "poisonImmune">> & { firstCcNull: boolean; poisonImmune: boolean };
  actionsTaken: number;
  chainStacks: number;
  unshakenStacks: number;
  counterBoost: number;
  evadeBonus: boolean;
  vajraUsed: boolean;
  firstCcNullUsed: boolean;
  firstAttackDone: boolean;
}

interface SideState {
  factionTier: Partial<Record<FactionId, 1 | 2>>;
  bond: { atkPct: number; defPct: number; hpPct: number; speedPct: number };
  crisisShieldUsed: boolean;
}

const EMPTY_MODS = (): Unit["mods"] => ({
  atkPct: 0, defPct: 0, hpPct: 0, speedPct: 0, critRate: 0, critDmg: 0, dodge: 0, startGauge: 0,
  regenPct: 0, statusChance: 0, lifesteal: 0, evadeGauge: 0, extraHits: 0, firstCcNull: false, poisonImmune: false,
});

function addMods(target: Unit["mods"], mods: PassiveMods, scale = 1): void {
  for (const [key, value] of Object.entries(mods)) {
    if (typeof value === "boolean") {
      (target as Record<string, number | boolean>)[key] = (target as Record<string, number | boolean>)[key] || value;
    } else if (typeof value === "number") {
      const k = key as keyof Unit["mods"];
      // 타격 수 · 게이지는 정수 성격이라 등급 배율을 적용하지 않는다.
      const s = k === "extraHits" ? 1 : scale;
      (target[k] as number) += value * s;
    }
  }
}

// ---------------------------------------------------------------- 엔진
export class Battle {
  readonly units: Unit[] = [];
  readonly events: BattleEvent[] = [];
  private seq = 0;
  private deathsLogged = new Set<string>();
  private lastSkillIndex = -1;
  private currentActor: Unit | null = null;
  private sides: [SideState, SideState];

  constructor(teamA: CombatantSpec[], teamB: CombatantSpec[], private rng: Rng) {
    this.sides = [this.buildSide(teamA), this.buildSide(teamB)];
    teamA.forEach((spec, i) => this.units.push(this.buildUnit(spec, 0, `a${i}`)));
    teamB.forEach((spec, i) => this.units.push(this.buildUnit(spec, 1, `b${i}`)));
    for (const unit of this.units) this.onBattleStart(unit);
  }

  // ---------------------------------------------------------- 준비
  private buildSide(team: CombatantSpec[]): SideState {
    const counts: Partial<Record<FactionId, number>> = {};
    for (const spec of team) if (spec.faction) counts[spec.faction] = (counts[spec.faction] ?? 0) + 1;
    const factionTier: SideState["factionTier"] = {};
    for (const [faction, count] of Object.entries(counts) as [FactionId, number][]) {
      if (count >= 4) factionTier[faction] = 2;
      else if (count >= 2) factionTier[faction] = 1;
    }
    const bond = { atkPct: 0, defPct: 0, hpPct: 0, speedPct: 0 };
    const ids = new Set(team.map((s) => s.id));
    for (const [key, buff] of Object.entries(BOND_BUFFS)) {
      const [a, b] = key.split("+");
      if (ids.has(a) && ids.has(b) && key === bondKey(a, b)) bond[buff.stat] += buff.value;
    }
    return { factionTier, bond, crisisShieldUsed: false };
  }

  private buildUnit(spec: CombatantSpec, side: 0 | 1, uid: string): Unit {
    const mods = EMPTY_MODS();
    for (const passive of spec.passives) addMods(mods, getPassive(passive.skillId).mods, passive.power);
    if (spec.mods) addMods(mods, spec.mods);
    const sideState = this.sides[side];
    const tier = sideState.factionTier;
    if (tier.jeongpa) mods.defPct += 0.1;
    if (tier.sapa) mods.atkPct += 0.1;
    if (tier.magyo) mods.hpPct += 0.1;
    if (tier.magyo === 2) mods.lifesteal += 0.1;
    if (tier.sega) mods.speedPct += 0.05;
    if (tier.saeoe) mods.statusChance += 0.1;
    mods.atkPct += sideState.bond.atkPct;
    mods.defPct += sideState.bond.defPct;
    mods.hpPct += sideState.bond.hpPct;
    mods.speedPct += sideState.bond.speedPct;
    if (spec.trait === "poison_hand") mods.poisonImmune = true;
    if (spec.trait === "flowing") mods.dodge += 0.1;

    const maxHp = Math.round((BASE_HP + spec.stats.vital * HP_PER_VITAL) * (1 + mods.hpPct));
    const actives = spec.actives.map((a) => ({ def: getActive(a.skillId), power: a.power, condition: a.condition }));
    if (!actives.some((a) => a.def.cooldown === 0)) throw new Error(`${spec.name}: 기본기(쿨타임 0)가 없습니다.`);
    const segaStart = tier.sega === 2 ? 1 : 0;
    const cooldowns = actives.map((a) => Math.max(0, (a.def.initialCooldown ?? 0) - segaStart));

    return {
      uid, spec, name: spec.name, side, pos: { ...spec.pos }, maxHp, hp: maxHp, shield: 0,
      gauge: 0, alive: true, statuses: [], cooldowns, actives, mods,
      actionsTaken: 0, chainStacks: 0, unshakenStacks: 0, counterBoost: 0, evadeBonus: false,
      vajraUsed: false, firstCcNullUsed: false, firstAttackDone: false,
    };
  }

  private onBattleStart(unit: Unit): void {
    unit.gauge = unit.mods.startGauge + (unit.spec.trait === "quickdraw" ? 400 : 0);
    if (unit.spec.trait === "guardian") unit.statuses.push({ type: "taunt", turns: 1, value: 0, stacks: 1 });
  }

  // ---------------------------------------------------------- 조회 도우미
  private allies(unit: Unit): Unit[] {
    return this.units.filter((u) => u.alive && u.side === unit.side);
  }

  private enemies(unit: Unit): Unit[] {
    return this.units.filter((u) => u.alive && u.side !== unit.side);
  }

  private has(unit: Unit, type: StatusType): Status | undefined {
    return unit.statuses.find((s) => s.type === type);
  }

  private hpRatio(unit: Unit): number {
    return unit.hp / unit.maxHp;
  }

  private hasCc(unit: Unit): boolean {
    return unit.statuses.some((s) => CC_TYPES.includes(s.type));
  }

  private speed(unit: Unit): number {
    const slow = this.has(unit, "slow") ? 0.7 : 1;
    return unit.spec.agility * (1 + unit.mods.speedPct) * slow;
  }

  private snapshot(): Record<string, number> {
    return Object.fromEntries(this.units.map((u) => [u.uid, Math.max(0, Math.round(u.hp))]));
  }

  private log(actor: Unit, kind: BattleEvent["kind"], text: string, hits: HitRecord[] = [], skill?: string): void {
    this.events.push({ seq: this.seq, actor: actor.uid, kind, skill, text, hits, hp: this.snapshot() });
  }

  // ---------------------------------------------------------- 진행
  run(): BattleResult {
    let actions = 0;
    while (this.alive(0) && this.alive(1) && actions < MAX_ACTIONS) {
      const actor = this.nextActor();
      actions += 1;
      this.seq = actions;
      this.takeTurn(actor);
    }
    const timeout = this.alive(0) && this.alive(1);
    let winner: 0 | 1;
    if (!timeout) winner = this.alive(0) ? 0 : 1;
    else winner = this.sideHpRatio(0) >= this.sideHpRatio(1) ? 0 : 1;
    return {
      winner,
      timeout,
      actions,
      events: this.events,
      units: this.units.map((u) => ({ uid: u.uid, id: u.spec.id, name: u.name, attackType: u.spec.attackType, isBoss: !!u.spec.isBoss, side: u.side, maxHp: u.maxHp, hp: Math.max(0, Math.round(u.hp)), pos: u.pos })),
    };
  }

  private alive(side: 0 | 1): boolean {
    return this.units.some((u) => u.alive && u.side === side);
  }

  private sideHpRatio(side: 0 | 1): number {
    const team = this.units.filter((u) => u.side === side);
    return team.reduce((sum, u) => sum + Math.max(0, u.hp) / u.maxHp, 0) / team.length;
  }

  private nextActor(): Unit {
    const living = this.units.filter((u) => u.alive);
    let best: Unit | null = null;
    let bestTime = Infinity;
    for (const unit of living) {
      const time = Math.max(0, GAUGE_FULL - unit.gauge) / this.speed(unit);
      if (time < bestTime - 1e-9 || (Math.abs(time - bestTime) < 1e-9 && best && this.speed(unit) > this.speed(best))) {
        best = unit;
        bestTime = time;
      }
    }
    for (const unit of living) unit.gauge += this.speed(unit) * bestTime;
    return best!;
  }

  private takeTurn(actor: Unit): void {
    this.currentActor = actor;
    actor.gauge -= GAUGE_FULL;
    actor.cooldowns = actor.cooldowns.map((c) => Math.max(0, c - 1));

    // 중독: 자기 턴 시작에 피해
    const poison = this.has(actor, "poison");
    if (poison) {
      const damage = Math.round(poison.value * poison.stacks);
      this.applyRawDamage(actor, damage);
      this.log(actor, "dot", `${actor.name} 중독 피해 ${damage}`, [{ uid: actor.uid, damage }]);
      if (!actor.alive) {
        this.resolveDeaths(actor);
        return;
      }
    }

    // 행동 불가 CC
    const stun = this.has(actor, "stun");
    const freeze = this.has(actor, "freeze");
    if (stun || freeze) {
      this.log(actor, "skip", `${actor.name}은(는) ${stun ? "기절" : "빙결"} 상태라 움직이지 못한다.`);
      if (stun) actor.statuses = actor.statuses.filter((s) => s !== stun);
      this.endTurn(actor);
      return;
    }

    const choice = this.chooseSkill(actor);
    this.useSkill(actor, choice.index);
    actor.actionsTaken += 1;
    this.afterAction(actor, choice.index);
    if (actor.alive) this.endTurn(actor);
  }

  private chooseSkill(actor: Unit): { index: number } {
    const sealed = !!this.has(actor, "seal");
    for (let i = 0; i < actor.actives.length; i++) {
      const active = actor.actives[i];
      if (actor.cooldowns[i] > 0) continue;
      if (sealed && active.def.cooldown > 0) continue;
      if (!this.conditionMet(actor, active.def, active.condition)) continue;
      return { index: i };
    }
    const basic = actor.actives.findIndex((a) => a.def.cooldown === 0);
    return { index: basic };
  }

  private conditionMet(actor: Unit, skill: ActiveSkillDef, condition: SkillCondition): boolean {
    switch (condition.kind) {
      case "always":
        return true;
      case "ally_hp_below":
        return this.allies(actor).some((u) => this.hpRatio(u) * 100 <= condition.pct);
      case "target_hp_below": {
        const targets = this.resolveTargets(actor, skill, true);
        return targets.some((t) => t.side !== actor.side && this.hpRatio(t) * 100 <= condition.pct);
      }
      case "enemies_in_line": {
        const enemies = this.enemies(actor);
        const rows = [0, 1, 2].map((r) => enemies.filter((e) => e.pos.row === r).length);
        const cols = [0, 1, 2].map((c) => enemies.filter((e) => e.pos.col === c).length);
        return Math.max(...rows, ...cols) >= condition.count;
      }
      case "after_turn":
        return actor.actionsTaken >= condition.turn;
      case "ally_cc":
        return this.allies(actor).some((u) => this.hasCc(u));
    }
  }

  // ---------------------------------------------------------- 대상 선택
  private frontTarget(actor: Unit, pool: Unit[], preferBack = false): Unit | undefined {
    if (pool.length === 0) return undefined;
    const taunters = pool.filter((u) => this.has(u, "taunt"));
    const candidates = taunters.length > 0 ? taunters : pool;
    const edge = preferBack
      ? Math.max(...candidates.map((u) => u.pos.col))
      : Math.min(...candidates.map((u) => u.pos.col));
    const line = candidates.filter((u) => u.pos.col === edge);
    line.sort((a, b) => Math.abs(a.pos.row - actor.pos.row) - Math.abs(b.pos.row - actor.pos.row) || a.pos.row - b.pos.row);
    return line[0];
  }

  /** preview=true 이면 무작위 요소(혼란 · 호위)를 적용하지 않는다 (조건 판정용). */
  private resolveTargets(actor: Unit, skill: ActiveSkillDef, preview = false): Unit[] {
    const enemies = this.enemies(actor);
    const allies = this.allies(actor);
    const hostile = !["self", "ally_lowest", "ally_cc", "allies"].includes(skill.range);
    const confused = !preview && hostile && !!this.has(actor, "confuse") && this.rng.chance(0.5);
    if (confused) {
      const others = this.units.filter((u) => u.alive && u !== actor);
      return others.length > 0 ? [this.rng.pick(others)] : [actor];
    }
    const lowestOf = (pool: Unit[]) => [...pool].sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0];
    const withTaunt = (fallback: Unit | undefined) => {
      const taunter = this.frontTarget(actor, enemies.filter((u) => this.has(u, "taunt")));
      return taunter ?? fallback;
    };

    switch (skill.range) {
      case "single": {
        const t = this.frontTarget(actor, enemies);
        return t ? [preview ? t : this.guardianRedirect(t)] : [];
      }
      case "snipe": {
        const t = withTaunt(this.frontTarget(actor, enemies, true));
        return t ? [preview ? t : this.guardianRedirect(t)] : [];
      }
      case "lowest": {
        const t = withTaunt(lowestOf(enemies));
        return t ? [preview ? t : this.guardianRedirect(t)] : [];
      }
      case "pierce": {
        const t = this.frontTarget(actor, enemies);
        if (!t) return [];
        return enemies.filter((e) => e.pos.row === t.pos.row).sort((a, b) => a.pos.col - b.pos.col);
      }
      case "column": {
        const front = Math.min(...enemies.map((e) => e.pos.col));
        return enemies.filter((e) => e.pos.col === front);
      }
      case "all":
        return enemies;
      case "self":
        return [actor];
      case "ally_lowest":
        return [lowestOf(allies)];
      case "ally_cc": {
        const ccd = allies.filter((u) => this.hasCc(u));
        return [ccd.length > 0 ? lowestOf(ccd) : lowestOf(allies)];
      }
      case "allies":
        return allies;
    }
  }

  /** 호위: 같은 행 앞쪽에 선 호위 천성 아군이 20% 확률로 대신 맞는다. */
  private guardianRedirect(target: Unit): Unit {
    const guard = this.units.find(
      (u) => u.alive && u !== target && u.side === target.side && u.spec.trait === "guardian"
        && u.pos.row === target.pos.row && u.pos.col < target.pos.col,
    );
    if (guard && this.rng.chance(0.2)) return guard;
    return target;
  }

  // ---------------------------------------------------------- 스킬 사용
  private useSkill(actor: Unit, index: number): void {
    const { def, power } = actor.actives[index];
    const targets = this.resolveTargets(actor, def);
    const hits: HitRecord[] = [];
    const trait = actor.spec.trait;
    const tagMatch = (tag: string) => def.tags.includes(tag as never);
    let powerMult = power;
    if (trait === "blood_art" && def.effects.some((e) => e.kind === "hp_cost")) powerMult *= 1.3;

    const onHitStatusDone = new Set<string>();
    for (const effect of def.effects) {
      switch (effect.kind) {
        case "hp_cost": {
          const cost = Math.round(actor.hp * effect.ratio);
          actor.hp = Math.max(1, actor.hp - cost);
          break;
        }
        case "damage":
          for (const target of targets) {
            if (!target.alive) continue;
            this.dealSkillDamage(actor, target, def, effect, powerMult, hits, onHitStatusDone);
          }
          break;
        case "heal":
          for (const target of targets) this.heal(actor, target, effect.power * powerMult, hits, tagMatch("heal"));
          break;
        case "heal_ally": {
          const target = [...this.allies(actor)].sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0];
          if (target) this.heal(actor, target, effect.power * powerMult, hits, tagMatch("heal"));
          break;
        }
        case "shield":
          for (const target of targets) {
            const amount = Math.round(target.maxHp * effect.ratio * powerMult * (trait === "vajra" ? 1.3 : 1));
            target.shield += amount;
            hits.push({ uid: target.uid, shield: amount });
          }
          break;
        case "status":
          for (const target of targets) {
            if (!target.alive) continue;
            this.tryApplyStatus(actor, target, effect, def, hits);
          }
          break;
        case "self_status": {
          let turns = effect.turns;
          if (trait === "strategist" && (effect.status === "atk_up" || effect.status === "def_up")) turns += 1;
          this.addStatus(actor, effect.status, turns, effect.value ?? 0, 1);
          hits.push({ uid: actor.uid, status: effect.status });
          break;
        }
        case "ally_status": {
          const allies = this.allies(actor).filter((u) => u !== actor);
          const pool = allies.filter((u) => this.hasCc(u));
          const ally = (pool.length ? pool : allies).sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0] ?? actor;
          this.addStatus(ally, effect.status, effect.turns, 0, 1);
          hits.push({ uid: ally.uid, status: effect.status });
          break;
        }
        case "gauge":
          for (const target of targets) if (target.alive) target.gauge = Math.max(0, target.gauge + effect.amount);
          break;
        case "push":
        case "pull":
          for (const target of targets) if (target.alive) this.move(target, effect.kind === "push" ? 1 : -1);
          break;
        case "cleanse":
          for (const target of targets) {
            const before = target.statuses.length;
            target.statuses = target.statuses.filter((s) => !DEBUFF_TYPES.includes(s.type));
            if (target.statuses.length !== before) hits.push({ uid: target.uid });
          }
          break;
      }
    }

    // 천성 공명
    if (trait === "counter" && tagMatch("counter")) actor.counterBoost = 1;
    if (trait === "flowing" && tagMatch("evade")) actor.evadeBonus = true;
    if (trait === "strategist" && tagMatch("buff")) for (const ally of this.allies(actor)) ally.gauge += 150;
    if (trait === "unshaken" && tagMatch("immune")) {
      const ally = this.allies(actor).find((u) => u !== actor);
      if (ally) this.addStatus(ally, "cc_immune", 1, 0, 1);
    }

    const targetNames = [...new Set(hits.map((h) => this.units.find((u) => u.uid === h.uid)?.name))].filter(Boolean);
    this.log(actor, "skill", `${actor.name}의 「${def.name}」${targetNames.length ? ` → ${targetNames.join(", ")}` : ""}`, hits, def.id);
    actor.cooldowns[index] = def.cooldown;
    this.lastSkillIndex = index;
    this.resolveDeaths(actor);
    this.lastSkillIndex = -1;
  }

  private attackValue(unit: Unit): number {
    const stat = unit.spec.stats[unit.spec.attackType];
    let atk = stat + ATK_FLAT;
    if (unit.spec.trait === "iron_wall") atk += this.guardValue(unit) * 0.5;
    let pct = unit.mods.atkPct;
    for (const s of unit.statuses) {
      if (s.type === "atk_up") pct += s.value;
      if (s.type === "atk_down") pct -= s.value;
      if (s.type === "def_up" && unit.spec.trait === "iron_wall") pct += s.value;
    }
    atk *= Math.max(0.1, 1 + pct);
    if (unit.spec.trait === "blood_art") atk *= 1 + 0.5 * (1 - this.hpRatio(unit));
    if (unit.spec.trait === "chain") atk *= 1 + 0.05 * unit.chainStacks;
    if (unit.spec.trait === "unshaken") atk *= 1 + 0.08 * unit.unshakenStacks;
    return atk;
  }

  private guardValue(unit: Unit): number {
    let pct = unit.mods.defPct;
    for (const s of unit.statuses) {
      if (s.type === "def_up") pct += s.value;
      if (s.type === "def_down") pct -= s.value;
    }
    return unit.spec.stats.guard * Math.max(0.1, 1 + pct);
  }

  private dealSkillDamage(
    actor: Unit, target: Unit, def: ActiveSkillDef, effect: Extract<SkillEffect, { kind: "damage" }>,
    powerMult: number, hits: HitRecord[], statusDone: Set<string>,
  ): void {
    const trait = actor.spec.trait;
    const multi = def.tags.includes("multi");
    let hitCount = effect.hits ?? 1;
    if (multi) hitCount += actor.mods.extraHits + (trait === "swift_blade" ? 1 : 0);

    for (let h = 0; h < hitCount && target.alive; h++) {
      const frozen = !!this.has(target, "freeze");
      // 회피 (빙결 상태에서는 회피 불가)
      if (!frozen && this.rng.chance(BASE_DODGE + target.mods.dodge)) {
        hits.push({ uid: target.uid, evaded: true });
        if (target.spec.trait === "flowing" || target.mods.evadeGauge) {
          target.gauge += (target.spec.trait === "flowing" ? 200 : 0) + target.mods.evadeGauge;
        }
        continue;
      }
      if (this.has(target, "invincible")) {
        hits.push({ uid: target.uid, blocked: true });
        continue;
      }

      let crit = this.rng.chance(BASE_CRIT + actor.mods.critRate);
      if (trait === "quickdraw" && !actor.firstAttackDone && def.tags.includes("first")) crit = true;
      if (trait === "swift_blade" && multi && h === hitCount - 1) crit = true;
      if (trait === "frost" && frozen && def.tags.includes("freeze")) crit = true;

      let damage = effect.power * powerMult * this.attackValue(actor);
      damage *= 100 / (100 + this.guardValue(target) * GUARD_FACTOR);
      damage *= this.rng.range(0.9, 1.1);
      if (crit) damage *= CRIT_DMG + actor.mods.critDmg;
      const low = this.hpRatio(target) <= 0.3;
      if (low && effect.bonusVsLow) damage *= 1 + effect.bonusVsLow;
      if (low && trait === "assassin") damage *= 1.4;
      if (actor.evadeBonus) damage *= 1.4;
      if (frozen) {
        damage *= 1.3;
        target.statuses = target.statuses.filter((s) => s.type !== "freeze");
      }
      if (target.spec.trait === "guardian" && this.has(target, "taunt")) damage *= 0.7;
      damage = Math.max(1, Math.round(damage));

      const dealt = this.applyDamage(target, damage);
      hits.push({ uid: target.uid, damage: dealt, crit });

      // 흡혈
      if (actor.mods.lifesteal > 0 && dealt > 0 && !this.has(actor, "bleed_seal")) {
        actor.hp = Math.min(actor.maxHp, actor.hp + Math.round(dealt * actor.mods.lifesteal));
      }

      // 적중 시 천성 효과
      const perHit = trait === "poison_hand" && multi;
      const key = `${target.uid}`;
      if (target.alive && (perHit || !statusDone.has(key))) {
        if (trait === "poison_hand") {
          this.tryApplyStatus(actor, target, { kind: "status", status: "poison", chance: 1, turns: 3, stacks: 1 }, def, hits);
        }
        if (!statusDone.has(key)) {
          if (trait === "frost") this.tryApplyStatus(actor, target, { kind: "status", status: "freeze", chance: 0.12, turns: 2 }, def, hits);
          if (trait === "acupoint") this.tryApplyStatus(actor, target, { kind: "status", status: "stun", chance: 0.1, turns: 1 }, def, hits);
        }
        statusDone.add(key);
      }

      // 반격 (생존 시, 스킬 1회당 한 번)
      if (target.alive && target.spec.trait === "counter" && !statusDone.has(`counter:${key}`)) {
        statusDone.add(`counter:${key}`);
        const chance = target.counterBoost > 0 ? 1 : 0.25;
        if (this.rng.chance(chance)) this.counterAttack(target, actor);
      }
    }
    actor.firstAttackDone = true;
    actor.evadeBonus = false;
  }

  private counterAttack(unit: Unit, attacker: Unit): void {
    if (!attacker.alive || this.has(unit, "stun") || this.has(unit, "freeze")) return;
    let damage = 0.8 * this.attackValue(unit) * 100 / (100 + this.guardValue(attacker) * GUARD_FACTOR);
    damage = Math.max(1, Math.round(damage * this.rng.range(0.9, 1.1)));
    if (this.has(attacker, "invincible")) damage = 0;
    const dealt = this.applyDamage(attacker, damage);
    this.log(unit, "counter", `${unit.name}의 반격! ${dealt}`, [{ uid: attacker.uid, damage: dealt }]);
    this.resolveDeaths(unit);
  }

  /** 보호막 먼저 흡수, 남은 피해를 기혈에서 뺀다. 실제 기혈 피해를 반환. */
  private applyDamage(target: Unit, damage: number): number {
    const absorbed = Math.min(target.shield, damage);
    target.shield -= absorbed;
    const rest = damage - absorbed;
    this.applyRawDamage(target, rest);
    return rest;
  }

  private applyRawDamage(target: Unit, damage: number): void {
    target.hp -= damage;
    if (target.hp <= 0) {
      target.hp = 0;
      target.alive = false;
    }
    this.checkCrisisShield(target);
  }

  /** 정파 4명: 아군이 처음 기혈 20% 이하가 될 때 팀 전체 보호막 */
  private checkCrisisShield(target: Unit): void {
    const side = this.sides[target.side];
    if (side.factionTier.jeongpa !== 2 || side.crisisShieldUsed || !target.alive) return;
    if (this.hpRatio(target) > 0.2) return;
    side.crisisShieldUsed = true;
    const hits: HitRecord[] = [];
    for (const ally of this.allies(target)) {
      const amount = Math.round(ally.maxHp * 0.15);
      ally.shield += amount;
      hits.push({ uid: ally.uid, shield: amount });
    }
    this.log(target, "buff", "협의(俠義)! 팀 전체에 보호막이 펼쳐진다.", hits);
  }

  private heal(actor: Unit, target: Unit, power: number, hits: HitRecord[], resonance: boolean): void {
    if (!target.alive) return;
    if (this.has(target, "bleed_seal")) {
      hits.push({ uid: target.uid, resisted: "bleed_seal" });
      return;
    }
    let amount = power * this.attackValue(actor);
    if (actor.spec.trait === "healer") amount *= 1.3;
    amount = Math.round(amount);
    const before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + amount);
    hits.push({ uid: target.uid, heal: Math.round(target.hp - before) });
    if (resonance && actor.spec.trait === "healer") {
      const idx = target.statuses.findIndex((s) => DEBUFF_TYPES.includes(s.type));
      if (idx >= 0) target.statuses.splice(idx, 1);
    }
  }

  // ---------------------------------------------------------- 상태이상
  private tryApplyStatus(
    actor: Unit, target: Unit, effect: Extract<SkillEffect, { kind: "status" }>, def: ActiveSkillDef, hits: HitRecord[],
  ): void {
    const hostile = target.side !== actor.side;
    let chance = effect.chance;
    if (hostile && chance < 1) chance += actor.mods.statusChance;
    if (!this.rng.chance(chance)) return;

    let type = effect.status;
    let turns = effect.turns;
    const sideTier = this.sides[actor.side].factionTier;

    if (hostile) {
      if (type === "poison" && target.mods.poisonImmune) {
        hits.push({ uid: target.uid, resisted: type });
        return;
      }
      if (CC_TYPES.includes(type)) {
        if (target.spec.trait === "unshaken") {
          target.unshakenStacks = Math.min(5, target.unshakenStacks + 1);
          hits.push({ uid: target.uid, resisted: type });
          return;
        }
        if (this.has(target, "cc_immune")) {
          hits.push({ uid: target.uid, resisted: type });
          return;
        }
        if (target.mods.firstCcNull && !target.firstCcNullUsed) {
          target.firstCcNullUsed = true;
          hits.push({ uid: target.uid, resisted: type });
          return;
        }
        // 보스: 행동 불가 CC는 둔화로 약화
        if (target.spec.isBoss && (type === "stun" || type === "freeze")) {
          type = "slow";
          turns = 2;
        }
      }
      if (DEBUFF_TYPES.includes(type)) {
        if (sideTier.saeoe === 2) turns += 1;
        if (actor.spec.trait === "acupoint" && def.tags.includes("debuff")) turns += 1;
      }
    } else if ((type === "atk_up" || type === "def_up") && actor.spec.trait === "strategist") {
      turns += 1;
    }

    const value = type === "poison" ? this.attackValue(actor) * POISON_PER_STACK : effect.value ?? 0;
    this.addStatus(target, type, turns, value, effect.stacks ?? 1);
    hits.push({ uid: target.uid, status: type });
  }

  private addStatus(target: Unit, type: StatusType, turns: number, value: number, stacks: number): void {
    const existing = this.has(target, type);
    if (existing) {
      existing.turns = Math.max(existing.turns, turns);
      existing.value = Math.max(existing.value, value);
      existing.stacks = type === "poison" ? Math.min(POISON_MAX_STACKS, existing.stacks + stacks) : 1;
      if (target === this.currentActor) existing.fresh = true;
    } else {
      target.statuses.push({ type, turns, value, stacks: type === "poison" ? stacks : 1, fresh: target === this.currentActor });
    }
  }

  private move(target: Unit, delta: 1 | -1): void {
    const col = target.pos.col + delta;
    if (col < 0 || col > 2) return;
    const occupied = this.units.some((u) => u.alive && u.side === target.side && u.pos.row === target.pos.row && u.pos.col === col);
    if (!occupied) target.pos = { col: col as 0 | 1 | 2, row: target.pos.row };
  }

  // ---------------------------------------------------------- 턴 마무리
  private afterAction(actor: Unit, index: number): void {
    const def = actor.actives[index].def;
    if (actor.spec.trait === "chain") actor.chainStacks = Math.min(8, actor.chainStacks + (def.tags.includes("chain") ? 2 : 1));
    if (actor.mods.regenPct > 0 && actor.alive && !this.has(actor, "bleed_seal")) {
      actor.hp = Math.min(actor.maxHp, actor.hp + Math.round(actor.maxHp * actor.mods.regenPct));
    }
  }

  private endTurn(actor: Unit): void {
    for (const status of actor.statuses) {
      if (status.fresh) status.fresh = false;
      else status.turns -= 1;
    }
    actor.statuses = actor.statuses.filter((s) => s.turns > 0);
    if (actor.counterBoost > 0) actor.counterBoost -= 1;

    // 금강불괴: 자기 턴 종료 시 기혈 30% 미만이면 1회 발동, 다음 턴 종료까지 무적
    if (actor.spec.trait === "vajra" && !actor.vajraUsed && actor.alive && this.hpRatio(actor) < 0.3) {
      actor.vajraUsed = true;
      this.addStatus(actor, "invincible", 1, 0, 1);
      // 턴 종료 처리 뒤에 걸리므로 '이번 턴' 예외를 두지 않는다 → 다음 자기 턴 종료 시 해제.
      this.has(actor, "invincible")!.fresh = false;
      this.log(actor, "trait", `${actor.name}의 금강불괴! 다음 턴이 끝날 때까지 무적.`);
    }
  }

  private resolveDeaths(killer: Unit): void {
    for (const unit of this.units) {
      if (unit.alive || this.deathsLogged.has(unit.uid)) continue;
      this.deathsLogged.add(unit.uid);
      unit.statuses = [];
      unit.shield = 0;
      this.log(unit, "death", `${unit.name} 쓰러짐`);
      if (unit.side === killer.side) continue;
      if (this.sides[killer.side].factionTier.sapa === 2) killer.gauge += 500;
      if (killer.spec.trait === "assassin" && this.lastSkillIndex >= 0) {
        if (killer.actives[this.lastSkillIndex].def.tags.includes("execute")) killer.cooldowns[this.lastSkillIndex] = 0;
      }
    }
  }
}

export function runBattle(teamA: CombatantSpec[], teamB: CombatantSpec[], seed: number): BattleResult {
  return new Battle(teamA, teamB, new Rng(seed)).run();
}
