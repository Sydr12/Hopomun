/** 시뮬레이션용 봇: 무난한 플레이어처럼 수련을 진행한다. */
import { getCharacter } from "../src/data/characters";
import { ITEMS } from "../src/data/items";
import { getRegion } from "../src/data/regions";
import type { TrainingId } from "../src/data/balance";
import {
  chooseRegion, chooseSkill, createTraining, currentEvent, failRate, fightBoss, finalTest, premiumRestCost, quest,
  resolveEvent, rest, returnHome, shopBuy, shopClose, train, type TrainingState,
} from "../src/core/training";
import { SKILL_GRADES } from "../src/core/types";

function pickRegion(state: TrainingState): string {
  const attack = getCharacter(state.characterId).attackType;
  const options = state.regionOptions.map(getRegion);
  return (options.find((r) => r.focus.includes(attack)) ?? options[0]).id;
}

function score(state: TrainingState, gains: Partial<Record<string, number>>): number {
  const attack = getCharacter(state.characterId).attackType;
  return Object.entries(gains).reduce((sum, [k, v]) => sum + (v ?? 0) * (k === attack ? 1.4 : k === "outer" || k === "inner" ? 0 : 1), 0);
}

export function botStep(state: TrainingState): void {
  switch (state.phase) {
    case "choose_region":
      return chooseRegion(state, pickRegion(state));
    case "event": {
      const event = currentEvent(state)!;
      let best = 0;
      let bestScore = -Infinity;
      event.choices.forEach((c, i) => {
        const s = score(state, c.effects.stats ?? {}) + (c.effects.stamina ?? 0) * 0.4 + (c.effects.silver ?? 0) * 0.15;
        if (s > bestScore) [best, bestScore] = [i, s];
      });
      resolveEvent(state, best);
      return;
    }
    case "shop": {
      const attack = getCharacter(state.characterId).attackType;
      state.shop!.offers.forEach((offer, i) => {
        if (offer.sold || offer.price > state.silver) return;
        if (offer.kind === "evolve") return void shopBuy(state, i);
        const item = ITEMS.find((it) => it.id === offer.itemId)!;
        const useful = item.stamina ? state.stamina < 60 : Object.keys(item.stats ?? {}).some((k) => k === attack || k === "guard" || k === "vital");
        if (useful) shopBuy(state, i);
      });
      shopClose(state);
      return;
    }
    case "action": {
      if (state.stamina < 45) {
        if (state.silver >= premiumRestCost(state) * 2) rest(state, true);
        else if (state.silver < 40 && state.stamina >= 30) quest(state);
        else rest(state);
        return;
      }
      // 목표 비율(공격 1 : 기혈 0.7 : 호신 0.5)에서 가장 모자란 쪽을 훈련한다.
      const attack = getCharacter(state.characterId).attackType;
      const target: Record<string, number> = { [attack]: 1, vital: 0.7, guard: 0.5 };
      const best = (Object.keys(target) as TrainingId[]).reduce((a, b) =>
        state.stats[a as never] / target[a] <= state.stats[b as never] / target[b] ? a : b);
      if (failRate(state) > 0.2) return void rest(state);
      train(state, best);
      return;
    }
    case "boss":
      fightBoss(state);
      return;
    case "skill_choice": {
      const c = state.skillChoice!.candidates;
      const order = (g: string) => SKILL_GRADES.indexOf(g as never);
      const best = c.reduce((bi, s, i) => (order(s.grade) > order(c[bi].grade) ? i : bi), 0);
      chooseSkill(state, best);
      return;
    }
    case "return":
      returnHome(state);
      return;
    case "final":
      finalTest(state);
      return;
    case "done":
      return;
  }
}

export function play(characterId: string, seed: number): TrainingState {
  const state = createTraining(characterId, seed);
  let guard = 0;
  while (state.phase !== "done") {
    botStep(state);
    if (++guard > 500) throw new Error("무한 루프");
  }
  return state;
}

