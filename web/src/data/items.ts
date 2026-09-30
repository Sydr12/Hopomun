import type { StatKey } from "../core/types";

export interface ItemDef {
  id: string;
  name: string;
  desc: string;
  price: number;
  stats?: Partial<Record<StatKey, number>>;
  stamina?: number;
  /** 등장 가중치 */
  weight: number;
}

/** 상점 상품. 스탯 수치와 가격은 지역 난이도 배율(TIER_GROWTH)을 곱해 적용한다. */
export const ITEMS: ItemDef[] = [
  { id: "oegong_hwan", name: "외공환", desc: "외공 +15", price: 60, stats: { outer: 15 }, weight: 3 },
  { id: "naegong_dan", name: "내공단", desc: "내공 +15", price: 60, stats: { inner: 15 }, weight: 3 },
  { id: "hosin_bu", name: "호신부", desc: "호신 +15", price: 55, stats: { guard: 15 }, weight: 3 },
  { id: "gihyeol_dan", name: "기혈단", desc: "기혈 +15", price: 55, stats: { vital: 15 }, weight: 3 },
  { id: "daehwan", name: "대환단", desc: "모든 능력치 +8", price: 110, stats: { outer: 8, inner: 8, guard: 8, vital: 8 }, weight: 1 },
  { id: "gilyeok_yak", name: "기력환", desc: "기력 +30", price: 40, stamina: 30, weight: 3 },
  { id: "sohwan", name: "소환단", desc: "기력 +60", price: 70, stamina: 60, weight: 1.5 },
];
