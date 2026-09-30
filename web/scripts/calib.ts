/**
 * 보스 직전 플레이어 전투 스탯 평균을 잰다 → balance.ts 의 TIER_REFERENCE 보정용.
 *   npm run calib
 */
import { BOSS_DIFFICULTY } from "../src/data/balance";
import { CHARACTERS, getCharacter } from "../src/data/characters";
import { getRegion } from "../src/data/regions";
import { createTraining, currentRegionId, playerCombatant } from "../src/core/training";
import { botStep } from "./bot";

const RUNS = Number(process.argv[2] ?? 100);
// 측정 중에는 보스를 아주 약하게 해서 모든 단계까지 진행시킨다 (성장 곡선만 잰다).
BOSS_DIFFICULTY.fill(0.05);
const acc = [0, 1, 2, 3].map(() => ({ n: 0, atk: 0, guard: 0, vital: 0 }));
for (const c of CHARACTERS) {
  for (let i = 0; i < RUNS; i++) {
    const s = createTraining(c.id, 5000 + i);
    while (s.phase !== "done") {
      if (s.phase === "boss") {
        const a = acc[getRegion(currentRegionId(s)!).tier];
        const spec = playerCombatant(s);
        a.n += 1;
        a.atk += spec.stats[getCharacter(c.id).attackType];
        a.guard += spec.stats.guard;
        a.vital += spec.stats.vital;
      }
      botStep(s);
    }
  }
}
acc.forEach((a, t) => console.log(`tier ${t}: n=${a.n} atk ${Math.round(a.atk / a.n)} guard ${Math.round(a.guard / a.n)} vital ${Math.round(a.vital / a.n)}`));
