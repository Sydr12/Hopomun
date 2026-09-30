/** 캐릭터 × 보스별 승률과 보스 직전 스탯 (밸런스 진단용) */
import { CHARACTERS, getCharacter } from "../src/data/characters";
import { getRegion } from "../src/data/regions";
import * as T from "../src/core/training";
import { botStep } from "./bot";

const RUNS = Number(process.argv[2] ?? 100);
for (const c of CHARACTERS) {
  const per: Record<string, { n: number; w: number; atk: number; guard: number; vital: number; turns: number }> = {};
  for (let i = 0; i < RUNS; i++) {
    const s = T.createTraining(c.id, 9000 + i);
    while (s.phase !== "done") {
      if (s.phase === "boss") {
        const region = getRegion(T.currentRegionId(s)!);
        const spec = T.playerCombatant(s);
        const r = (per[region.boss.name] ??= { n: 0, w: 0, atk: 0, guard: 0, vital: 0, turns: 0 });
        r.n += 1;
        r.atk += spec.stats[getCharacter(c.id).attackType];
        r.guard += spec.stats.guard;
        r.vital += spec.stats.vital;
        const res = T.fightBoss(s);
        if (res.success) r.w += 1;
        r.turns += res.battle!.actions;
        continue;
      }
      botStep(s);
    }
  }
  console.log(`\n${c.name} (${c.attackType}, 신법 ${c.agility}, ${c.trait})`);
  for (const [boss, r] of Object.entries(per)) {
    console.log(`  ${boss.padEnd(8)} n=${String(r.n).padStart(3)} 승률 ${String(Math.round((r.w / r.n) * 100)).padStart(3)}%  atk ${Math.round(r.atk / r.n)} guard ${Math.round(r.guard / r.n)} vital ${Math.round(r.vital / r.n)}  평균 행동수 ${Math.round(r.turns / r.n)}`);
  }
}
