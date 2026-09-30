import type { FactionId } from "../core/types";

export interface FactionDef {
  id: FactionId;
  name: string;
  buffName: string;
  color: string;
  tier1: string;
  tier2: string;
}

/** 세력 버프: 같은 세력 2명 → 1단계, 4명 → 2단계 (효과는 battle.ts에서 적용) */
export const FACTIONS: Record<FactionId, FactionDef> = {
  jeongpa: { id: "jeongpa", name: "정파", buffName: "협의(俠義)", color: "#9fc3e0",
    tier1: "팀 호신 +10%", tier2: "아군이 처음 기혈 20% 이하가 될 때 팀 전체 보호막" },
  sapa: { id: "sapa", name: "사파", buffName: "약육강식", color: "#8a6a4a",
    tier1: "팀 공격 +10%", tier2: "적을 쓰러뜨린 아군 속도 게이지 +50%" },
  magyo: { id: "magyo", name: "마교", buffName: "천마군림", color: "#b33a3a",
    tier1: "팀 기혈 +10%", tier2: "가한 피해의 10% 흡혈" },
  sega: { id: "sega", name: "세가", buffName: "가전무공", color: "#d4b24c",
    tier1: "팀 신법 +5%", tier2: "전투 시작 시 액티브 쿨타임 -1, 필살기 초기 쿨타임 -1" },
  saeoe: { id: "saeoe", name: "새외", buffName: "이역비술", color: "#8fb3c4",
    tier1: "상태이상 확률 +10%", tier2: "상태이상 지속 +1턴" },
};
