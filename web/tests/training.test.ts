import { describe, expect, it } from "vitest";
import { FINAL_TURN, MAX_STAMINA } from "../src/data/balance";
import { CHARACTERS } from "../src/data/characters";
import { getRegion, regionsOfTier } from "../src/data/regions";
import { POOL_ACTIVES, POOL_PASSIVES } from "../src/data/skills";
import { Rng } from "../src/core/rng";
import { buildFromShimdeuk, gradeOf, shimdeukName, storeShimdeuk, SHIMDEUK_SLOTS } from "../src/core/shimdeuk";
import { characterCombatant } from "../src/core/combatants";
import {
  chooseRegion, chooseSkill, createTraining, failRate, fightBoss, playerCombatant, rest, rollSkillCandidates, shopBuy, shopClose,
  shopReroll, train, trainingLevel, type TrainingState,
} from "../src/core/training";
import type { Shimdeuk } from "../src/core/types";
import { play } from "../scripts/bot";

/** 이벤트 · 상점을 넘기고 행동 단계까지 진행 */
function toAction(state: TrainingState): void {
  while (state.phase === "event" || state.phase === "shop") {
    if (state.phase === "event") {
      state.eventQueue.shift();
      state.phase = state.shop ? "shop" : "action";
    } else shopClose(state);
  }
}

function started(characterId = "dang_soha", seed = 7): TrainingState {
  const state = createTraining(characterId, seed);
  chooseRegion(state, state.regionOptions[0]);
  toAction(state);
  return state;
}

describe("수련", () => {
  it("수련 초기 스탯에서 시작하고 초급 지역 2곳 중 하나를 고른다", () => {
    const state = createTraining("seol_hwa", 1);
    expect(state.phase).toBe("choose_region");
    expect(state.regionOptions).toEqual(regionsOfTier(0).map((r) => r.id));
    expect(state.stats).toEqual(CHARACTERS.find((c) => c.id === "seol_hwa")!.trainingStart);
    expect(state.stamina).toBe(MAX_STAMINA);
  });

  it("훈련은 기력을 소모하고 능력치와 경험치를 올린다", () => {
    const state = started();
    const before = state.stats.outer;
    const result = train(state, "outer");
    expect(result.gains.outer).toBeGreaterThan(0);
    expect(state.stats.outer).toBe(before + result.gains.outer!);
    expect(state.stamina).toBe(80);
    expect(state.trainingExp.outer).toBe(1);
    expect(state.turn).toBe(2);
  });

  it("실패 확률은 훈련 후 예상 기력 기준이라 훈련마다 다르다", () => {
    const state = started();
    state.stamina = 40; // 외공 -20 → 20, 호신 -18 → 22, 명상 +10 → 50
    expect(failRate(state, "outer")).toBeCloseTo(0.2);
    expect(failRate(state, "guard")).toBeCloseTo(0.16);
    expect(failRate(state, "meditate")).toBe(0);
    state.stamina = 60;
    expect(failRate(state, "outer")).toBe(0);
    state.stamina = 0;
    expect(failRate(state, "outer")).toBeCloseTo(0.9);

    let sawFailure = false;
    for (let seed = 0; seed < 40 && !sawFailure; seed++) {
      const s = started("dang_soha", seed);
      s.stamina = 0;
      const r = train(s, "outer");
      if (!r.success) {
        sawFailure = true;
        expect(r.gains.outer).toBeGreaterThan(0);
        expect(s.trainingExp.outer).toBe(1);
      }
    }
    expect(sawFailure).toBe(true);
  });

  it("시작 자금은 기본 50, 캐릭터에 따라 다르다", () => {
    expect(createTraining("dang_soha", 1).silver).toBe(50);
    expect(createTraining("namgung_hyeon", 1).silver).toBe(180);
    expect(createTraining("hyeol_yeong", 1).silver).toBe(0);
  });

  it("같은 훈련을 반복하면 레벨이 오른다", () => {
    const state = started();
    state.trainingExp.guard = 1;
    expect(trainingLevel(state, "guard")).toBe(1);
    state.trainingExp.guard = 2;
    expect(trainingLevel(state, "guard")).toBe(2);
  });

  it("명상은 기력을 소모하지 않고 회복한다", () => {
    const state = started();
    state.stamina = 50;
    train(state, "meditate");
    expect(state.stamina).toBe(60);
  });

  it("고급 휴식은 은자가 필요하다", () => {
    const state = started();
    state.silver = 0;
    expect(() => rest(state, true)).toThrow();
    state.stamina = 10;
    rest(state);
    expect(state.stamina).toBeGreaterThan(10);
  });

  it("10턴째는 보스전이고, 지면 즉시 수련이 끝나 심득이 만들어진다", () => {
    const state = started();
    state.turn = 10;
    state.phase = "boss";
    state.stats = { outer: 1, inner: 1, guard: 1, vital: 1 };
    const result = fightBoss(state);
    expect(result.success).toBe(false);
    expect(state.phase).toBe("done");
    expect(state.result).not.toBeNull();
    expect(state.result!.finalTest).toBe("none");
  });

  it("보스를 이기면 스킬 3개 중 하나를 골라 다음 난이도 지역을 고른다", () => {
    const state = started();
    state.turn = 10;
    state.phase = "boss";
    state.stats = { outer: 2000, inner: 0, guard: 1000, vital: 1000 };
    const silverBefore = state.silver;
    const result = fightBoss(state);
    expect(result.success).toBe(true);
    expect(state.silver).toBe(silverBefore + 60);
    expect(state.phase).toBe("skill_choice");
    expect(state.skillChoice!.slot).toBe("active1");
    expect(state.skillChoice!.candidates).toHaveLength(3);
    const picked = chooseSkill(state, 0);
    expect(picked.acquired?.kind).toBe("skill");
    expect(state.skills.active1).toBeDefined();
    expect(state.phase).toBe("choose_region");
    expect(state.regionOptions).toEqual(regionsOfTier(1).map((r) => r.id));
  });

  it("스킬 후보는 계열에 맞는 것만 나온다", () => {
    const state = createTraining("seol_hwa", 3); // 내공 계열
    const rng = new Rng(5);
    for (let i = 0; i < 30; i++) {
      for (const slot of ["active1", "passive1"] as const) {
        for (const c of rollSkillCandidates(state, slot, rng)) {
          const def = [...POOL_ACTIVES, ...POOL_PASSIVES].find((s) => s.id === c.id)!;
          expect(def.affinity === "common" || def.affinity === "inner").toBe(true);
        }
      }
    }
  });

  it("상점: 구매 · 리롤 · 초급 전 상점에는 진화권이 없다", () => {
    const state = started();
    state.turn = 5;
    state.phase = "shop";
    state.silver = 1000;
    state.shop = { offers: [{ kind: "item", itemId: "oegong_hwan", price: 60, sold: false }], rerolls: 0 };
    const before = state.stats.outer;
    shopBuy(state, 0);
    expect(state.stats.outer).toBe(before + 15);
    expect(state.silver).toBe(940);
    expect(() => shopBuy(state, 0)).toThrow();
    for (let i = 0; i < 30; i++) {
      state.silver = 10000;
      shopReroll(state);
      expect(state.shop!.offers.some((o) => o.kind === "evolve")).toBe(false);
    }
  });

  it("저장 데이터(JSON)로 이어해도 결과가 같다", () => {
    const a = createTraining("hyeol_yeong", 99);
    const b = JSON.parse(JSON.stringify(a)) as TrainingState;
    for (const s of [a, b]) {
      chooseRegion(s, "janggang");
      toAction(s);
      train(s, "inner");
      toAction(s);
      train(s, "vital");
    }
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it.each(CHARACTERS.map((c) => c.id))("%s: 수련을 끝까지 진행하면 심득이 완성된다", (id) => {
    for (let seed = 0; seed < 5; seed++) {
      const s = play(id, seed);
      expect(s.phase).toBe("done");
      const r = s.result!;
      expect(r.characterId).toBe(id);
      expect(r.name).toMatch(/심득$/);
      if (s.finalTest !== "none") {
        expect(s.turn).toBe(FINAL_TURN);
        expect(r.skills.ultimate).toBeDefined();
        expect(CHARACTERS.find((c) => c.id === id)!.ultimates).toContain(r.skills.ultimate!.id);
      }
      expect(r.priority.at(-1)!.slot).toBe("basic");
    }
  });
});

describe("기본 스탯과 수련 스탯", () => {
  it("수련 안의 전투는 수련 스탯만 쓴다 (기본 스탯 미포함)", () => {
    const state = createTraining("namgung_hyeon", 1);
    const spec = playerCombatant(state);
    expect(spec.stats).toEqual(CHARACTERS.find((c) => c.id === "namgung_hyeon")!.trainingStart);
  });

  it("심득을 적용하면 기본 스탯 + 심득 수련 스탯이 된다", () => {
    const s = play("namgung_hyeon", 3);
    const base = CHARACTERS.find((c) => c.id === "namgung_hyeon")!.baseStats;
    const spec = characterCombatant(buildFromShimdeuk(s.result!));
    expect(spec.stats.outer).toBe(base.outer + s.result!.stats.outer);
    expect(spec.stats.vital).toBe(base.vital + s.result!.stats.vital);
  });
});

describe("심득", () => {
  it("이름은 최고급 + 고급 지역 이름을 붙인다", () => {
    expect(shimdeukName(["heukpung", "nahan", "binggung", "hyeolji"])).toBe("혈지빙궁 심득");
    expect(shimdeukName(["heukpung", "dokgok", "dokchung", "geomchong"])).toBe("검총독충 심득");
    expect(shimdeukName(["janggang", "nahan", "nakan", "daesan"])).toBe("대산낙안 심득");
    expect(shimdeukName(["heukpung", "nahan"])).toBe("나한흑풍 심득");
    expect(getRegion("daesan").short).toBe("대산");
  });

  it("점수에 따라 등급이 매겨진다", () => {
    expect(gradeOf(0)).toBe("범품");
    expect(gradeOf(5000)).toBe("신품");
  });

  it("캐릭터당 5개까지만 보관된다", () => {
    let storage: Shimdeuk[] = [];
    const base = play("mujin", 1).result!;
    for (let i = 0; i < SHIMDEUK_SLOTS; i++) storage = storeShimdeuk(storage, { ...base, id: `m${i}` });
    expect(() => storeShimdeuk(storage, { ...base, id: "m5" })).toThrow();
    expect(storeShimdeuk(storage, { ...play("cheong_a", 1).result! }).length).toBe(SHIMDEUK_SLOTS + 1);
  });
});
