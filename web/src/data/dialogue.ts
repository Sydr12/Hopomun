/**
 * 이벤트 대사. speaker:
 *   "self" = 수련 중인 캐릭터, 캐릭터 id = 그 캐릭터, 그 밖의 문자열 = 지역 인물 이름.
 */
export interface EventDialogue {
  speaker: string;
  line: string;
}

export const EVENT_DIALOGUE: Record<string, EventDialogue> = {
  // ---------------------------------------------------------------- 지역
  rg_heuk_1: { speaker: "술 취한 산적", line: "크하하! 오늘 밤은 무기고 지킬 놈도 없다! 마셔라!" },
  rg_heuk_2: { speaker: "붙잡힌 상인", line: "거기 협객 나리! 제발, 제발 좀 살려주십시오!" },
  rg_jang_1: { speaker: "뱃사공", line: "꽉 잡으시오! 물살이 미쳤소!" },
  rg_jang_2: { speaker: "나루터 노인", line: "허허, 저 상자… 주인이 찾으러 올 것 같진 않구먼." },
  rg_nahan_1: { speaker: "나한당 노승", line: "막는다는 것은 버틴다는 것이 아니라, 흘려보낸다는 것이지." },
  rg_nahan_2: { speaker: "공양간 행자", line: "시주님, 손이 모자라서 그런데… 조금만 도와주시면 안 될까요?" },
  rg_dok_1: { speaker: "당가 호위", line: "숨을 참으시오. 이 안개를 한 모금이라도 마시면 사흘은 앓소." },
  rg_dok_2: { speaker: "약초꾼", line: "그 풀, 함부로 만지면 손이 썩는데… 알고 캔 거요?" },
  rg_nak_1: { speaker: "화산 제자", line: "쉿. 사숙께서 검무를 추실 때는 숨소리도 내면 안 됩니다." },
  rg_nak_2: { speaker: "화산 제자", line: "저 새는 이 절벽의 주인입니다. 조심하십시오!" },
  rg_bing_1: { speaker: "빙궁 시녀", line: "한빙동에 들어가면 뼛속까지 얼어요. 그래도 가시겠어요?" },
  rg_bing_2: { speaker: "빙궁 시녀", line: "궁주님께 받은 비녀를… 눈밭에서 잃어버렸어요." },
  rg_dokc_1: { speaker: "남만 사냥꾼", line: "불 꺼지면 끝이오! 벌레들이 몰려온다!" },
  rg_dokc_2: { speaker: "오독교도", line: "흐흐… 오독교의 비방이오. 값만 맞으면 드리지." },
  rg_geom_1: { speaker: "묘지기", line: "검이 우는 소리를 들었는가. 주인을 찾는 게지." },
  rg_geom_2: { speaker: "묘지기", line: "여기 잠든 이들을 깨우지 말게. 대가는 치러주지." },
  rg_dae_1: { speaker: "마교도", line: "천마의 구결이다. 읽는 순간 너도 우리 편이지." },
  rg_dae_2: { speaker: "마교 척후", line: "이 길은 천마신교의 땅이다. 통행세를 내든가, 목을 내놓든가." },
  rg_hyeol_1: { speaker: "혈교 장로", line: "혈지의 기운을 받아들여라. 피는 거짓말을 하지 않는다." },
  rg_hyeol_2: { speaker: "혈교도", line: "크크… 강시가 굶주렸다. 네 피 냄새를 맡았어." },

  // ---------------------------------------------------------------- 캐릭터 고유
  ev_dang_1: { speaker: "self", line: "또 편지네요. 아버지는 제가 웃는 것보다 독을 잘 쓰는 걸 더 좋아하세요." },
  ev_dang_2: { speaker: "self", line: "새로 만든 독이에요. 먼저 제가 맞아봐야 제대로 쓸 수 있거든요." },
  ev_dang_3: { speaker: "self", line: "웃고 있으면 상대가 방심하거든요. …사부님은 방심하지 마세요?" },
  ev_nam_1: { speaker: "self", line: "남궁의 이름은 무겁습니다. 검을 쥐면 조금 가벼워지지요." },
  ev_nam_2: { speaker: "self", line: "아버지의 구결입니다. 이제야 뜻이 조금 보이는군요." },
  ev_nam_3: { speaker: "self", line: "세가들의 연회라… 얼굴을 비추는 것도 수련이라 하셨습니다." },
  ev_mujin_1: { speaker: "self", line: "새벽 종이 울립니다. 아미타불… 오늘도 잘 부탁드립니다, 사부님." },
  ev_mujin_2: { speaker: "self", line: "사형께서 철포삼을 알려주신다고 합니다! 맞으면 아프겠지요?" },
  ev_mujin_3: { speaker: "self", line: "저 아이… 며칠째 굶은 것 같습니다. 그냥 지나칠 수는 없습니다." },
  ev_seol_1: { speaker: "self", line: "…눈이네요. 북해의 눈보다 따뜻해요." },
  ev_seol_2: { speaker: "self", line: "이건 뭐예요? …이것도요? 중원은 먹을 게 너무 많아요." },
  ev_seol_3: { speaker: "self", line: "빙궁의 추적자예요. 저를 데리러 온 거겠죠." },
  ev_hyeol_1: { speaker: "self", line: "낙인이 타는군. 혈교가 아직 나를 잊지 않았다는 뜻이지." },
  ev_hyeol_2: { speaker: "self", line: "옛 동료가 왔다. 반가운 얼굴은 아니지만." },
  ev_hyeol_3: { speaker: "self", line: "피를 쓸 때마다 조금씩 비어가는 느낌이야. 괜찮다, 아직은." },
  ev_cheong_1: { speaker: "self", line: "약초밭이 무성해졌어요. 오늘은 무엇을 달일까요?" },
  ev_cheong_2: { speaker: "self", line: "강함과 부드러움은 하나라고요. 사부님은 어느 쪽이 먼저라고 보세요?" },
  ev_cheong_3: { speaker: "self", line: "피가 많이 나요! 제가 볼게요, 잠시만요!" },
  ev_dokgo_1: { speaker: "self", line: "산채 형제들이 돌아오라더군. 흥, 이제 내 자리는 여기요." },
  ev_dokgo_2: { speaker: "self", line: "이깟 바위쯤이야! 비키시오, 사부!" },
  ev_dokgo_3: { speaker: "self", line: "주사위 소리만 들어도 손이 근질거리는군. 한 판만 하겠소." },
  ev_jegal_1: { speaker: "self", line: "진법은 수학이에요. 한 칸만 어긋나도 전부 무너지죠." },
  ev_jegal_2: { speaker: "self", line: "이 혈도도, 제갈세가 서고에도 없는 판본이에요!" },
  ev_jegal_3: { speaker: "self", line: "세가 어른들이 실력을 보자시네요. 번거롭지만… 해야겠죠." },

  // ---------------------------------------------------------------- 인연
  bd_ds_1: { speaker: "seol_hwa", line: "독을 얼리면 어떻게 될까? …궁금하지 않아?" },
  bd_ds_2: { speaker: "seol_hwa", line: "소하. …같이 걸어도 돼?" },
  bd_ds_3: { speaker: "seol_hwa", line: "우리 기운이 섞였어. 이상해… 싫지는 않아." },
  bd_nh_1: { speaker: "namgung_hyeon", line: "남궁의 검 앞에서 거짓을 말할 생각은 하지 마라." },
  bd_nh_2: { speaker: "namgung_hyeon", line: "혈교 놈과 술잔을 나눌 줄은 몰랐군. …한 잔 더 하지." },
  bd_nh_3: { speaker: "namgung_hyeon", line: "등 뒤는 내가 맡겠다. 앞만 봐라." },
  bd_mc_1: { speaker: "cheong_a", line: "소림은 단단하고, 무당은 부드럽지요. 오늘은 무엇을 나눌까요?" },
  bd_mc_2: { speaker: "cheong_a", line: "또 다치셨어요? 가만히 계세요, 제가 볼게요." },
  bd_mc_3: { speaker: "cheong_a", line: "다음에도, 그 다음에도… 함께 싸워요." },
  bd_dj_1: { speaker: "jegal_yun", line: "독고 형님은 진의 한 축만 맡아주시면 돼요. 버티기만 하면 이깁니다." },
  bd_dj_2: { speaker: "dokgo_ung", line: "하하! 책사 양반, 바둑 말고 술이나 한잔하자니까!" },
  bd_dj_3: { speaker: "dokgo_ung", line: "등 뒤는 걱정 마시오! 이 독고웅이 있는 한!" },
};
