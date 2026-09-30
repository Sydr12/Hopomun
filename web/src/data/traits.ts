import type { SkillTag, TraitId } from "../core/types";

export interface TraitDef {
  id: TraitId;
  name: string;
  tag: SkillTag;
  desc: string;
  resonance: string;
}

/** 천성 16종. 실제 효과는 core/battle.ts 의 천성 처리부에서 구현한다. */
export const TRAITS: Record<TraitId, TraitDef> = {
  counter: { id: "counter", name: "후발제인(後發制人)", tag: "counter",
    desc: "피격 시 25% 확률로 반격", resonance: "반격 스킬 사용 후 1턴간 반격 확률 100%" },
  poison_hand: { id: "poison_hand", name: "독수(毒手)", tag: "poison",
    desc: "적중 시 중독 1중첩, 중독 면역", resonance: "다단히트 스킬은 타격마다 중독 중첩" },
  swift_blade: { id: "swift_blade", name: "쾌검(快劍)", tag: "multi",
    desc: "다단히트 스킬 타격 수 +1", resonance: "다단 스킬 마지막 타격 치명 확정" },
  flowing: { id: "flowing", name: "유수(流水)", tag: "evade",
    desc: "회피 +10%, 회피 시 속도 게이지 +20%", resonance: "회피 스킬 사용 후 다음 공격 피해 +40%" },
  vajra: { id: "vajra", name: "금강불괴(金剛不壞)", tag: "shield",
    desc: "자기 턴 종료 시 기혈 30% 미만이면 1회 발동, 자신의 다음 턴 종료까지 무적",
    resonance: "보호막 흡수량 +30%" },
  iron_wall: { id: "iron_wall", name: "철벽(鐵壁)", tag: "guard",
    desc: "공격 피해에 호신의 50% 추가", resonance: "호신 강화 스킬이 공격력도 강화" },
  guardian: { id: "guardian", name: "호위(護衛)", tag: "taunt",
    desc: "전투 시작 시 도발 1턴, 같은 행 뒤쪽 아군 대신 맞기 20%", resonance: "도발 중 받는 피해 -30%" },
  healer: { id: "healer", name: "의선(醫仙)", tag: "heal",
    desc: "회복량 +30%", resonance: "회복 시 상태이상 1개 해제" },
  strategist: { id: "strategist", name: "군사(軍師)", tag: "buff",
    desc: "아군 버프 지속 +1턴", resonance: "버프 스킬 사용 시 아군 속도 게이지 +15%" },
  acupoint: { id: "acupoint", name: "점혈(點穴)", tag: "debuff",
    desc: "적중 시 10% 확률로 기절", resonance: "약화 효과 +1턴" },
  chain: { id: "chain", name: "연환(連環)", tag: "chain",
    desc: "행동할 때마다 공격 +5% (최대 8중첩)", resonance: "연환 스킬은 2중첩" },
  blood_art: { id: "blood_art", name: "혈공(血功)", tag: "blood",
    desc: "기혈이 낮을수록 공격 증가 (최대 +50%)", resonance: "기혈 소모 스킬 위력 +30%" },
  assassin: { id: "assassin", name: "살수(殺手)", tag: "execute",
    desc: "기혈 30% 이하 적에게 피해 +40%", resonance: "처형 스킬로 적을 쓰러뜨리면 쿨타임 초기화" },
  quickdraw: { id: "quickdraw", name: "발도(拔刀)", tag: "first",
    desc: "전투 시작 시 속도 게이지 +40%", resonance: "전투 첫 공격 치명 확정" },
  unshaken: { id: "unshaken", name: "부동심(不動心)", tag: "immune",
    desc: "모든 CC 면역, CC가 걸리려 할 때마다 공격 +8% (최대 5중첩)",
    resonance: "면역 스킬 사용 시 아군 1명 1턴 CC 면역" },
  frost: { id: "frost", name: "빙백(氷魄)", tag: "freeze",
    desc: "적중 시 12% 확률로 빙결", resonance: "빙결된 적 공격 시 치명 확정" },
};
