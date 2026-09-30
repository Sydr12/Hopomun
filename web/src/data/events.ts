import type { StatKey } from "../core/types";
import type { TrainingId } from "./balance";

export interface EventEffects {
  stats?: Partial<Record<StatKey, number>>;
  stamina?: number;
  silver?: number;
  trainingExp?: { id: TrainingId; amount: number };
}

export interface EventChoice {
  label: string;
  result: string;
  effects: EventEffects;
}

export interface EventDef {
  id: string;
  title: string;
  text: string;
  choices: EventChoice[];
}

const ev = (id: string, title: string, text: string, choices: EventChoice[]): EventDef => ({ id, title, text, choices });

/** 지역 이벤트 (지역 id → 이벤트 목록). 지역마다 조금씩 다르다. */
export const REGION_EVENTS: Record<string, EventDef[]> = {
  heukpung: [
    ev("rg_heuk_1", "산채의 술판", "산적들이 술판을 벌였다. 틈을 타 무기고를 뒤질 수 있을 것 같다.", [
      { label: "무기고를 턴다", result: "녹슨 철퇴로 팔 힘을 길렀다.", effects: { stats: { outer: 10 }, stamina: -10 } },
      { label: "조용히 쉰다", result: "산채의 소음 속에서도 푹 잤다.", effects: { stamina: 20 } },
    ]),
    ev("rg_heuk_2", "인질", "산적에게 붙잡힌 상인이 도움을 청한다.", [
      { label: "구해준다", result: "상인이 은자로 사례했다.", effects: { silver: 50, stamina: -10 } },
      { label: "못 본 척한다", result: "마음이 무겁지만 몸은 편하다.", effects: { stamina: 10 } },
    ]),
  ],
  janggang: [
    ev("rg_jang_1", "급류", "나룻배가 급류에 휩쓸렸다!", [
      { label: "내공으로 버틴다", result: "단전의 기운이 단단해졌다.", effects: { stats: { inner: 10 }, stamina: -15 } },
      { label: "헤엄쳐 나온다", result: "온몸이 쑤시지만 튼튼해졌다.", effects: { stats: { vital: 8 }, stamina: -10 } },
    ]),
    ev("rg_jang_2", "밀수 화물", "주인 없는 밀수 화물이 떠내려왔다.", [
      { label: "챙긴다", result: "은자가 든 상자였다.", effects: { silver: 60 } },
      { label: "관아에 신고한다", result: "포상으로 호신부를 받았다.", effects: { stats: { guard: 8 } } },
    ]),
  ],
  nahan: [
    ev("rg_nahan_1", "나한진 견학", "노승이 나한진의 원리를 설명해 준다.", [
      { label: "귀 기울인다", result: "막는 법을 깨달았다.", effects: { stats: { guard: 12 }, trainingExp: { id: "guard", amount: 1 } } },
      { label: "직접 부딪쳐 본다", result: "동인에게 두들겨 맞았다.", effects: { stats: { outer: 8, vital: 6 }, stamina: -15 } },
    ]),
    ev("rg_nahan_2", "공양간", "공양간에서 일손을 구한다.", [
      { label: "돕는다", result: "보시로 은자를 받았다.", effects: { silver: 50, stamina: -10 } },
      { label: "명상한다", result: "마음이 고요해졌다.", effects: { stamina: 15 } },
    ]),
  ],
  dokgok: [
    ev("rg_dok_1", "독무(毒霧)", "골짜기에 독무가 깔렸다.", [
      { label: "운기로 독을 밀어낸다", result: "내공이 한층 정순해졌다.", effects: { stats: { inner: 12 }, stamina: -15 } },
      { label: "해독제를 산다", result: "은자를 썼지만 몸은 멀쩡하다.", effects: { silver: -30, stamina: 10 } },
    ]),
    ev("rg_dok_2", "독초 채집", "희귀한 독초를 발견했다.", [
      { label: "약으로 달인다", result: "기혈이 튼튼해졌다.", effects: { stats: { vital: 12 } } },
      { label: "팔아버린다", result: "좋은 값을 받았다.", effects: { silver: 70 } },
    ]),
  ],
  nakan: [
    ev("rg_nak_1", "매화 검무", "절벽 위에서 누군가 검무를 춘다.", [
      { label: "검로를 따라 한다", result: "외공이 날카로워졌다.", effects: { stats: { outer: 16 }, trainingExp: { id: "outer", amount: 1 } } },
      { label: "감상한다", result: "마음이 맑아졌다.", effects: { stamina: 20 } },
    ]),
    ev("rg_nak_2", "절벽의 괴조", "거대한 새가 둥지를 지키며 덤빈다.", [
      { label: "맞선다", result: "힘겹게 쫓아냈다.", effects: { stats: { outer: 10, vital: 8 }, stamina: -20 } },
      { label: "우회한다", result: "먼 길을 돌았다.", effects: { stamina: -5 } },
    ]),
  ],
  binggung: [
    ev("rg_bing_1", "한빙동", "뼈까지 얼리는 동굴이 있다.", [
      { label: "그 안에서 운기한다", result: "내공이 크게 늘었다.", effects: { stats: { inner: 18 }, stamina: -25 } },
      { label: "입구에서만 수련한다", result: "조금 나아졌다.", effects: { stats: { inner: 8 }, stamina: -5 } },
    ]),
    ev("rg_bing_2", "빙궁 시녀의 부탁", "빙궁 시녀가 잃어버린 비녀를 찾아달라 한다.", [
      { label: "찾아준다", result: "시녀가 설련화를 건넸다.", effects: { stats: { vital: 10, guard: 6 } } },
      { label: "거절한다", result: "냉랭한 눈빛만 돌아왔다.", effects: {} },
    ]),
  ],
  dokchung: [
    ev("rg_dokc_1", "독충의 습격", "밤사이 독충 떼가 몰려왔다.", [
      { label: "물리친다", result: "독에 대한 내성이 생겼다.", effects: { stats: { vital: 14 }, stamina: -15 } },
      { label: "불을 피워 막는다", result: "무사히 밤을 넘겼다.", effects: { stamina: -5, stats: { guard: 6 } } },
    ]),
    ev("rg_dokc_2", "오독교 비방", "오독교도가 비방을 팔겠다고 한다.", [
      { label: "산다", result: "몸이 단단해졌다.", effects: { silver: -50, stats: { guard: 14, vital: 8 } } },
      { label: "빼앗는다", result: "싸움 끝에 빼앗았다.", effects: { stats: { guard: 10 }, stamina: -20 } },
    ]),
  ],
  geomchong: [
    ev("rg_geom_1", "명검의 울음", "무덤 깊은 곳에서 검이 운다.", [
      { label: "검과 공명한다", result: "검의 뜻을 읽었다.", effects: { stats: { outer: 22 }, stamina: -20 } },
      { label: "물러난다", result: "섣불리 다가가지 않았다.", effects: { stamina: 10 } },
    ]),
    ev("rg_geom_2", "묘지기", "묘지기가 무덤의 보물을 지키고 있다.", [
      { label: "공손히 인사한다", result: "묘지기가 은자 한 주머니를 건넸다.", effects: { silver: 90 } },
      { label: "도전한다", result: "상처를 입었지만 한 수 배웠다.", effects: { stats: { outer: 12, guard: 8 }, stamina: -25 } },
    ]),
  ],
  daesan: [
    ev("rg_dae_1", "천마의 비석", "천마신공의 구결이 새겨진 비석.", [
      { label: "구결을 읽는다", result: "마공의 기운이 스며든다.", effects: { stats: { inner: 22 }, stamina: -20 } },
      { label: "비석을 부순다", result: "마음은 지켰다.", effects: { stats: { guard: 10 } } },
    ]),
    ev("rg_dae_2", "마교도의 매복", "마교도들이 길목에 숨어 있다.", [
      { label: "돌파한다", result: "피투성이로 빠져나왔다.", effects: { stats: { inner: 10, vital: 10 }, stamina: -25 } },
      { label: "뇌물을 준다", result: "은자로 길을 샀다.", effects: { silver: -60 } },
    ]),
  ],
  hyeolji: [
    ev("rg_hyeol_1", "혈지의 기운", "핏빛 연못에서 기이한 기운이 피어오른다.", [
      { label: "흡수한다", result: "기혈이 끓어오른다.", effects: { stats: { vital: 22 }, stamina: -20 } },
      { label: "경계한다", result: "몸을 굳게 지켰다.", effects: { stats: { guard: 12 } } },
    ]),
    ev("rg_hyeol_2", "혈강시", "피를 먹고 움직이는 강시가 나타났다.", [
      { label: "맞서 싸운다", result: "강시를 쓰러뜨렸다.", effects: { stats: { guard: 12, vital: 10 }, stamina: -25 } },
      { label: "달아난다", result: "숨이 턱까지 찼다.", effects: { stamina: -10 } },
    ]),
  ],
};

/** 캐릭터 고유 이벤트 */
export const CHARACTER_EVENTS: Record<string, EventDef> = Object.fromEntries(
  [
    ev("ev_dang_1", "당가의 편지", "본가에서 편지가 왔다. \"독공 수련을 게을리하지 마라.\"", [
      { label: "독공에 매진한다", result: "암기 다루는 손이 빨라졌다.", effects: { stats: { outer: 14 } } },
      { label: "답장을 쓴다", result: "마음이 한결 가벼워졌다.", effects: { stamina: 25 } },
    ]),
    ev("ev_dang_2", "독 실험", "새로운 독을 조합해 보고 싶다.", [
      { label: "스스로에게 시험한다", result: "내성이 생겼다.", effects: { stats: { vital: 14 }, stamina: -15 } },
      { label: "팔 곳을 찾는다", result: "비싸게 팔렸다.", effects: { silver: 80 } },
    ]),
    ev("ev_dang_3", "웃는 얼굴", "\"웃고 있으면 상대가 방심하거든요.\"", [
      { label: "함께 웃는다", result: "분위기가 좋아졌다.", effects: { stamina: 20, stats: { guard: 6 } } },
      { label: "경계한다", result: "그녀가 조금 서운해했다.", effects: { stats: { outer: 8 } } },
    ]),
  ].concat([
    ev("ev_nam_1", "소가주의 무게", "가문의 기대가 어깨를 누른다.", [
      { label: "검을 휘두른다", result: "잡념을 베어냈다.", effects: { stats: { outer: 16 }, stamina: -10 } },
      { label: "잠시 내려놓는다", result: "오랜만에 편히 잤다.", effects: { stamina: 30 } },
    ]),
    ev("ev_nam_2", "창궁의 구결", "아버지가 남긴 구결을 되새긴다.", [
      { label: "외공에 적용", result: "검이 한층 무거워졌다.", effects: { stats: { outer: 12 }, trainingExp: { id: "outer", amount: 2 } } },
      { label: "호신에 적용", result: "빈틈이 줄었다.", effects: { stats: { guard: 12 } } },
    ]),
    ev("ev_nam_3", "세가의 연회", "세가들의 연회에 초대받았다.", [
      { label: "참석한다", result: "후원금을 받았다.", effects: { silver: 90 } },
      { label: "수련을 택한다", result: "묵묵히 검을 갈았다.", effects: { stats: { outer: 10 }, stamina: -5 } },
    ]),
    ev("ev_mujin_1", "새벽 예불", "새벽 종소리에 눈을 뜬다.", [
      { label: "예불에 참석", result: "마음이 고요하다.", effects: { stamina: 20, stats: { guard: 6 } } },
      { label: "종을 대신 친다", result: "팔 힘이 붙었다.", effects: { stats: { outer: 10 } } },
    ]),
    ev("ev_mujin_2", "철포삼", "사형이 철포삼의 요결을 알려준다.", [
      { label: "몸으로 익힌다", result: "몸이 강철처럼 단단해졌다.", effects: { stats: { guard: 18 }, stamina: -15 } },
      { label: "머리로 익힌다", result: "원리를 이해했다.", effects: { trainingExp: { id: "guard", amount: 2 } } },
    ]),
    ev("ev_mujin_3", "굶주린 아이", "마을 어귀에 굶주린 아이가 있다.", [
      { label: "공양을 나눈다", result: "아이가 환하게 웃었다.", effects: { stamina: 15, stats: { vital: 8 } } },
      { label: "마을 일을 돕는다", result: "품삯으로 은자를 받았다.", effects: { silver: 50, stamina: -10 } },
    ]),
    ev("ev_seol_1", "고향의 눈", "중원에 첫눈이 내렸다.", [
      { label: "눈 속에서 수련", result: "빙공이 깨어났다.", effects: { stats: { inner: 16 }, stamina: -10 } },
      { label: "고향을 그린다", result: "마음이 편안해졌다.", effects: { stamina: 30 } },
    ]),
    ev("ev_seol_2", "중원의 음식", "처음 보는 음식이 신기하다.", [
      { label: "다 먹어본다", result: "배가 부르고 기운이 난다.", effects: { stats: { vital: 12 }, silver: -20 } },
      { label: "하나만 고른다", result: "알뜰하게 즐겼다.", effects: { stamina: 15 } },
    ]),
    ev("ev_seol_3", "빙궁의 추적자", "빙궁에서 보낸 추적자가 나타났다.", [
      { label: "맞선다", result: "추적자를 돌려보냈다.", effects: { stats: { inner: 12, guard: 8 }, stamina: -20 } },
      { label: "숨는다", result: "무사히 따돌렸다.", effects: { stamina: -5 } },
    ]),
    ev("ev_hyeol_1", "혈교의 낙인", "몸의 낙인이 욱신거린다.", [
      { label: "고통을 힘으로 바꾼다", result: "혈공이 거세졌다.", effects: { stats: { inner: 18 }, stamina: -20 } },
      { label: "참는다", result: "버텨냈다.", effects: { stats: { vital: 10 } } },
    ]),
    ev("ev_hyeol_2", "옛 동료", "혈교 시절 동료가 찾아왔다.", [
      { label: "돌려보낸다", result: "과거와 선을 그었다.", effects: { stats: { guard: 10 } } },
      { label: "정보를 산다", result: "혈교의 약점을 들었다.", effects: { silver: -40, trainingExp: { id: "inner", amount: 2 } } },
    ]),
    ev("ev_hyeol_3", "피의 대가", "혈공을 쓸 때마다 몸이 약해지는 걸 느낀다.", [
      { label: "몸을 돌본다", result: "기혈이 회복되었다.", effects: { stats: { vital: 16 }, stamina: 10 } },
      { label: "무시한다", result: "더 강한 힘을 얻었지만…", effects: { stats: { inner: 14, vital: -6 } } },
    ]),
    ev("ev_cheong_1", "약초밭", "무당산의 약초밭을 돌본다.", [
      { label: "약을 달인다", result: "몸이 가벼워졌다.", effects: { stamina: 30 } },
      { label: "약초를 판다", result: "은자를 벌었다.", effects: { silver: 60 } },
    ]),
    ev("ev_cheong_2", "태극의 이치", "강함과 부드러움은 하나라는 가르침.", [
      { label: "내공에 담는다", result: "내공이 원만해졌다.", effects: { stats: { inner: 14 } } },
      { label: "호신에 담는다", result: "흐르듯 막는다.", effects: { stats: { guard: 14 } } },
    ]),
    ev("ev_cheong_3", "환자", "지나가던 무인이 크게 다쳤다.", [
      { label: "치료한다", result: "의술이 늘었다.", effects: { stats: { inner: 8, vital: 8 }, stamina: -10 } },
      { label: "의원에 보낸다", result: "무인이 감사의 뜻으로 은자를 남겼다.", effects: { silver: 40 } },
    ]),
    ev("ev_dokgo_1", "녹림의 부름", "옛 녹림 형제들이 산채로 돌아오라 한다.", [
      { label: "거절한다", result: "마음이 더 단단해졌다.", effects: { stats: { guard: 12 } } },
      { label: "술 한잔만 한다", result: "호탕하게 웃고 헤어졌다.", effects: { stamina: 25 } },
    ]),
    ev("ev_dokgo_2", "바위 들기", "산길을 막은 바위를 치워야 한다.", [
      { label: "맨손으로 든다", result: "팔에 힘이 붙었다.", effects: { stats: { outer: 14 }, stamina: -10 } },
      { label: "지렛대를 쓴다", result: "수월하게 치웠다.", effects: { stats: { vital: 8 } } },
    ]),
    ev("ev_dokgo_3", "도박판", "주막에서 도박판이 벌어졌다.", [
      { label: "한 판 한다", result: "제법 땄다.", effects: { silver: 70 } },
      { label: "지켜만 본다", result: "사람 보는 눈이 늘었다.", effects: { stats: { guard: 8 } } },
    ]),
    ev("ev_jegal_1", "기문진법", "제갈윤이 진법 연습을 권한다.", [
      { label: "함께 연구한다", result: "내공 운용이 정교해졌다.", effects: { stats: { inner: 14 } } },
      { label: "쉬라고 말린다", result: "제갈윤이 멋쩍게 웃었다.", effects: { stamina: 25 } },
    ]),
    ev("ev_jegal_2", "혈도도(穴道圖)", "오래된 혈도도를 손에 넣었다.", [
      { label: "외운다", result: "점혈이 정확해졌다.", effects: { trainingExp: { id: "inner", amount: 2 } } },
      { label: "팔아버린다", result: "좋은 값을 받았다.", effects: { silver: 80 } },
    ]),
    ev("ev_jegal_3", "세가의 체면", "세가 모임에서 실력을 보이라 한다.", [
      { label: "시연한다", result: "칭찬과 후원금을 받았다.", effects: { silver: 60, stats: { inner: 6 } } },
      { label: "사양한다", result: "조용히 수련에 매진했다.", effects: { stats: { guard: 10 } } },
    ]),
  ]).map((e) => [e.id, e]),
);

/** 인연 이벤트 (인연 쌍 키 → 3종) */
export const BOND_EVENTS: Record<string, EventDef[]> = {
  "dang_soha+seol_hwa": [
    ev("bd_ds_1", "독과 얼음", "당소하가 설화에게 독을 얼려 보자고 한다.", [
      { label: "실험한다", result: "새로운 수법을 떠올렸다.", effects: { stats: { outer: 10, inner: 10 } } },
      { label: "말린다", result: "둘 다 웃고 말았다.", effects: { stamina: 20 } },
    ]),
    ev("bd_ds_2", "첫 친구", "설화가 처음으로 먼저 말을 걸었다.", [
      { label: "반갑게 맞는다", result: "마음이 따뜻해졌다.", effects: { stamina: 25 } },
      { label: "함께 수련한다", result: "호흡이 맞았다.", effects: { stats: { guard: 12 } } },
    ]),
    ev("bd_ds_3", "빙독", "두 사람의 기운이 섞여 기이한 힘이 생겼다.", [
      { label: "받아들인다", result: "몸에 새 기운이 돈다.", effects: { stats: { vital: 14 } } },
      { label: "봉인한다", result: "안전을 택했다.", effects: { stats: { guard: 8 }, stamina: 10 } },
    ]),
  ],
  "hyeol_yeong+namgung_hyeon": [
    ev("bd_nh_1", "검과 피", "남궁현이 혈영에게 검을 겨눈다. \"넌 혈교의 개인가?\"", [
      { label: "진심을 말한다", result: "검이 거두어졌다.", effects: { stamina: 20, stats: { guard: 8 } } },
      { label: "대련으로 증명한다", result: "치열한 대련 끝에 서로를 인정했다.", effects: { stats: { outer: 10, inner: 10 }, stamina: -20 } },
    ]),
    ev("bd_nh_2", "맹세", "두 사람이 술잔을 나눈다.", [
      { label: "의형제를 맺는다", result: "든든하다.", effects: { stats: { vital: 12 } } },
      { label: "빚으로 남긴다", result: "언젠가 갚겠다고 했다.", effects: { silver: 60 } },
    ]),
    ev("bd_nh_3", "추격자", "혈교 추격자가 두 사람을 노린다.", [
      { label: "함께 싸운다", result: "등을 맡기고 싸웠다.", effects: { stats: { outer: 12, inner: 12 }, stamina: -25 } },
      { label: "따돌린다", result: "무사히 벗어났다.", effects: { stamina: -5 } },
    ]),
  ],
  "dokgo_ung+jegal_yun": [
    ev("bd_dj_1", "책사와 호걸", "제갈윤이 독고웅에게 진법의 한 축을 맡긴다.", [
      { label: "버틴다", result: "진법이 완성되었다.", effects: { stats: { guard: 12, vital: 8 } } },
      { label: "돌파한다", result: "진법을 부쉈다.", effects: { stats: { outer: 10, inner: 10 } } },
    ]),
    ev("bd_dj_2", "술과 바둑", "한 사람은 술을, 한 사람은 바둑을 권한다.", [
      { label: "술", result: "호탕하게 취했다.", effects: { stamina: 30 } },
      { label: "바둑", result: "수읽기가 늘었다.", effects: { trainingExp: { id: "meditate", amount: 2 } } },
    ]),
    ev("bd_dj_3", "등을 맡기다", "습격 속에서 서로의 등을 지켰다.", [
      { label: "끝까지 싸운다", result: "둘 다 한층 강해졌다.", effects: { stats: { outer: 10, inner: 10 }, stamina: -20 } },
      { label: "퇴로를 연다", result: "무사히 빠져나왔다.", effects: { stats: { guard: 10 } } },
    ]),
  ],
  "cheong_a+mujin": [
    ev("bd_mc_1", "소림과 무당", "무진과 청아가 서로의 무공을 논한다.", [
      { label: "외가의 이치", result: "단단함을 배웠다.", effects: { stats: { guard: 12 } } },
      { label: "내가의 이치", result: "부드러움을 배웠다.", effects: { stats: { inner: 12 } } },
    ]),
    ev("bd_mc_2", "치료", "청아가 무진의 상처를 치료해 준다.", [
      { label: "고맙다고 한다", result: "기운이 돌아왔다.", effects: { stamina: 30 } },
      { label: "괜찮다고 우긴다", result: "청아가 한숨을 쉬었다.", effects: { stats: { vital: 10 } } },
    ]),
    ev("bd_mc_3", "산문 앞의 약속", "\"다음에도 함께 싸우자.\"", [
      { label: "약속한다", result: "마음이 굳건해졌다.", effects: { stats: { guard: 10, vital: 10 } } },
      { label: "웃어넘긴다", result: "분위기가 부드러워졌다.", effects: { stamina: 20 } },
    ]),
  ],
};
