import { useState } from "preact/hooks";
import { PREMIUM_REST_AMOUNT, REST_AMOUNT, TRAININGS, TURNS_PER_REGION, type TrainingId } from "../../data/balance";
import { getCharacter } from "../../data/characters";
import type { EventDef } from "../../data/events";
import { FACTIONS } from "../../data/factions";
import { ITEMS } from "../../data/items";
import { getRegion, TIER_NAMES } from "../../data/regions";
import { SKILLS } from "../../data/skills";
import { TRAITS } from "../../data/traits";
import {
  chooseRegion, chooseSkill, currentEvent, currentRegionId, failRate, fightBoss, finalTest, premiumRestCost, quest,
  rerollCost, resolveEvent, rest, returnHome, shopBuy, shopClose, shopReroll, train, trainingPreview, trainingProgress,
  turnInRegion, type Acquired, type ActionResult, type TrainingState,
} from "../../core/training";
import { STAT_NAMES, type StatKey } from "../../core/types";
import { Backdrop, CharacterBust, NamedBust } from "../art";
import {
  Glyph, Sheet, SkillDetail, StaminaBar, StatFloater, TRAINING_GLYPH, TraitLine, staminaColor,
} from "../components";
import { AcquireModal, SkillChoice } from "./Acquire";
import { BattleView } from "./Battle";
import { EventScene } from "./Event";
import { ActionStage, ResultCard } from "./Stage";

type Mutate = (fn: (s: TrainingState) => ActionResult | void) => ActionResult | void;
type Kind = "train" | "rest" | "premium" | "other";

/** 진행 중인 연출 단계 */
type Flow =
  | { step: "stage"; result: ActionResult; kind: Kind; title: string; glyph: string; color: string }
  | { step: "battle"; result: ActionResult; kind: Kind }
  | { step: "result"; result: ActionResult; kind: Kind }
  | { step: "acquire"; acquired: Acquired }
  | { step: "event"; event: EventDef; source: "region" | "character" | "bond"; result: ActionResult };

const ITEM_GLYPH: Record<string, [string, string]> = {
  oegong_hwan: ["丸", "var(--stat-outer)"], naegong_dan: ["丹", "var(--stat-inner)"], hosin_bu: ["符", "var(--stat-guard)"],
  gihyeol_dan: ["血", "var(--stat-vital)"], daehwan: ["大", "var(--gold)"], gilyeok_yak: ["氣", "var(--jade)"], sohwan: ["還", "var(--jade)"],
};

export function TrainingScreen({ state, mutate, onExit }: { state: TrainingState; mutate: Mutate; onExit: () => void }) {
  const [sheet, setSheet] = useState<"train" | "rest" | "skills" | "log" | null>(null);
  const [picked, setPicked] = useState<TrainingId | null>(null);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [intro, setIntro] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const character = getCharacter(state.characterId);

  const say = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 1600);
  };

  /** 결과를 보여준 뒤, 스킬 획득이 있으면 전용 팝업으로 */
  const afterResult = (result: ActionResult) => setFlow(result.acquired ? { step: "acquire", acquired: result.acquired } : null);

  const run = (fn: (s: TrainingState) => ActionResult | void, kind: Kind, stage?: { title: string; glyph: string; color: string }) => {
    setSheet(null);
    setPicked(null);
    try {
      const result = mutate(fn);
      if (!result) return;
      if (stage) setFlow({ step: "stage", result, kind, ...stage });
      else if (result.battle) setFlow({ step: "battle", result, kind });
      else if (result.acquired && !result.messages.length) setFlow({ step: "acquire", acquired: result.acquired });
      else setFlow({ step: "result", result, kind });
    } catch (e) {
      say((e as Error).message);
    }
  };

  const regionId = state.turn >= 41 ? "home" : currentRegionId(state) ?? state.regions.at(-1) ?? "home";
  const pendingEvent = !flow && state.phase === "event" ? currentEvent(state) : null;

  // 연출 · 팝업: 지역 선택 화면 위에도 떠야 한다 (보스 격파 후 스킬 획득 팝업 등)
  const overlays = (
    <>
        {/* ---------------- 연출 ---------------- */}
        {intro && <RegionIntro regionId={intro} onClose={() => setIntro(null)} />}
        {flow?.step === "stage" && (
        <ActionStage title={flow.title} glyph={flow.glyph} color={flow.color} onDone={() => setFlow({ step: "result", result: flow.result, kind: flow.kind })} />
      )}
        {flow?.step === "battle" && flow.result.battle && (
        <BattleView title={flow.result.title} battle={flow.result.battle} regionId={regionId} onDone={() => setFlow({ step: "result", result: flow.result, kind: flow.kind })} />
      )}
        {flow?.step === "result" && <ResultCard result={flow.result} kind={flow.kind} onClose={() => afterResult(flow.result)} />}
        {flow?.step === "acquire" && <AcquireModal acquired={flow.acquired} onClose={() => setFlow(null)} />}
        {flow?.step === "event" && (
        <EventScene event={flow.event} source={flow.source} regionId={regionId} trainee={character.id} result={flow.result} onChoose={() => {}} onClose={() => setFlow(null)} />
      )}
        {!intro && pendingEvent && (
        <EventScene event={pendingEvent} source={state.eventQueue[0].source} regionId={regionId} trainee={character.id} result={null}
          onChoose={(i) => {
            const source = state.eventQueue[0].source;
            const result = mutate((s) => resolveEvent(s, i));
            if (result) setFlow({ step: "event", event: pendingEvent, source, result });
          }}
          onClose={() => {}} />
      )}
        {!flow && !intro && state.phase === "shop" && <ShopSheet state={state} run={run} />}
        {!flow && state.phase === "skill_choice" && <SkillChoice state={state} onChoose={(i) => run((s) => chooseSkill(s, i), "other")} />}
    </>
  );

  if (state.phase === "choose_region") {
    return (
      <>
        <RegionSelect state={state} onExit={onExit} onChoose={(id) => { mutate((s) => chooseRegion(s, id)); setIntro(id); }} />
        {overlays}
        {toast && <div class="toast">{toast}</div>}
      </>
    );
  }

  const region = getRegion(currentRegionId(state)!);
  const inRegion = turnInRegion(state);
  const preview = picked ? trainingPreview(state, picked) : undefined;
  const pickedDef = picked ? TRAININGS.find((t) => t.id === picked)! : undefined;
  const staminaPreview = pickedDef ? Math.max(0, Math.min(100, state.stamina + pickedDef.stamina)) : undefined;
  return (
    <div class="scene">
      <Backdrop regionId={regionId} />
      <CharacterBust characterId={character.id} className="main" />

      <div class="hud">
        {/* 머리: 장소 · 턴 */}
        <div class="hud-top glass">
          <div class="row between">
            <div class="grow">
              <span class="eyebrow">{state.turn >= 41 ? "본진" : `${TIER_NAMES[region.tier]} · ${inRegion}/${TURNS_PER_REGION}턴`}</span>
              <h3>{state.turn >= 41 ? "문파 본진" : region.name}</h3>
            </div>
            <div class="col" style={{ alignItems: "flex-end", gap: 0 }}>
              <span key={state.turn} class="turn-num pulse">{state.turn}<span class="tiny faint"> / 42</span></span>
              <button class="btn ghost sm" style={{ height: 22, padding: "0 4px" }} onClick={onExit}>나가기</button>
            </div>
          </div>
          <div class="progress42">
            {Array.from({ length: 42 }, (_, i) => {
              const t = i + 1;
              return <i key={t} class={`${t < state.turn ? "done" : ""} ${t === state.turn ? "now" : ""} ${t % 10 === 0 && t <= 40 ? "boss" : ""}`} />;
            })}
          </div>
        </div>
      </div>

      <StatFloater base={character.baseStats} training={state.stats} attackType={character.attackType} preview={preview} />

      {/* 이름표 */}
      <div class="nameplate glass">
        <div class="row between">
          <div class="row" style={{ gap: 6 }}>
            <b style={{ fontFamily: "var(--serif)", fontSize: 16 }}>{character.name}</b>
            <span class="chip" style={{ color: FACTIONS[character.faction].color }}>{FACTIONS[character.faction].name}</span>
            <span class="chip">{character.attackType === "outer" ? "외공" : "내공"}</span>
          </div>
          <div class="row" style={{ gap: 4 }}>
            <span class="chip gold num">은자 {state.silver}</span>
            <button class="btn icon" aria-label="스킬" onClick={() => setSheet("skills")}>技</button>
            <button class="btn icon" aria-label="수련 일지" onClick={() => setSheet("log")}>誌</button>
          </div>
        </div>
        <StaminaBar value={state.stamina} preview={staminaPreview} />
      </div>

      {/* 행동 바 */}
      <div class="bottom-bar">
        {state.phase === "action" && (
          <>
            <button class="btn primary" onClick={() => setSheet("train")}>훈련</button>
            <button class="btn" onClick={() => run(quest, "other")}>의뢰</button>
            <button class="btn" onClick={() => setSheet("rest")}>휴식</button>
          </>
        )}
        {state.phase === "boss" && <button class="btn danger" onClick={() => run(fightBoss, "other")}>보스 결투 · {region.boss.name}</button>}
        {state.phase === "return" && <button class="btn primary" onClick={() => run(returnHome, "rest", { title: "귀환", glyph: "歸", color: "var(--gold)" })}>본진으로 귀환</button>}
        {state.phase === "final" && <button class="btn danger" onClick={() => run(finalTest, "other")}>최종 시험 · 심마(心魔)</button>}
      </div>

      {/* ---------------- 시트 ---------------- */}
      {sheet === "train" && (
        <Sheet onClose={() => { setSheet(null); setPicked(null); }}>
          <div class="row between"><h3>훈련</h3><span class="tiny faint">실패 확률은 훈련 후 기력 기준</span></div>
          {TRAININGS.map((t) => {
            const p = trainingPreview(state, t.id);
            const prog = trainingProgress(state, t.id);
            const risk = failRate(state, t.id);
            const g = TRAINING_GLYPH[t.id];
            const focus = region.focus.includes(Object.keys(t.gains)[0] as StatKey) && t.id !== "meditate";
            return (
              <button key={t.id} class={`card ${picked === t.id ? "selected" : ""}`} onClick={() => setPicked(t.id)}>
                <div class="train-row">
                  <Glyph ch={g.ch} color={g.color} />
                  <div class="col" style={{ gap: 3 }}>
                    <div class="row" style={{ gap: 6 }}>
                      <b>{t.name}</b>
                      <span class="tiny gold">Lv{prog.level}</span>
                      <span class="exp">{Array.from({ length: prog.need }, (_, i) => <i key={i} class={i < prog.exp ? "on" : ""} />)}</span>
                      {focus && <span class="chip gold" style={{ height: 16, fontSize: 10 }}>주요</span>}
                    </div>
                    <div class="row wrap tiny" style={{ gap: 6 }}>
                      {(Object.entries(p) as [StatKey, number][]).map(([k, v]) => (
                        <span key={k} style={{ color: (k === "outer" || k === "inner") && k !== character.attackType ? "var(--text-faint)" : "var(--green)" }}>
                          {STAT_NAMES[k]} +{v}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div class="col" style={{ alignItems: "flex-end", gap: 2 }}>
                    <span class="tiny" style={{ color: t.stamina > 0 ? "var(--green)" : "var(--text-dim)" }}>기력 {t.stamina > 0 ? "+" : ""}{t.stamina}</span>
                    <span class="risk" style={{ color: risk === 0 ? "var(--text-faint)" : risk < 0.25 ? "var(--gold)" : "var(--red)" }}>
                      {risk === 0 ? "안전" : `실패 ${Math.round(risk * 100)}%`}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
          <button class="btn primary block" disabled={!picked} onClick={() => {
            const t = TRAININGS.find((x) => x.id === picked)!;
            const g = TRAINING_GLYPH[t.id];
            run((s) => train(s, t.id), "train", { title: t.name, glyph: g.ch, color: g.color });
          }}>
            {pickedDef ? `${pickedDef.name} 시작` : "훈련을 고르세요"}
          </button>
        </Sheet>
      )}
      {sheet === "rest" && (
        <Sheet onClose={() => setSheet(null)}>
          <h3>휴식</h3>
          <button class="card" onClick={() => run((s) => rest(s, false), "rest", { title: "휴식", glyph: "眠", color: "var(--jade)" })}>
            <div class="train-row">
              <Glyph ch="眠" color="var(--jade)" />
              <div><b>일반 휴식</b><p class="tiny dim">기력 +{REST_AMOUNT} · 가끔 푹 쉬면 더 회복</p></div>
              <span class="tiny faint">무료</span>
            </div>
          </button>
          <button class="card" disabled={state.silver < premiumRestCost()} style={{ opacity: state.silver < premiumRestCost() ? 0.4 : 1 }}
            onClick={() => run((s) => rest(s, true), "premium", { title: "고급 휴식", glyph: "榻", color: "var(--gold)" })}>
            <div class="train-row">
              <Glyph ch="榻" color="var(--gold)" />
              <div><b>고급 휴식</b><p class="tiny dim">기력 +{PREMIUM_REST_AMOUNT} · 가끔 완전 회복</p></div>
              <span class="chip gold">은자 {premiumRestCost()}</span>
            </div>
          </button>
        </Sheet>
      )}
      {sheet === "skills" && (
        <Sheet onClose={() => setSheet(null)}>
          <h3>{character.name}의 무공</h3>
          <div class="card"><TraitLine character={character} /></div>
          <div class="card"><span class="eyebrow">기본기</span><SkillDetail def={SKILLS[character.basicSkill]} /></div>
          {(["active1", "active2", "passive1", "passive2"] as const).map((slot) => {
            const s = state.skills[slot];
            return (
              <div class="card" key={slot} style={{ opacity: s ? 1 : 0.5 }}>
                <span class="eyebrow">{slot.startsWith("active") ? "액티브" : "패시브"} {slot.endsWith("1") ? "1" : "2"}</span>
                {s ? <SkillDetail def={SKILLS[s.id]} grade={s.grade} traitTag={TRAITS[character.trait].tag} /> : <p class="small faint">{slot === "active1" ? "초급" : slot === "passive1" ? "중급" : slot === "active2" ? "고급" : "최고급"} 보스를 꺾으면 얻습니다</p>}
              </div>
            );
          })}
          <div class="card" style={{ opacity: state.skills.ultimate ? 1 : 0.5 }}>
            <span class="eyebrow">필살기</span>
            {state.skills.ultimate ? <SkillDetail def={SKILLS[state.skills.ultimate.id]} level={state.skills.ultimate.level} /> : <p class="small faint">최종 시험에서 깨우칩니다 ({character.ultimates.map((u) => SKILLS[u].name).join(" / ")} 중 하나)</p>}
          </div>
        </Sheet>
      )}
      {sheet === "log" && (
        <Sheet onClose={() => setSheet(null)}>
          <h3>수련 일지</h3>
          {[...state.log].reverse().map((line, i) => <p key={i} class="small dim">{line}</p>)}
        </Sheet>
      )}

      {overlays}
      {toast && <div class="toast">{toast}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- 지역
function RegionSelect({ state, onChoose, onExit }: { state: TrainingState; onChoose: (id: string) => void; onExit: () => void }) {
  const character = getCharacter(state.characterId);
  const [selected, setSelected] = useState<string | null>(null);
  const tier = getRegion(state.regionOptions[0]).tier;
  return (
    <div class="screen">
      <div class="row between">
        <div>
          <span class="eyebrow">{state.turn}턴 · {character.name}</span>
          <h2>{TIER_NAMES[tier]} 지역</h2>
        </div>
        <button class="btn ghost sm" onClick={onExit}>나가기</button>
      </div>
      <p class="small dim">열 턴 동안 머물며 수련하고, 마지막 턴에 지역 보스와 겨룹니다. 지면 수련이 끝납니다.</p>
      {state.regionOptions.map((id) => {
        const r = getRegion(id);
        const home = r.homeFaction === character.faction;
        const mismatch = r.focus.some((f) => f === "outer" || f === "inner") && !r.focus.includes(character.attackType);
        return (
          <button key={id} class={`card ${selected === id ? "selected" : ""}`} style={{ position: "relative", overflow: "hidden", padding: 0 }} onClick={() => setSelected(id)}>
            <div style={{ position: "relative", height: 74 }}><Backdrop regionId={id} /></div>
            <div class="col" style={{ padding: "8px 12px 10px", gap: 4 }}>
              <div class="row between">
                <h3>{r.name}</h3>
                {home && <span class="chip gold">연고 +10%</span>}
              </div>
              <p class="tiny dim">{r.desc}</p>
              <div class="row wrap" style={{ gap: 4 }}>
                {r.focus.map((f) => <span key={f} class={`chip ${f === character.attackType ? "green" : ""}`}>{STAT_NAMES[f]} ↑</span>)}
                {mismatch && <span class="chip red">계열 불일치</span>}
                <span class="grow" />
                <span class="tiny faint">보스 {r.boss.name}</span>
              </div>
            </div>
          </button>
        );
      })}
      <div class="bottom-bar">
        <button class="btn primary" disabled={!selected} onClick={() => selected && onChoose(selected)}>
          {selected ? `${getRegion(selected).name}(으)로 떠난다` : "지역을 고르세요"}
        </button>
      </div>
    </div>
  );
}

function RegionIntro({ regionId, onClose }: { regionId: string; onClose: () => void }) {
  const r = getRegion(regionId);
  return (
    <div class="vn" onClick={onClose} style={{ zIndex: 26 }}>
      <Backdrop regionId={regionId} />
      <NamedBust name={r.boss.name} hostile className="speaker" />
      <div class="vn-box glass">
        <span class="eyebrow">{TIER_NAMES[r.tier]} 지역 도착</span>
        <h1 class="stage-title" style={{ fontSize: 26, letterSpacing: ".08em" }}>{r.name}</h1>
        <p class="small dim">{r.desc}</p>
        <p class="small">열 턴 뒤, <b class="gold">{r.boss.title} {r.boss.name}</b>이(가) 기다린다.</p>
        <button class="btn primary block" onClick={onClose}>수련 시작</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 상점
function ShopSheet({ state, run }: { state: TrainingState; run: (fn: (s: TrainingState) => ActionResult | void, kind: Kind) => void }) {
  const shop = state.shop!;
  return (
    <Sheet>
      <div class="row between">
        <div><span class="eyebrow">떠돌이 상인</span><h3>무엇을 사시겠소?</h3></div>
        <span class="chip gold num">은자 {state.silver}</span>
      </div>
      {shop.offers.map((o, i) => {
        const item = o.itemId ? ITEMS.find((it) => it.id === o.itemId) : undefined;
        const [ch, color] = o.kind === "evolve" ? ["進", "var(--gold)"] : ITEM_GLYPH[item!.id] ?? ["?", "var(--text-dim)"];
        return (
          <div key={i} class="card train-row" style={{ opacity: o.sold ? 0.4 : 1 }}>
            <Glyph ch={ch} color={color} />
            <div>
              <b>{o.kind === "evolve" ? "스킬 진화권" : item!.name}</b>
              <p class="tiny dim">{o.kind === "evolve" ? "보유 스킬 중 무작위 하나가 한 등급 진화" : item!.desc}</p>
            </div>
            <button class="btn sm primary" disabled={o.sold || state.silver < o.price} onClick={() => run((s) => shopBuy(s, i), "other")}>
              {o.sold ? "완료" : o.price}
            </button>
          </div>
        );
      })}
      <div class="row">
        <button class="btn grow" disabled={state.silver < rerollCost(state)} onClick={() => run((s) => shopReroll(s), "other")}>새 물건 ({rerollCost(state)})</button>
        <button class="btn primary grow" onClick={() => run((s) => shopClose(s), "other")}>떠난다</button>
      </div>
      <p class="tiny faint" style={{ textAlign: "center" }}>기력 {state.stamina}<span style={{ color: staminaColor(state.stamina) }}> ●</span></p>
    </Sheet>
  );
}
