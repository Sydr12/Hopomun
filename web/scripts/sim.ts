/**
 * 밸런스 시뮬레이터: 봇이 수련을 끝까지 플레이하고 통계를 낸다.
 *   npm run sim            (캐릭터당 300회)
 *   npm run sim -- 1000    (캐릭터당 1000회)
 */
import { TRAININGS } from "../src/data/balance";
import { CHARACTERS, getCharacter } from "../src/data/characters";
import { STAT_KEYS } from "../src/core/types";
import { play } from "./bot";

const RUNS = Number(process.argv[2] ?? 300);

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%`.padStart(4) : "  - ");
const TIERS = ["초급", "중급", "고급", "최고급"];

console.log(`캐릭터당 ${RUNS}회\n`);
console.log("캐릭터      보스 승률(도달 기준) 초급 중급 고급 최고급 | 시험 | 평균점수 | 등급 분포 범/정/상/절/신");
const gradeTotals: Record<string, number> = {};
for (const character of CHARACTERS) {
  const reach = [0, 0, 0, 0];
  const win = [0, 0, 0, 0];
  let finals = 0;
  let finalWins = 0;
  let scoreSum = 0;
  const grades: Record<string, number> = { 범품: 0, 정품: 0, 상품: 0, 절품: 0, 신품: 0 };
  const statSum = { outer: 0, inner: 0, guard: 0, vital: 0 };
  for (let i = 0; i < RUNS; i++) {
    const s = play(character.id, 1000 + i);
    const r = s.result!;
    for (let t = 0; t < 4; t++) {
      if (s.regions.length > t) reach[t] += 1;
      if (s.bossesDefeated > t) win[t] += 1;
    }
    if (s.finalTest !== "none") finals += 1;
    if (s.finalTest === "win") finalWins += 1;
    scoreSum += r.score;
    grades[r.grade] += 1;
    gradeTotals[r.grade] = (gradeTotals[r.grade] ?? 0) + 1;
    for (const k of STAT_KEYS) statSum[k] += r.stats[k];
  }
  const bossRates = [0, 1, 2, 3].map((t) => pct(win[t], reach[t])).join(" ");
  const dist = Object.values(grades).map((g) => pct(g, RUNS)).join(" ");
  console.log(
    `${character.name.padEnd(6)} ${getCharacter(character.id).attackType.padEnd(5)}            ${bossRates}   | ${pct(finalWins, finals)} | ${String(Math.round(scoreSum / RUNS)).padStart(6)}   | ${dist}`,
  );
  console.log(`      평균 수련 스탯: ${STAT_KEYS.map((k) => `${k} ${Math.round(statSum[k] / RUNS)}`).join(", ")}`);
}
console.log(`\n전체 등급 분포: ${JSON.stringify(gradeTotals)}`);
console.log(`(참고) 훈련 종류: ${TRAININGS.map((t) => t.name).join(", ")} / 난이도: ${TIERS.join(", ")}`);
