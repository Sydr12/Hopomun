import { useState } from "preact/hooks";
import { TRAININGS, TURNS_PER_REGION, type TrainingId } from "../../data/balance";
import { getCharacter } from "../../data/characters";
import { FACTIONS } from "../../data/factions";
import { ITEMS } from "../../data/items";
import { getRegion, TIER_NAMES } from "../../data/regions";
import { SKILLS } from "../../data/skills";
import { TRAITS } from "../../data/traits";
import {
  chooseRegion, chooseSkill, currentEvent, currentRegionId, failRate, fightBoss, finalTest, premiumRestCost, quest,
  rerollCost, resolveEvent, rest, returnHome, shopBuy, shopClose, shopReroll, train, trainingLevel, trainingPreview,
  turnInRegion, type ActionResult, type TrainingState,
} from "../../core/training";
import { STAT_NAMES, type StatKey } from "../../core/types";
import { CharacterPortrait, Gains, GradeBadge, Modal, Sheet, StaminaBar, StatTable, skillName } from "../components";
import { BattleView } from "./Battle";

type Mutate = (fn: (s: TrainingState) => ActionResult | void) => ActionResult | void;

export function TrainingScreen({ state, mutate, onExit }: { state: TrainingState; mutate: Mutate; onExit: () => void }) {
  const [sheet, setSheet] = useState<"train" | "rest" | "log" | null>(null);
  const [pending, setPending] = useState<ActionResult | null>(null);
  const [showBattle, setShowBattle] = useState(false);
  const [hover, setHover] = useState<TrainingId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const character = getCharacter(state.characterId);

  /** 행동 실행 → 결과(전투가 있으면 관전 먼저) 표시 */
  const act = (fn: (s: TrainingState) => ActionResult | void, quiet = false) => {
    setSheet(null);
    setHover(null);
    try {
      const result = mutate(fn);
      if (result && quiet) {
        setError(result.messages.join(" "));
        setTimeout(() => setError(null), 1500);
      } else if (result) {
        setPending(result);
        setShowBattle(!!result.battle);
      }
    } catch (e) {
      setError((e as Error).message);
      setTimeout(() => setError(null), 1800);
    }
  };

  if (state.phase === "choose_region") return <RegionSelect state={state} onChoose={(id) => act((s) => chooseRegion(s, id))} onExit={onExit} />;

  const region = getRegion(currentRegionId(state)!);
  const inRegion = turnInRegion(state);
  const fail = failRate(state);

  return (
    <div class="screen">
      {/* 머리: 턴 · 지역 */}
      <div class="col" style={{ gap: 6 }}>
        <div class="row between">
          <div>
            <div class="small faint">{TIER_NAMES[region.tier]} · {state.turn <= 40 ? `${inRegion}/${TURNS_PER_REGION}턴` : ""}</div>
            <h2>{state.turn >= 41 ? "본진" : region.name}</h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <div class="gold" style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 900 }}>{state.turn}<span class="small faint"> / 42</span></div>
            <button class="btn sm ghost" style={{ minHeight: 28, padding: "0 6px" }} onClick={onExit}>나가기</button>
          </div>
        </div>
        <div class="progress42">
          {Array.from({ length: 42 }, (_, i) => {
            const t = i + 1;
            const boss = t % 10 === 0 && t <= 40;
            return <i key={t} class={`${t < state.turn ? "done" : ""} ${t === state.turn ? "now" : ""} ${boss ? "boss" : ""}`} />;
          })}
        </div>
      </div>

      {/* 캐릭터 */}
      <div class="panel col">
        <div class="row" style={{ gap: 12 }}>
          <CharacterPortrait character={character} />
          <div class="grow col" style={{ gap: 2 }}>
            <div class="row between">
              <h3>{character.name}</h3>
              <span class="chip gold">은자 {state.silver}</span>
            </div>
            <div class="row wrap" style={{ gap: 4 }}>
              <span class="chip" style={{ color: FACTIONS[character.faction].color }}>{FACTIONS[character.faction].name}</span>
              <span class="chip">{character.attackType === "outer" ? "외공" : "내공"} 계열</span>
              <span class="chip">{TRAITS[character.trait].name.split("(")[0]}</span>
            </div>
          </div>
        </div>
        <StaminaBar value={state.stamina} />
        {fail > 0 && <p class="small" style={{ margin: 0, color: "var(--red)" }}>기력 부족: 훈련 실패 확률 {Math.round(fail * 100)}%</p>}
      </div>

      <div class="panel">
        <StatTable base={character.baseStats} training={state.stats} attackType={character.attackType} preview={hover ? trainingPreview(state, hover) : undefined} />
      </div>

      <SkillStrip state={state} />

      <button class="btn ghost sm" onClick={() => setSheet("log")}>수련 일지</button>

      {/* 행동 바 */}
      {state.phase === "action" && (
        <div class="action-bar">
          <button class="btn primary" onClick={() => setSheet("train")}>훈련</button>
          <button class="btn" onClick={() => act(quest)}>의뢰</button>
          <button class="btn" onClick={() => setSheet("rest")}>휴식</button>
        </div>
      )}
      {state.phase === "boss" && (
        <div class="action-bar single">
          <button class="btn danger" onClick={() => act(fightBoss)}>보스 결투 · {region.boss.title} {region.boss.name}</button>
        </div>
      )}
      {state.phase === "return" && (
        <div class="action-bar single">
          <button class="btn primary" onClick={() => act(returnHome)}>본진으로 귀환 (41턴 휴식)</button>
        </div>
      )}
      {state.phase === "final" && (
        <div class="action-bar single">
          <button class="btn danger" onClick={() => act(finalTest)}>최종 시험 · 심마(心魔)와의 대결</button>
        </div>
      )}

      {/* 시트 */}
      {sheet === "train" && (
        <Sheet onClose={() => setSheet(null)}>
          <h3>훈련</h3>
          {fail > 0 && <p class="small" style={{ margin: 0, color: "var(--red)" }}>실패 확률 {Math.round(fail * 100)}% · 실패해도 일부 성장과 경험치는 얻습니다</p>}
          {TRAININGS.map((t) => {
            const preview = trainingPreview(state, t.id);
            return (
              <button class="card" key={t.id} onPointerEnter={() => setHover(t.id)} onPointerLeave={() => setHover(null)} onClick={() => act((s) => train(s, t.id))}>
                <div class="row between">
                  <b>{t.name} <span class="small gold">Lv{trainingLevel(state, t.id)}</span></b>
                  <span class={`small ${t.stamina > 0 ? "gain up" : "dim"}`}>기력 {t.stamina > 0 ? "+" : ""}{t.stamina}</span>
                </div>
                <div class="row wrap small" style={{ gap: 8, marginTop: 4 }}>
                  {(Object.entries(preview) as [StatKey, number][]).map(([k, v]) => (
                    <span key={k} class={(k === "outer" || k === "inner") && k !== character.attackType ? "faint" : "gain up"}>
                      {STAT_NAMES[k]} +{v}
                    </span>
                  ))}
                  {region.focus.includes(Object.keys(t.gains)[0] as StatKey) && t.id !== "meditate" && <span class="chip gold">지역 주요 상승</span>}
                </div>
              </button>
            );
          })}
        </Sheet>
      )}
      {sheet === "rest" && (
        <Sheet onClose={() => setSheet(null)}>
          <h3>휴식</h3>
          <button class="card" onClick={() => act((s) => rest(s, false))}>
            <b>일반 휴식</b>
            <div class="small dim">기력 +40 · 가끔 푹 쉬면 +60</div>
          </button>
          <button class="card" disabled={state.silver < premiumRestCost(state)} onClick={() => act((s) => rest(s, true))}>
            <div class="row between"><b>고급 휴식</b><span class="chip gold">은자 {premiumRestCost(state)}</span></div>
            <div class="small dim">기력 +65 · 가끔 완전 회복</div>
          </button>
        </Sheet>
      )}
      {sheet === "log" && (
        <Sheet onClose={() => setSheet(null)}>
          <h3>수련 일지</h3>
          {[...state.log].reverse().map((line, i) => <p key={i} class="small" style={{ margin: 0 }}>{line}</p>)}
        </Sheet>
      )}

      {/* 결과 · 이벤트 · 상점 · 스킬 선택 */}
      {pending && showBattle && pending.battle && (
        <BattleView title={pending.title} battle={pending.battle} onDone={() => setShowBattle(false)} />
      )}
      {pending && !showBattle && <ResultModal result={pending} onClose={() => setPending(null)} />}
      {!pending && state.phase === "event" && <EventModal state={state} onChoose={(i) => act((s) => resolveEvent(s, i))} />}
      {!pending && state.phase === "shop" && <ShopSheet state={state} act={act} />}
      {!pending && state.phase === "skill_choice" && <SkillChoice state={state} onChoose={(i) => act((s) => chooseSkill(s, i))} />}
      {error && <div class="toast">{error}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- 지역 선택
function RegionSelect({ state, onChoose, onExit }: { state: TrainingState; onChoose: (id: string) => void; onExit: () => void }) {
  const character = getCharacter(state.characterId);
  const [selected, setSelected] = useState<string | null>(null);
  const tier = getRegion(state.regionOptions[0]).tier;
  return (
    <div class="screen">
      <div class="row between">
        <div>
          <div class="small faint">{state.turn}턴 · {character.name}</div>
          <h2>{TIER_NAMES[tier]} 지역 선택</h2>
        </div>
        <button class="btn sm ghost" onClick={onExit}>나가기</button>
      </div>
      <p class="small dim" style={{ margin: 0 }}>10턴 동안 머물며 수련하고, 마지막 턴에 지역 보스와 겨룹니다. 지면 수련이 끝납니다.</p>
      {state.regionOptions.map((id) => {
        const r = getRegion(id);
        const home = r.homeFaction === character.faction;
        const useful = r.focus.includes(character.attackType);
        return (
          <button class={`card ${selected === id ? "selected" : ""}`} key={id} onClick={() => setSelected(id)}>
            <div class="row between">
              <h3>{r.name}</h3>
              {home && <span class="chip gold">연고 · 성장 +10%</span>}
            </div>
            <p class="small dim" style={{ margin: "2px 0 6px" }}>{r.desc}</p>
            <div class="row wrap" style={{ gap: 4 }}>
              <span class="small faint">주요 상승</span>
              {r.focus.map((f) => <span key={f} class={`chip ${f === character.attackType ? "green" : ""}`}>{STAT_NAMES[f]}</span>)}
              {!useful && r.focus.some((f) => f === "outer" || f === "inner") && <span class="chip red">계열 불일치</span>}
            </div>
            <div class="small" style={{ marginTop: 6 }}>보스: {r.boss.title} <b>{r.boss.name}</b></div>
          </button>
        );
      })}
      <div class="action-bar single">
        <button class="btn primary" disabled={!selected} onClick={() => selected && onChoose(selected)}>
          {selected ? `${getRegion(selected).name}(으)로` : "지역을 고르세요"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 스킬 줄
function SkillStrip({ state }: { state: TrainingState }) {
  const character = getCharacter(state.characterId);
  const slots: [string, { id: string; grade?: string } | undefined][] = [
    ["기본", { id: character.basicSkill }],
    ["액티브1", state.skills.active1],
    ["패시브1", state.skills.passive1],
    ["액티브2", state.skills.active2],
    ["패시브2", state.skills.passive2],
    ["필살기", state.skills.ultimate ? { id: state.skills.ultimate.id } : undefined],
  ];
  return (
    <div class="panel" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
      {slots.map(([label, skill]) => (
        <div key={label} class="col" style={{ gap: 2, padding: 6, borderRadius: 8, border: `1px ${skill ? "solid" : "dashed"} var(--line)`, minHeight: 50 }}>
          <span class="small faint" style={{ fontSize: 11 }}>{label}</span>
          {skill ? (
            <div class="row" style={{ gap: 4 }}>
              {skill.grade && <GradeBadge grade={skill.grade} />}
              <span class="small" style={{ lineHeight: 1.2 }}>{skillName(skill.id)}</span>
            </div>
          ) : (
            <span class="small faint">—</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- 모달 · 시트
function ResultModal({ result, onClose }: { result: ActionResult; onClose: () => void }) {
  return (
    <Modal>
      <div class="row between">
        <h2>{result.title}</h2>
        {result.crit && <span class="chip gold">크리티컬</span>}
        {!result.success && !result.battle && <span class="chip red">실패</span>}
      </div>
      <Gains gains={result.gains} />
      {result.messages.map((m, i) => <p key={i} style={{ margin: 0 }}>{m}</p>)}
      <button class="btn primary block" onClick={onClose}>확인</button>
    </Modal>
  );
}

function EventModal({ state, onChoose }: { state: TrainingState; onChoose: (i: number) => void }) {
  const event = currentEvent(state)!;
  const source = state.eventQueue[0].source;
  const label = source === "region" ? "지역 이벤트" : source === "character" ? "고유 이벤트" : "인연 이벤트";
  return (
    <Modal>
      <span class="chip gold" style={{ alignSelf: "flex-start" }}>{label}</span>
      <h2>{event.title}</h2>
      <p style={{ margin: 0 }}>{event.text}</p>
      {event.choices.map((c, i) => (
        <button class="btn block" key={i} onClick={() => onChoose(i)}>{c.label}</button>
      ))}
    </Modal>
  );
}

function ShopSheet({ state, act }: { state: TrainingState; act: (fn: (s: TrainingState) => ActionResult | void, quiet?: boolean) => void }) {
  const shop = state.shop!;
  return (
    <Sheet>
      <div class="row between">
        <h3>떠돌이 상인</h3>
        <span class="chip gold">은자 {state.silver}</span>
      </div>
      {shop.offers.map((o, i) => {
        const item = o.itemId ? ITEMS.find((it) => it.id === o.itemId) : undefined;
        return (
          <div class="card row between" key={i} style={{ opacity: o.sold ? 0.45 : 1 }}>
            <div>
              <b>{o.kind === "evolve" ? "스킬 진화권" : item!.name}</b>
              <div class="small dim">{o.kind === "evolve" ? "보유 스킬 중 무작위 하나가 한 등급 진화" : item!.desc}</div>
            </div>
            <button class="btn sm primary" disabled={o.sold || state.silver < o.price} onClick={() => act((s) => shopBuy(s, i), true)}>
              {o.sold ? "판매됨" : `${o.price}`}
            </button>
          </div>
        );
      })}
      <div class="row">
        <button class="btn grow" disabled={state.silver < rerollCost(state)} onClick={() => act((s) => shopReroll(s))}>새로고침 ({rerollCost(state)})</button>
        <button class="btn primary grow" onClick={() => act((s) => shopClose(s))}>나가기</button>
      </div>
    </Sheet>
  );
}

function SkillChoice({ state, onChoose }: { state: TrainingState; onChoose: (i: number) => void }) {
  const choice = state.skillChoice!;
  const [selected, setSelected] = useState<number | null>(null);
  const character = getCharacter(state.characterId);
  const tag = TRAITS[character.trait].tag;
  return (
    <Sheet>
      <h3>보스 격파 보상 · {choice.slot.startsWith("active") ? "액티브" : "패시브"} 스킬</h3>
      <p class="small dim" style={{ margin: 0 }}>하나를 골라 이번 심득에 새깁니다.</p>
      {choice.candidates.map((c, i) => {
        const def = SKILLS[c.id];
        const resonance = def.tags.includes(tag);
        return (
          <button class={`card ${selected === i ? "selected" : ""}`} key={i} onClick={() => setSelected(i)}>
            <div class="row between">
              <div class="row" style={{ gap: 6 }}><GradeBadge grade={c.grade} /><b>{def.name}</b></div>
              <div class="row" style={{ gap: 4 }}>
                {resonance && <span class="chip gold">천성 공명</span>}
                <span class="chip">{def.affinity === "common" ? "공용" : def.affinity === "outer" ? "외공" : "내공"}</span>
              </div>
            </div>
            <p class="small dim" style={{ margin: "4px 0 0" }}>{def.desc}</p>
            {def.type === "active" && <p class="small faint" style={{ margin: 0 }}>쿨타임 {def.cooldown}</p>}
          </button>
        );
      })}
      <button class="btn primary block" disabled={selected === null} onClick={() => selected !== null && onChoose(selected)}>선택</button>
    </Sheet>
  );
}
