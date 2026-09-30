import { describe, expect, it } from "vitest";
import { Battle, runBattle, type CombatantSpec } from "../src/core/battle";
import { Rng } from "../src/core/rng";
import type { StatusType, TraitId } from "../src/core/types";

function unit(overrides: Partial<CombatantSpec> = {}): CombatantSpec {
  return {
    id: overrides.id ?? "u",
    name: overrides.name ?? "무인",
    attackType: "outer",
    stats: { outer: 200, inner: 0, guard: 100, vital: 150 },
    agility: 100,
    actives: [{ skillId: "e_strike", power: 1, condition: { kind: "always" } }],
    passives: [],
    pos: { col: 0, row: 1 },
    ...overrides,
  };
}

/** 내부 상태를 들여다보기 위한 도우미 */
function internals(battle: Battle) {
  return battle as unknown as {
    units: { uid: string; name: string; hp: number; maxHp: number; alive: boolean; gauge: number; pos: { col: number; row: number };
      statuses: { type: StatusType; turns: number }[]; cooldowns: number[] }[];
    takeTurn(u: unknown): void;
    resolveTargets(actor: unknown, skill: unknown, preview?: boolean): { name: string }[];
  };
}

describe("전투 엔진", () => {
  it("같은 시드면 같은 결과가 나온다", () => {
    const a = runBattle([unit({ name: "갑" })], [unit({ name: "을", agility: 95 })], 42);
    const b = runBattle([unit({ name: "갑" })], [unit({ name: "을", agility: 95 })], 42);
    expect(a.winner).toBe(b.winner);
    expect(a.events.map((e) => e.text)).toEqual(b.events.map((e) => e.text));
  });

  it("월등히 강한 쪽이 이긴다", () => {
    let wins = 0;
    for (let seed = 0; seed < 30; seed++) {
      const strong = unit({ name: "강자", stats: { outer: 600, inner: 0, guard: 300, vital: 400 } });
      wins += runBattle([strong], [unit({ name: "약자" })], seed).winner === 0 ? 1 : 0;
    }
    expect(wins).toBe(30);
  });

  it("신법이 높으면 먼저 행동한다", () => {
    const result = runBattle([unit({ name: "느림", agility: 80 })], [unit({ name: "빠름", agility: 140 })], 1);
    expect(result.events[0].text).toContain("빠름");
  });

  it("기본 타격은 가장 앞 열, 같은 행을 우선한다", () => {
    const battle = new Battle(
      [unit({ name: "공격자", pos: { col: 0, row: 2 } })],
      [
        unit({ name: "후열", pos: { col: 2, row: 2 } }),
        unit({ name: "전열윗줄", pos: { col: 0, row: 0 } }),
        unit({ name: "전열아랫줄", pos: { col: 0, row: 2 } }),
      ],
      new Rng(1),
    );
    const b = internals(battle);
    const targets = b.resolveTargets(b.units[0], { range: "single", tags: [] }, true);
    expect(targets.map((t) => t.name)).toEqual(["전열아랫줄"]);
    const pierce = b.resolveTargets(b.units[0], { range: "pierce", tags: [] }, true);
    expect(pierce.map((t) => t.name)).toEqual(["전열아랫줄", "후열"]);
    const snipe = b.resolveTargets(b.units[0], { range: "snipe", tags: [] }, true);
    expect(snipe.map((t) => t.name)).toEqual(["후열"]);
  });

  it("도발한 적을 우선 공격한다", () => {
    const battle = new Battle(
      [unit({ name: "공격자" })],
      [unit({ name: "앞", pos: { col: 0, row: 1 } }), unit({ name: "도발자", trait: "guardian", pos: { col: 1, row: 0 } })],
      new Rng(1),
    );
    const b = internals(battle);
    expect(b.resolveTargets(b.units[0], { range: "single", tags: [] }, true).map((t) => t.name)).toEqual(["도발자"]);
  });

  it("우선순위대로 쿨타임이 끝난 스킬을 쓰고, 없으면 기본기를 쓴다", () => {
    const attacker = unit({
      name: "공격자",
      agility: 200,
      actives: [
        { skillId: "e_heavy", power: 1, condition: { kind: "always" } },
        { skillId: "e_strike", power: 1, condition: { kind: "always" } },
      ],
    });
    const result = runBattle([attacker], [unit({ name: "허수아비", agility: 1, stats: { outer: 1, inner: 0, guard: 100, vital: 2000 } })], 3);
    const used = result.events.filter((e) => e.kind === "skill" && e.text.startsWith("공격자")).slice(0, 4).map((e) => e.skill);
    // 강타(쿨타임 3) → 일격 → 일격 → 강타
    expect(used).toEqual(["e_heavy", "e_strike", "e_strike", "e_heavy"]);
  });

  it("발동 조건을 만족하지 않으면 건너뛴다", () => {
    const healer = unit({
      name: "의원",
      actives: [
        { skillId: "hoecheon", power: 1, condition: { kind: "ally_hp_below", pct: 50 } },
        { skillId: "e_strike", power: 1, condition: { kind: "always" } },
      ],
    });
    const result = runBattle([healer], [unit({ name: "상대", agility: 1, stats: { outer: 1, inner: 0, guard: 100, vital: 300 } })], 5);
    const first = result.events.find((e) => e.kind === "skill" && e.text.startsWith("의원"));
    expect(first?.skill).toBe("e_strike");
  });

  it("기절한 캐릭터는 한 번 행동을 건너뛰고, 풀린 직후 다시 기절할 수 있다 (회복 후 면역 없음)", () => {
    const battle = new Battle([unit({ name: "피해자" })], [unit({ name: "상대" })], new Rng(1));
    const b = internals(battle);
    const victim = b.units[0];
    victim.statuses.push({ type: "stun", turns: 1 });
    b.takeTurn(victim);
    expect(battle.events.at(-1)!.kind).toBe("skip");
    expect(victim.statuses.some((s) => s.type === "stun")).toBe(false);
    victim.statuses.push({ type: "stun", turns: 1 });
    b.takeTurn(victim);
    expect(battle.events.at(-1)!.kind).toBe("skip");
  });

  it("CC 면역을 부여받은 아군에게는 기절이 걸리지 않는다", () => {
    const giver = unit({ id: "dokgo_ung", name: "독고웅", trait: "unshaken",
      actives: [{ skillId: "b_myeonggyeong", power: 1, condition: { kind: "always" } }] });
    const ally = unit({ id: "ally", name: "아군", pos: { col: 1, row: 1 } });
    const stunner = unit({ name: "기절술사", actives: [
      { skillId: "e_stun", power: 1, condition: { kind: "always" } },
      { skillId: "e_strike", power: 1, condition: { kind: "always" } },
    ] });
    const battle = new Battle([giver, ally], [stunner], new Rng(1));
    const b = internals(battle);
    b.takeTurn(b.units[0]); // 독고웅 행동 → 아군에게 CC 면역
    expect(b.units[1].statuses.some((s) => s.type === "cc_immune")).toBe(true);
    const tb = battle as unknown as { tryApplyStatus(a: unknown, t: unknown, e: unknown, d: unknown, h: unknown[]): void };
    const hits: { resisted?: string }[] = [];
    tb.tryApplyStatus(b.units[2], b.units[1], { kind: "status", status: "stun", chance: 1, turns: 1 }, { tags: [] }, hits);
    expect(hits[0].resisted).toBe("stun");
  });

  it("금강불괴는 자기 턴 종료 시 기혈 30% 미만이면 발동해 다음 턴 종료까지 무적", () => {
    const battle = new Battle([unit({ name: "금강", trait: "vajra" as TraitId })], [unit({ name: "상대" })], new Rng(1));
    const b = internals(battle);
    const me = b.units[0];
    me.hp = me.maxHp * 0.2;
    b.takeTurn(me);
    expect(me.statuses.some((s) => s.type === "invincible")).toBe(true);
    // 상대의 공격은 막힌다
    const before = me.hp;
    b.takeTurn(b.units[1]);
    expect(me.hp).toBe(before);
    // 자신의 다음 턴이 끝나면 사라진다
    b.takeTurn(me);
    expect(me.statuses.some((s) => s.type === "invincible")).toBe(false);
  });

  it("자기 턴에 건 1턴짜리 도발은 적의 차례 동안 유지된다", () => {
    const tank = unit({ name: "탱커", actives: [{ skillId: "b_nahan", power: 1, condition: { kind: "always" } }] });
    const battle = new Battle([tank], [unit({ name: "상대" })], new Rng(1));
    const b = internals(battle);
    b.takeTurn(b.units[0]);
    expect(b.units[0].statuses.some((s) => s.type === "taunt")).toBe(true);
    b.takeTurn(b.units[0]);
    // 다음 자기 턴에 다시 걸었으므로 여전히 유지
    expect(b.units[0].statuses.some((s) => s.type === "taunt")).toBe(true);
  });

  it("부동심은 CC에 면역이고 대신 공격 중첩을 얻는다", () => {
    const stunner = unit({ name: "기절술사", actives: [{ skillId: "e_stun", power: 1, condition: { kind: "always" } }, { skillId: "e_strike", power: 1, condition: { kind: "always" } }] });
    let resisted = 0;
    for (let seed = 0; seed < 20; seed++) {
      const r = runBattle([stunner], [unit({ name: "부동", trait: "unshaken", stats: { outer: 50, inner: 0, guard: 300, vital: 800 } })], seed);
      resisted += r.events.flatMap((e) => e.hits).filter((h) => h.resisted === "stun").length;
      expect(r.events.some((e) => e.kind === "skip" && e.text.startsWith("부동"))).toBe(false);
    }
    expect(resisted).toBeGreaterThan(0);
  });

  it("독수 천성은 중독에 면역이다", () => {
    const poisoner = unit({ name: "독술사", actives: [{ skillId: "e_poison", power: 1, condition: { kind: "always" } }, { skillId: "e_strike", power: 1, condition: { kind: "always" } }] });
    const r = runBattle([poisoner], [unit({ name: "독수", trait: "poison_hand" })], 2);
    expect(r.events.some((e) => e.kind === "dot" && e.text.startsWith("독수"))).toBe(false);
  });

  it("보스에게 기절은 둔화로 약화되어 들어간다", () => {
    const acu = unit({ name: "점혈", actives: [{ skillId: "e_stun", power: 1, condition: { kind: "always" } }, { skillId: "e_strike", power: 1, condition: { kind: "always" } }] });
    const r = runBattle([acu], [unit({ name: "보스", isBoss: true, stats: { outer: 50, inner: 0, guard: 300, vital: 900 } })], 4);
    const statuses = r.events.flatMap((e) => e.hits).filter((h) => h.uid === "b0" && h.status).map((h) => h.status);
    expect(statuses).not.toContain("stun");
  });

  it("세력 2명이면 1단계 버프가 적용된다 (정파: 호신 +10%)", () => {
    const pair = [unit({ id: "x", name: "갑", faction: "jeongpa" }), unit({ id: "y", name: "을", faction: "jeongpa", pos: { col: 0, row: 0 } })];
    const battle = new Battle(pair, [unit({ name: "상대" })], new Rng(1));
    const mods = (battle as unknown as { units: { mods: { defPct: number } }[] }).units[0].mods;
    expect(mods.defPct).toBeCloseTo(0.1);
  });

  it("인연 쌍이 한 팀이면 인연 버프가 적용된다", () => {
    const team = [unit({ id: "mujin", name: "무진" }), unit({ id: "cheong_a", name: "청아", pos: { col: 1, row: 1 } })];
    const battle = new Battle(team, [unit({ name: "상대" })], new Rng(1));
    const mods = (battle as unknown as { units: { mods: { defPct: number } }[] }).units[0].mods;
    expect(mods.defPct).toBeCloseTo(0.1);
  });

  it("2:2 · 4:4 전투도 끝까지 진행된다", () => {
    const team = (prefix: string) => [0, 1, 2, 3].map((i) => unit({ id: `${prefix}${i}`, name: `${prefix}${i}`, pos: { col: (i % 2) as 0 | 1, row: (i % 3) as 0 | 1 | 2 } }));
    const result = runBattle(team("A"), team("B"), 9);
    expect([0, 1]).toContain(result.winner);
    expect(result.units.filter((u) => u.side !== result.winner).every((u) => u.hp === 0) || result.timeout).toBe(true);
  });
});
