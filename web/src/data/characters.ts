import type { CharacterDef } from "../core/types";

/**
 * 개발용 임시 캐릭터 8명. 최종 32명 데이터는 별도 데이터 표 작업에서 채운다.
 * 천성 · 세력 · 계열이 고르게 섞이도록 구성했다.
 */
export const CHARACTERS: CharacterDef[] = [
  {
    id: "dang_soha", name: "당소하", faction: "sega", sect: "사천당가", attackType: "outer",
    baseStats: { outer: 70, inner: 30, guard: 42, vital: 52 },
    trainingStart: { outer: 30, inner: 12, guard: 20, vital: 24 },
    agility: 118, trait: "poison_hand", basicSkill: "b_bichim",
    ultimates: ["u_mancheon", "u_sanhwa"], bond: "seol_hwa",
    events: ["ev_dang_1", "ev_dang_2", "ev_dang_3"],
    intro: "당가의 막내. 웃는 얼굴로 독을 다룬다.",
  },
  {
    id: "namgung_hyeon", name: "남궁현", faction: "sega", sect: "남궁세가", attackType: "outer",
    baseStats: { outer: 88, inner: 35, guard: 50, vital: 60 },
    trainingStart: { outer: 33, inner: 14, guard: 22, vital: 25 },
    agility: 108, trait: "swift_blade", basicSkill: "b_ilgeom", startSilver: 180,
    ultimates: ["u_changgung", "u_jewang"], bond: "hyeol_yeong",
    events: ["ev_nam_1", "ev_nam_2", "ev_nam_3"],
    intro: "남궁세가의 소가주. 창궁검법의 후계자.",
  },
  {
    id: "mujin", name: "무진", faction: "jeongpa", sect: "소림사", attackType: "outer",
    baseStats: { outer: 66, inner: 40, guard: 78, vital: 88 },
    trainingStart: { outer: 26, inner: 16, guard: 34, vital: 36 },
    agility: 92, trait: "guardian", basicSkill: "b_nahan",
    ultimates: ["u_geumgang", "u_baekbo"], bond: "cheong_a",
    events: ["ev_mujin_1", "ev_mujin_2", "ev_mujin_3"],
    intro: "소림 나한당의 젊은 무승. 우직하게 동료를 지킨다.",
  },
  {
    id: "seol_hwa", name: "설화", faction: "saeoe", sect: "북해빙궁", attackType: "inner",
    baseStats: { outer: 28, inner: 88, guard: 50, vital: 66 },
    trainingStart: { outer: 10, inner: 38, guard: 26, vital: 30 },
    agility: 112, trait: "frost", basicSkill: "b_hanbing",
    ultimates: ["u_bingbaek", "u_seolhwa"], bond: "dang_soha",
    events: ["ev_seol_1", "ev_seol_2", "ev_seol_3"],
    intro: "빙궁을 떠나 중원에 온 소녀. 말수가 적다.",
  },
  {
    id: "hyeol_yeong", name: "혈영", faction: "magyo", sect: "혈교", attackType: "inner",
    baseStats: { outer: 35, inner: 86, guard: 40, vital: 72 },
    trainingStart: { outer: 12, inner: 40, guard: 24, vital: 38 },
    agility: 104, trait: "blood_art", basicSkill: "b_hyeoljo", startSilver: 0,
    ultimates: ["u_hyeolma", "u_hyeolhae"], bond: "namgung_hyeon",
    events: ["ev_hyeol_1", "ev_hyeol_2", "ev_hyeol_3"],
    intro: "혈교에서 도망친 사내. 자신의 피를 무기로 쓴다.",
  },
  {
    id: "cheong_a", name: "청아", faction: "jeongpa", sect: "무당파", attackType: "inner",
    baseStats: { outer: 30, inner: 72, guard: 60, vital: 64 },
    trainingStart: { outer: 10, inner: 30, guard: 28, vital: 28 },
    agility: 100, trait: "healer", basicSkill: "b_hoechun",
    ultimates: ["u_taeguk", "u_yangui"], bond: "mujin",
    events: ["ev_cheong_1", "ev_cheong_2", "ev_cheong_3"],
    intro: "무당의 여도사. 의술과 태극검을 함께 익혔다.",
  },
  {
    id: "dokgo_ung", name: "독고웅", faction: "sapa", sect: "녹림", attackType: "outer",
    baseStats: { outer: 100, inner: 25, guard: 66, vital: 94 },
    trainingStart: { outer: 58, inner: 10, guard: 38, vital: 50 },
    agility: 98, trait: "unshaken", basicSkill: "b_myeonggyeong",
    ultimates: ["u_cheongang", "u_paewang"], bond: "jegal_yun",
    events: ["ev_dokgo_1", "ev_dokgo_2", "ev_dokgo_3"],
    intro: "녹림의 호걸. 무엇에도 흔들리지 않는다.",
  },
  {
    id: "jegal_yun", name: "제갈윤", faction: "sega", sect: "제갈세가", attackType: "inner",
    baseStats: { outer: 25, inner: 90, guard: 54, vital: 70 },
    trainingStart: { outer: 10, inner: 36, guard: 24, vital: 28 },
    agility: 110, trait: "acupoint", basicSkill: "b_jeomhyeolji",
    ultimates: ["u_paljin", "u_cheongi"], bond: "dokgo_ung",
    events: ["ev_jegal_1", "ev_jegal_2", "ev_jegal_3"],
    intro: "제갈세가의 책사. 혈도와 진법에 밝다.",
  },
];

export const CHARACTER_BY_ID: Record<string, CharacterDef> = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

export function getCharacter(id: string): CharacterDef {
  const character = CHARACTER_BY_ID[id];
  if (!character) throw new Error(`캐릭터 없음: ${id}`);
  return character;
}

/** 인연 쌍 id (알파벳 순으로 정렬해 한쪽에서만 정의) */
export function bondKey(a: string, b: string): string {
  return [a, b].sort().join("+");
}

/** 인연 버프: 팀 전체 특정 능력치 상승 */
export const BOND_BUFFS: Record<string, { stat: "atkPct" | "defPct" | "hpPct" | "speedPct"; value: number; name: string }> = {
  [bondKey("dang_soha", "seol_hwa")]: { stat: "speedPct", value: 0.06, name: "독과 얼음" },
  [bondKey("namgung_hyeon", "hyeol_yeong")]: { stat: "atkPct", value: 0.08, name: "검과 피의 맹세" },
  [bondKey("mujin", "cheong_a")]: { stat: "defPct", value: 0.1, name: "소림과 무당" },
  [bondKey("dokgo_ung", "jegal_yun")]: { stat: "hpPct", value: 0.08, name: "녹림과 책사" },
};
