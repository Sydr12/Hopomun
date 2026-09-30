import type { ActiveSkillDef, PassiveSkillDef, SkillDef } from "../core/types";

/** 보스 보상으로 얻는 액티브 스킬 풀 */
export const POOL_ACTIVES: ActiveSkillDef[] = [
  // ---- 외공 전용
  { id: "pasan", name: "파산권", type: "active", affinity: "outer", tags: [], cooldown: 2, range: "single",
    effects: [{ kind: "damage", power: 1.6 }, { kind: "push" }], desc: "강한 일격 후 대상을 한 칸 밀어낸다." },
  { id: "yeonhwan_sam", name: "연환삼격", type: "active", affinity: "outer", tags: ["multi", "chain"], cooldown: 2, range: "single",
    effects: [{ kind: "damage", power: 0.6, hits: 3 }], desc: "세 번 연달아 벤다." },
  { id: "gwanil", name: "관일창", type: "active", affinity: "outer", tags: [], cooldown: 3, range: "pierce",
    effects: [{ kind: "damage", power: 1.3 }], desc: "한 행의 적을 꿰뚫는다.",
    defaultCondition: { kind: "enemies_in_line", count: 2 } },
  { id: "jeolmyeong", name: "절명섬", type: "active", affinity: "outer", tags: ["execute"], cooldown: 3, range: "lowest",
    effects: [{ kind: "damage", power: 1.5, bonusVsLow: 0.6 }], desc: "가장 약한 적을 노린다. 기혈 30% 이하면 위력 +60%." },
  { id: "cheolsan", name: "철산고", type: "active", affinity: "outer", tags: ["guard"], cooldown: 3, range: "single",
    effects: [{ kind: "damage", power: 1.2 }, { kind: "self_status", status: "def_up", turns: 2, value: 0.25 }],
    desc: "몸으로 부딪친 뒤 호신을 높인다." },
  // ---- 내공 전용
  { id: "hangryong", name: "항룡장", type: "active", affinity: "inner", tags: [], cooldown: 2, range: "single",
    effects: [{ kind: "damage", power: 1.7 }], desc: "용의 기세로 장력을 뿜는다." },
  { id: "hanbing", name: "한빙신장", type: "active", affinity: "inner", tags: ["freeze"], cooldown: 3, range: "single",
    effects: [{ kind: "damage", power: 1.3 }, { kind: "status", status: "freeze", chance: 0.35, turns: 2 }],
    desc: "얼음 장력. 35% 확률로 빙결." },
  { id: "cheonnyeo", name: "천녀산화", type: "active", affinity: "inner", tags: ["multi", "poison"], cooldown: 3, range: "all",
    effects: [{ kind: "damage", power: 0.4, hits: 2 }, { kind: "status", status: "poison", chance: 0.5, turns: 3, stacks: 1 }],
    desc: "꽃잎처럼 흩어지는 장력이 적 전체를 두 번 친다." },
  { id: "ilyang", name: "일양지", type: "active", affinity: "inner", tags: ["debuff"], cooldown: 3, range: "snipe",
    effects: [{ kind: "damage", power: 1.2 }, { kind: "status", status: "seal", chance: 0.5, turns: 2 }],
    desc: "후열의 혈도를 짚는다. 50% 확률로 봉인." },
  { id: "heupseong", name: "흡성장", type: "active", affinity: "inner", tags: ["blood"], cooldown: 3, range: "single",
    effects: [{ kind: "hp_cost", ratio: 0.08 }, { kind: "damage", power: 2.0 }], desc: "기혈을 태워 강하게 친다." },
  // ---- 공용
  { id: "sajahu", name: "사자후", type: "active", affinity: "common", tags: ["taunt", "debuff"], cooldown: 4, range: "all",
    effects: [{ kind: "gauge", amount: -200 }, { kind: "self_status", status: "taunt", turns: 2 }],
    desc: "포효로 적의 기세를 꺾고 자신에게 시선을 끈다." },
  { id: "geumjong", name: "금종조", type: "active", affinity: "common", tags: ["shield"], cooldown: 4, range: "self",
    effects: [{ kind: "shield", ratio: 0.25 }], desc: "황금 종 같은 보호막을 두른다.",
    defaultCondition: { kind: "ally_hp_below", pct: 70 } },
  { id: "hoecheon", name: "회천수", type: "active", affinity: "common", tags: ["heal"], cooldown: 3, range: "ally_lowest",
    effects: [{ kind: "heal", power: 1.2 }], desc: "기혈이 가장 낮은 아군을 치료한다.",
    defaultCondition: { kind: "ally_hp_below", pct: 60 } },
  { id: "gomu", name: "고무진결", type: "active", affinity: "common", tags: ["buff"], cooldown: 4, range: "allies",
    effects: [{ kind: "status", status: "atk_up", chance: 1, turns: 2, value: 0.2 }], desc: "아군 전체 공격 +20%." },
  { id: "noejeong", name: "뇌정견인", type: "active", affinity: "common", tags: [], cooldown: 3, range: "snipe",
    effects: [{ kind: "damage", power: 1.0 }, { kind: "pull" }], desc: "후열의 적을 끌어당긴다." },
  { id: "cheongsim", name: "청심결", type: "active", affinity: "common", tags: ["immune"], cooldown: 4, range: "ally_cc",
    effects: [{ kind: "cleanse" }, { kind: "status", status: "cc_immune", chance: 1, turns: 2 }],
    desc: "아군의 CC를 풀고 2턴간 면역.", defaultCondition: { kind: "ally_cc" } },
  { id: "pokwoo", name: "폭우이화침", type: "active", affinity: "common", tags: ["multi", "poison"], cooldown: 3, range: "snipe",
    effects: [{ kind: "damage", power: 0.35, hits: 4 }, { kind: "status", status: "poison", chance: 0.4, turns: 3, stacks: 1 }],
    desc: "후열에 독침 네 발." },
  { id: "yuunbo", name: "유운보", type: "active", affinity: "common", tags: ["evade"], cooldown: 3, range: "single",
    effects: [{ kind: "damage", power: 0.9 }, { kind: "self_status", status: "def_up", turns: 1, value: 0.4 }],
    desc: "흘러가듯 피하며 친다." },
  { id: "honran", name: "섭혼대법", type: "active", affinity: "common", tags: ["debuff"], cooldown: 4, range: "single",
    effects: [{ kind: "damage", power: 0.8 }, { kind: "status", status: "confuse", chance: 0.5, turns: 1 }],
    desc: "정신을 흐려 50% 확률로 혼란." },
  { id: "bonghyeol", name: "봉혈수", type: "active", affinity: "common", tags: ["debuff"], cooldown: 3, range: "single",
    effects: [{ kind: "damage", power: 1.0 }, { kind: "status", status: "bleed_seal", chance: 0.8, turns: 3 }],
    desc: "혈맥을 막아 회복을 봉한다." },
];

/** 보스 보상으로 얻는 패시브 스킬 풀 */
export const POOL_PASSIVES: PassiveSkillDef[] = [
  { id: "neungpa", name: "능파미보", type: "passive", affinity: "common", tags: ["evade"], mods: { speedPct: 0.15 }, desc: "신법 +15%" },
  { id: "chosangbi", name: "초상비", type: "passive", affinity: "common", tags: ["first"], mods: { startGauge: 300 }, desc: "전투 시작 게이지 +30%" },
  { id: "ihyeong", name: "이형환위", type: "passive", affinity: "common", tags: ["evade"], mods: { dodge: 0.08, evadeGauge: 200 }, desc: "회피 +8%, 회피 시 게이지 +20%" },
  { id: "geumgangche", name: "금강체", type: "passive", affinity: "common", tags: ["shield", "guard"], mods: { defPct: 0.15 }, desc: "호신 +15%" },
  { id: "budong", name: "부동명왕", type: "passive", affinity: "common", tags: ["immune"], mods: { firstCcNull: true }, desc: "전투당 첫 CC 1회 무효" },
  { id: "taeguk", name: "태극심법", type: "passive", affinity: "common", tags: ["heal"], mods: { regenPct: 0.04 }, desc: "행동마다 최대 기혈 4% 회복" },
  { id: "mandok", name: "만독불침", type: "passive", affinity: "common", tags: ["poison"], mods: { poisonImmune: true, statusChance: 0.1 }, desc: "중독 면역, 상태이상 확률 +10%" },
  { id: "heupseong_p", name: "흡성대법", type: "passive", affinity: "inner", tags: ["blood"], mods: { lifesteal: 0.12 }, desc: "가한 피해의 12% 흡혈" },
  { id: "guyang", name: "구양신공", type: "passive", affinity: "inner", tags: [], mods: { hpPct: 0.2 }, desc: "최대 기혈 +20%" },
  { id: "cheonma", name: "천마심결", type: "passive", affinity: "inner", tags: ["blood"], mods: { atkPct: 0.15, critDmg: 0.2 }, desc: "공격 +15%, 치명 피해 +20%" },
  { id: "pageom", name: "파검식", type: "passive", affinity: "outer", tags: ["execute"], mods: { critRate: 0.12 }, desc: "치명타율 +12%" },
  { id: "cheolpo", name: "철포삼", type: "passive", affinity: "outer", tags: ["guard"], mods: { defPct: 0.2, hpPct: 0.05 }, desc: "호신 +20%, 기혈 +5%" },
  { id: "gwangpung", name: "광풍쾌검", type: "passive", affinity: "outer", tags: ["multi"], mods: { extraHits: 1 }, desc: "다단 스킬 타격 +1" },
  { id: "paeryeok", name: "패력신공", type: "passive", affinity: "outer", tags: [], mods: { atkPct: 0.18 }, desc: "공격 +18%" },
];

/** 캐릭터 고유 기본 액티브 (쿨타임 0) */
export const BASIC_SKILLS: ActiveSkillDef[] = [
  { id: "b_bichim", name: "비침삼연", type: "active", affinity: "common", tags: ["multi", "poison"], cooldown: 0, range: "single",
    effects: [{ kind: "damage", power: 0.36, hits: 3 }], desc: "독침 세 발" },
  { id: "b_ilgeom", name: "일검삼영", type: "active", affinity: "common", tags: ["multi"], cooldown: 0, range: "single",
    effects: [{ kind: "damage", power: 0.3, hits: 3 }], desc: "눈에 보이지 않는 세 번의 베기" },
  { id: "b_nahan", name: "나한권", type: "active", affinity: "common", tags: ["taunt"], cooldown: 0, range: "single",
    effects: [{ kind: "damage", power: 1.0 }, { kind: "self_status", status: "taunt", turns: 1 }], desc: "정직한 권격, 적의 시선을 끈다." },
  { id: "b_hanbing", name: "한빙장", type: "active", affinity: "common", tags: ["freeze"], cooldown: 0, range: "single",
    effects: [{ kind: "damage", power: 1.2 }], desc: "냉기를 머금은 장법" },
  { id: "b_hyeoljo", name: "혈조", type: "active", affinity: "common", tags: ["blood"], cooldown: 0, range: "single",
    effects: [{ kind: "hp_cost", ratio: 0.04 }, { kind: "damage", power: 1.05 }], desc: "피를 태워 할퀸다." },
  { id: "b_hoechun", name: "회춘장", type: "active", affinity: "common", tags: ["heal"], cooldown: 0, range: "single",
    effects: [{ kind: "damage", power: 0.85 }, { kind: "heal_ally", power: 0.45 }], desc: "공격하고, 기혈이 가장 낮은 아군을 조금 치료한다." },
  { id: "b_bando", name: "발도참", type: "active", affinity: "common", tags: ["first"], cooldown: 0, range: "single",
    effects: [{ kind: "damage", power: 1.1 }], desc: "칼집에서 뽑는 순간 벤다." },
  { id: "b_bantan", name: "반탄장", type: "active", affinity: "common", tags: ["counter"], cooldown: 0, range: "single",
    effects: [{ kind: "damage", power: 0.9 }, { kind: "self_status", status: "def_up", turns: 1, value: 0.2 }], desc: "막고 되받아친다." },
];

/** 캐릭터 고유 필살기 (초기 쿨타임 있음) */
export const ULTIMATES: ActiveSkillDef[] = [
  { id: "u_mancheon", name: "만천화우", type: "active", affinity: "common", tags: ["multi", "poison"], cooldown: 6, initialCooldown: 3, range: "all",
    effects: [{ kind: "damage", power: 0.45, hits: 5 }], desc: "하늘을 뒤덮는 암기의 비" },
  { id: "u_sanhwa", name: "산화비침", type: "active", affinity: "common", tags: ["multi", "poison"], cooldown: 5, initialCooldown: 2, range: "snipe",
    effects: [{ kind: "damage", power: 0.5, hits: 6 }], desc: "한 점을 향한 여섯 발의 독침" },
  { id: "u_changgung", name: "창궁무애검", type: "active", affinity: "common", tags: ["multi"], cooldown: 6, initialCooldown: 3, range: "pierce",
    effects: [{ kind: "damage", power: 0.7, hits: 4 }], desc: "하늘을 가르는 네 줄기 검기" },
  { id: "u_jewang", name: "제왕검형", type: "active", affinity: "common", tags: [], cooldown: 5, initialCooldown: 2, range: "single",
    effects: [{ kind: "damage", power: 3.2 }], desc: "제왕의 일검" },
  { id: "u_geumgang", name: "금강부동신법", type: "active", affinity: "common", tags: ["shield", "taunt"], cooldown: 6, initialCooldown: 3, range: "allies",
    effects: [{ kind: "shield", ratio: 0.3 }], desc: "아군 전체에 금강의 보호막" },
  { id: "u_baekbo", name: "백보신권", type: "active", affinity: "common", tags: [], cooldown: 5, initialCooldown: 2, range: "pierce",
    effects: [{ kind: "damage", power: 2.4 }, { kind: "status", status: "stun", chance: 0.5, turns: 1 }], desc: "백 보 밖까지 닿는 권경" },
  { id: "u_bingbaek", name: "빙백신장", type: "active", affinity: "common", tags: ["freeze"], cooldown: 6, initialCooldown: 3, range: "all",
    effects: [{ kind: "damage", power: 1.4 }, { kind: "status", status: "freeze", chance: 0.4, turns: 2 }], desc: "모든 것을 얼리는 장력" },
  { id: "u_seolhwa", name: "설화난무", type: "active", affinity: "common", tags: ["freeze", "multi"], cooldown: 5, initialCooldown: 2, range: "single",
    effects: [{ kind: "damage", power: 0.6, hits: 5 }], desc: "눈꽃처럼 흩날리는 연격" },
  { id: "u_hyeolma", name: "혈마천강", type: "active", affinity: "common", tags: ["blood"], cooldown: 6, initialCooldown: 3, range: "all",
    effects: [{ kind: "hp_cost", ratio: 0.15 }, { kind: "damage", power: 2.2 }], desc: "피의 폭풍" },
  { id: "u_hyeolhae", name: "혈해표류", type: "active", affinity: "common", tags: ["blood"], cooldown: 5, initialCooldown: 2, range: "lowest",
    effects: [{ kind: "damage", power: 2.8, bonusVsLow: 0.5 }], desc: "피바다에 빠뜨린다." },
  { id: "u_taeguk", name: "태극회생", type: "active", affinity: "common", tags: ["heal"], cooldown: 6, initialCooldown: 3, range: "allies",
    effects: [{ kind: "heal", power: 1.6 }, { kind: "cleanse" }], desc: "아군 전체 치료 + 상태이상 해제" },
  { id: "u_yangui", name: "양의검", type: "active", affinity: "common", tags: [], cooldown: 5, initialCooldown: 2, range: "single",
    effects: [{ kind: "damage", power: 2.6 }, { kind: "status", status: "atk_down", chance: 1, turns: 2, value: 0.25 }], desc: "음양의 검로가 적의 기세를 꺾는다." },
];

/** 보스 · 적 전용 스킬 */
export const ENEMY_SKILLS: ActiveSkillDef[] = [
  { id: "e_strike", name: "일격", type: "active", affinity: "common", tags: [], cooldown: 0, range: "single",
    effects: [{ kind: "damage", power: 1.0 }], desc: "평범한 공격" },
  { id: "e_heavy", name: "강타", type: "active", affinity: "common", tags: [], cooldown: 3, range: "single",
    effects: [{ kind: "damage", power: 1.8 }], desc: "힘을 실은 공격" },
  { id: "e_poison", name: "독장", type: "active", affinity: "common", tags: ["poison"], cooldown: 2, range: "single",
    effects: [{ kind: "damage", power: 0.9 }, { kind: "status", status: "poison", chance: 0.8, turns: 3, stacks: 2 }], desc: "독이 스민 장법" },
  { id: "e_freeze", name: "한빙기", type: "active", affinity: "common", tags: ["freeze"], cooldown: 3, range: "single",
    effects: [{ kind: "damage", power: 1.1 }, { kind: "status", status: "freeze", chance: 0.4, turns: 2 }], desc: "냉기" },
  { id: "e_stun", name: "금강권", type: "active", affinity: "common", tags: [], cooldown: 3, range: "single",
    effects: [{ kind: "damage", power: 1.2 }, { kind: "status", status: "stun", chance: 0.4, turns: 1 }], desc: "기절시키는 권격" },
  { id: "e_drain", name: "흡혈조", type: "active", affinity: "common", tags: ["blood"], cooldown: 3, range: "single",
    effects: [{ kind: "damage", power: 1.4 }], desc: "피를 빨아들인다" },
  { id: "e_guard", name: "호체강기", type: "active", affinity: "common", tags: ["shield"], cooldown: 4, range: "self",
    effects: [{ kind: "shield", ratio: 0.15 }], desc: "보호막" },
  { id: "e_multi", name: "난격", type: "active", affinity: "common", tags: ["multi"], cooldown: 3, range: "single",
    effects: [{ kind: "damage", power: 0.5, hits: 4 }], desc: "어지러운 연타" },
];

const ALL: SkillDef[] = [...POOL_ACTIVES, ...POOL_PASSIVES, ...BASIC_SKILLS, ...ULTIMATES, ...ENEMY_SKILLS];
export const SKILLS: Record<string, SkillDef> = Object.fromEntries(ALL.map((s) => [s.id, s]));

export function getActive(id: string): ActiveSkillDef {
  const skill = SKILLS[id];
  if (!skill || skill.type !== "active") throw new Error(`액티브 스킬 없음: ${id}`);
  return skill;
}

export function getPassive(id: string): PassiveSkillDef {
  const skill = SKILLS[id];
  if (!skill || skill.type !== "passive") throw new Error(`패시브 스킬 없음: ${id}`);
  return skill;
}
