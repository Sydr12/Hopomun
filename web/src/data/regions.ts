import type { AttackType, FactionId, PassiveMods, StatKey, TraitId } from "../core/types";

export interface BossDef {
  id: string;
  name: string;
  title: string;
  attackType: AttackType;
  /** 능력치 = 난이도 기준 스탯(TIER_REFERENCE) × 비율 × 난이도 계수 */
  profile: { atk: number; guard: number; vital: number };
  agility: number;
  skills: string[]; // 우선순위 순서 (마지막은 기본기)
  trait?: TraitId;
  mods?: PassiveMods;
}

export interface RegionDef {
  id: string;
  name: string;
  /** 심득 이름에 쓰는 두 글자 */
  short: string;
  tier: 0 | 1 | 2 | 3;
  focus: StatKey[];
  homeFaction: FactionId;
  boss: BossDef;
  questFoes: string[];
  desc: string;
}

export const TIER_NAMES = ["초급", "중급", "고급", "최고급"] as const;

export const REGIONS: RegionDef[] = [
  // ---------------------------------------------------------------- 초급
  { id: "heukpung", name: "흑풍채 산채", short: "흑풍", tier: 0, focus: ["outer", "vital"], homeFaction: "sapa",
    desc: "산적 떼가 들끓는 험준한 산채.", questFoes: ["흑풍채 졸개", "산적 두목", "도망친 산적"],
    boss: { id: "boss_maung", name: "마웅", title: "흑풍채주 '철권'", attackType: "outer",
      profile: { atk: 1.15, guard: 0.9, vital: 1.3 }, agility: 95, skills: ["e_heavy", "e_strike"] } },
  { id: "janggang", name: "장강 나루터", short: "장강", tier: 0, focus: ["inner", "guard"], homeFaction: "sapa",
    desc: "수적이 오가는 장강의 나루.", questFoes: ["수적", "밀수꾼", "뱃사공 행세 자객"],
    boss: { id: "boss_jangsam", name: "장삼", title: "수적 두목 '물귀신'", attackType: "inner",
      profile: { atk: 1.05, guard: 1.0, vital: 1.2 }, agility: 105, skills: ["e_multi", "e_strike"] } },
  // ---------------------------------------------------------------- 중급
  { id: "nahan", name: "소림 나한당", short: "나한", tier: 1, focus: ["outer", "guard"], homeFaction: "jeongpa",
    desc: "십팔동인이 지키는 소림의 수련장.", questFoes: ["나한승", "무승", "파계승"],
    boss: { id: "boss_dongin", name: "십팔동인", title: "소림 나한당의 진법", attackType: "outer",
      profile: { atk: 0.95, guard: 1.1, vital: 1.2 }, agility: 85, skills: ["e_guard", "e_stun", "e_strike"],
      trait: "unshaken" } },
  { id: "dokgok", name: "사천 당문 독곡", short: "독곡", tier: 1, focus: ["inner", "vital"], homeFaction: "sega",
    desc: "독초와 독충이 자라는 당가의 골짜기.", questFoes: ["당가 호위", "독충", "암기 수련생"],
    boss: { id: "boss_dangpyo", name: "당표", title: "당가 독수(毒手)", attackType: "inner",
      profile: { atk: 0.95, guard: 0.9, vital: 1.1 }, agility: 110, skills: ["e_poison", "e_strike"],
      trait: "poison_hand" } },
  // ---------------------------------------------------------------- 고급
  { id: "nakan", name: "화산 낙안봉", short: "낙안", tier: 2, focus: ["outer"], homeFaction: "jeongpa",
    desc: "매화가 흩날리는 화산의 절벽.", questFoes: ["매화검수", "화산 제자", "절벽의 괴조"],
    boss: { id: "boss_cheongun", name: "청운자", title: "매화검수 '낙화검'", attackType: "outer",
      profile: { atk: 1.05, guard: 1.0, vital: 1.1 }, agility: 115, skills: ["e_multi", "e_heavy", "e_strike"],
      trait: "swift_blade" } },
  { id: "binggung", name: "북해 빙궁", short: "빙궁", tier: 2, focus: ["inner"], homeFaction: "saeoe",
    desc: "만년설에 뒤덮인 얼음 궁전.", questFoes: ["빙궁 시녀", "설인", "빙궁 호법"],
    boss: { id: "boss_hansobing", name: "한소빙", title: "빙궁주 '설녀'", attackType: "inner",
      profile: { atk: 1.15, guard: 1.05, vital: 1.1 }, agility: 110, skills: ["e_freeze", "e_heavy", "e_strike"],
      trait: "frost" } },
  { id: "dokchung", name: "남만 독충림", short: "독충", tier: 2, focus: ["vital", "guard"], homeFaction: "saeoe",
    desc: "독충이 우글거리는 남만의 밀림.", questFoes: ["오독교도", "거대 지네", "독무 속의 자객"],
    boss: { id: "boss_mandok", name: "만독노조", title: "오독교 교주", attackType: "inner",
      profile: { atk: 1.05, guard: 1.0, vital: 1.35 }, agility: 100, skills: ["e_poison", "e_drain", "e_strike"],
      trait: "poison_hand", mods: { regenPct: 0.03 } } },
  // ---------------------------------------------------------------- 최고급
  { id: "geomchong", name: "검총(劍冢)", short: "검총", tier: 3, focus: ["outer"], homeFaction: "sega",
    desc: "천하의 명검이 묻힌 무덤.", questFoes: ["검총의 망령", "검귀", "묘지기"],
    boss: { id: "boss_geomma", name: "검마의 잔영", title: "검마(劍魔)", attackType: "outer",
      profile: { atk: 1.15, guard: 1.0, vital: 1.1 }, agility: 120, skills: ["e_heavy", "e_multi", "e_strike"],
      trait: "assassin", mods: { critRate: 0.1 } } },
  { id: "daesan", name: "십만대산", short: "대산", tier: 3, focus: ["inner"], homeFaction: "magyo",
    desc: "천마신교의 총단이 있는 끝없는 산맥.", questFoes: ["마교도", "천마신교 호위", "혈귀"],
    boss: { id: "boss_jwahobeop", name: "좌호법", title: "천마신교 좌호법", attackType: "inner",
      profile: { atk: 1.05, guard: 1.1, vital: 1.15 }, agility: 115, skills: ["e_heavy", "e_stun", "e_strike"],
      trait: "chain" } },
  { id: "hyeolji", name: "혈교 혈지(血池)", short: "혈지", tier: 3, focus: ["vital", "guard"], homeFaction: "magyo",
    desc: "피로 가득 찬 혈교의 연못.", questFoes: ["혈교도", "혈강시", "혈교 장로"],
    boss: { id: "boss_hyeolma", name: "혈마", title: "혈마(血魔)", attackType: "inner",
      profile: { atk: 1.2, guard: 0.95, vital: 1.45 }, agility: 110, skills: ["e_drain", "e_heavy", "e_strike"],
      trait: "blood_art", mods: { lifesteal: 0.12 } } },
];

export const REGION_BY_ID: Record<string, RegionDef> = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

export function getRegion(id: string): RegionDef {
  const region = REGION_BY_ID[id];
  if (!region) throw new Error(`지역 없음: ${id}`);
  return region;
}

export function regionsOfTier(tier: number): RegionDef[] {
  return REGIONS.filter((r) => r.tier === tier);
}
