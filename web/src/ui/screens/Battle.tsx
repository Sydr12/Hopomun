import type { JSX } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { BattleEvent, BattleResult, HitRecord, UnitSummary } from "../../core/battle";
import type { StatusType } from "../../core/types";
import { SKILLS } from "../../data/skills";
import { Backdrop, CharacterBust, NamedBust } from "../art";
import { Bar } from "../components";
import { CHARACTER_BY_ID } from "../../data/characters";

const SPEEDS = [1, 2, 4];
const STEP_MS = 900;
const TRAVEL_MS = 300;

const STATUS_NAME: Partial<Record<StatusType, string>> = {
  stun: "기절", freeze: "빙결", seal: "봉인", slow: "둔화", confuse: "혼란", bleed_seal: "봉혈", taunt: "도발",
  poison: "중독", atk_up: "공격↑", atk_down: "공격↓", def_up: "호신↑", def_down: "호신↓", invincible: "무적", cc_immune: "CC 면역",
};

type FxKind = "orb" | "needle" | "shard" | "slash" | "ring" | "rise" | "impact";
interface FxSpec { kind: FxKind; color: string; travel: boolean; count: number }

/** 스킬 → 이펙트 종류 */
function fxFor(event: BattleEvent, actor: UnitSummary | undefined): FxSpec {
  if (event.kind === "counter") return { kind: "slash", color: "#ffe0b0", travel: false, count: 1 };
  if (event.kind === "dot") return { kind: "rise", color: "#9fdc7a", travel: false, count: 3 };
  const def = event.skill ? SKILLS[event.skill] : undefined;
  const tags = def?.tags ?? [];
  const hits = def?.type === "active" ? Math.min(6, Math.max(...def.effects.map((e) => (e.kind === "damage" ? e.hits ?? 1 : 1)))) : 1;
  const range = def?.type === "active" ? def.range : "single";
  if (range === "self" || range === "allies" || range === "ally_lowest" || range === "ally_cc") {
    return tags.includes("heal") ? { kind: "rise", color: "#8fd08a", travel: false, count: 5 } : { kind: "ring", color: "#e0bd6f", travel: false, count: 1 };
  }
  if (tags.includes("freeze")) return { kind: "shard", color: "#9fd4ff", travel: true, count: Math.max(1, hits) };
  if (tags.includes("poison")) return { kind: "needle", color: "#bfe3a0", travel: true, count: Math.max(1, hits) };
  if (tags.includes("blood")) return { kind: "slash", color: "#ff5a5a", travel: false, count: 1 };
  if (tags.includes("taunt")) return { kind: "ring", color: "#ff9d5c", travel: false, count: 1 };
  if (actor?.attackType === "inner") return { kind: "orb", color: "#a29df0", travel: true, count: Math.min(3, hits) };
  return hits > 1 ? { kind: "slash", color: "#ffd9b0", travel: false, count: Math.min(3, hits) } : { kind: "slash", color: "#ffd9b0", travel: false, count: 1 };
}

/** 로그 한 줄 (수치 포함) */
function LogLine({ event, units }: { event: BattleEvent; units: Record<string, UnitSummary> }) {
  const actor = units[event.actor];
  const name = (uid: string) => units[uid]?.name ?? "?";
  const side = actor?.side === 0 ? "me" : "foe";
  if (event.kind === "death") return <p class="sys">{name(event.actor)} 쓰러짐</p>;
  if (event.kind === "skip") return <p class={side}>{event.text}</p>;
  if (event.kind === "trait" || event.kind === "buff") return <p class="sys">{event.text}</p>;
  if (event.kind === "dot") return <p class={side}>{name(event.actor)} 중독 <b class="d">-{event.hits[0]?.damage ?? 0}</b></p>;

  const byTarget = new Map<string, HitRecord[]>();
  for (const h of event.hits) byTarget.set(h.uid, [...(byTarget.get(h.uid) ?? []), h]);
  const parts: JSX.Element[] = [];
  byTarget.forEach((hits, uid) => {
    const bits: JSX.Element[] = [];
    hits.forEach((h, i) => {
      if (h.evaded) bits.push(<span key={i} class="faint">회피</span>);
      else if (h.blocked) bits.push(<span key={i} class="faint">무적</span>);
      else if (h.damage !== undefined) bits.push(<b key={i} class={h.crit ? "c" : "d"}>{h.crit ? "치명 " : ""}{h.damage}</b>);
      else if (h.heal !== undefined) bits.push(<b key={i} class="h">+{h.heal}</b>);
      else if (h.shield !== undefined) bits.push(<b key={i} class="s">보호막 {h.shield}</b>);
      else if (h.status) bits.push(<b key={i} class="s">[{STATUS_NAME[h.status]}]</b>);
      else if (h.resisted) bits.push(<span key={i} class="faint">[{STATUS_NAME[h.resisted]} 저항]</span>);
    });
    const joined = bits.flatMap((b, i) => (i ? [<span key={`s${i}`} class="faint"> · </span>, b] : [b]));
    parts.push(<span key={uid}> → {name(uid)} {joined}</span>);
  });
  const skill = event.kind === "counter" ? "반격" : `「${event.skill ? SKILLS[event.skill]?.name ?? "" : ""}」`;
  const total = event.hits.reduce((s, h) => s + (h.damage ?? 0), 0);
  return (
    <p class={side}>
      <b>{actor?.name}</b> {skill}{parts}
      {event.hits.filter((h) => h.damage).length > 1 && <span class="faint"> (합계 {total})</span>}
    </p>
  );
}

interface Float { key: string; uid: string; text: string; cls: string; offset: number }

export function BattleView({ title, battle, regionId, onDone }: { title: string; battle: BattleResult; regionId: string; onDone: () => void }) {
  const [index, setIndex] = useState(-1);
  const [phase, setPhase] = useState<"cast" | "impact">("impact");
  const [speed, setSpeed] = useState(1);
  const logRef = useRef<HTMLDivElement>(null);
  const units = useMemo(() => Object.fromEntries(battle.units.map((u) => [u.uid, u])), [battle]);
  const finished = index >= battle.events.length - 1;
  const current = index >= 0 ? battle.events[index] : undefined;
  const fx = current ? fxFor(current, units[current.actor]) : undefined;

  // 진행 타이머: 시전 → 적중 → 다음 이벤트
  useEffect(() => {
    if (finished && phase === "impact") return;
    const next = phase === "cast"
      ? setTimeout(() => setPhase("impact"), (fx?.travel ? TRAVEL_MS : 150) / speed)
      : setTimeout(() => { setIndex((i) => i + 1); setPhase("cast"); }, (index < 0 ? 300 : STEP_MS) / speed);
    return () => clearTimeout(next);
  }, [index, phase, speed, finished]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [index, phase]);

  // 체력: 적중 후에만 반영
  const hpSource = phase === "impact" ? current : battle.events[index - 1];
  const hp: Record<string, number> = hpSource ? hpSource.hp : Object.fromEntries(battle.units.map((u) => [u.uid, u.maxHp]));

  const sides = [0, 1].map((s) => battle.units.filter((u) => u.side === s));
  const posOf = (uid: string) => {
    const u = units[uid];
    const list = sides[u.side];
    const i = list.indexOf(u);
    const w = 46 / list.length;
    const left = u.side === 0 ? 2 + i * w : 52 + i * w;
    return { x: left + w / 2, y: 55 };
  };

  const hitTargets = current && phase === "impact" ? new Set(current.hits.filter((h) => h.damage).map((h) => h.uid)) : new Set<string>();
  const crit = current && phase === "impact" && current.hits.some((h) => h.crit);

  const floats: Float[] = [];
  if (current && phase === "impact") {
    const count: Record<string, number> = {};
    current.hits.forEach((h, i) => {
      const n = (count[h.uid] = (count[h.uid] ?? 0) + 1);
      const base = { key: `${index}-${i}`, uid: h.uid, offset: n - 1 };
      if (h.evaded) floats.push({ ...base, text: "회피", cls: "miss" });
      else if (h.blocked) floats.push({ ...base, text: "무적", cls: "miss" });
      else if (h.damage !== undefined) floats.push({ ...base, text: `${h.damage}`, cls: h.crit ? "crit" : "" });
      else if (h.heal) floats.push({ ...base, text: `+${h.heal}`, cls: "heal" });
      else if (h.status) floats.push({ ...base, text: STATUS_NAME[h.status] ?? "", cls: "status" });
    });
  }

  const effects: JSX.Element[] = [];
  if (current && fx) {
    const from = posOf(current.actor);
    const targets = [...new Set(current.hits.map((h) => h.uid))];
    if (phase === "cast" && fx.travel) {
      targets.forEach((uid) => {
        const to = posOf(uid);
        for (let n = 0; n < fx.count; n++) {
          effects.push(
            <span key={`p${uid}${n}`} class={`fx ${fx.kind} travel`} style={{
              ["--x0" as string]: `${from.x}%`, ["--y0" as string]: `${from.y - 6 + n * 6}%`,
              ["--x1" as string]: `${to.x}%`, ["--y1" as string]: `${to.y - 6 + n * 6}%`,
              ["--c" as string]: fx.color, ["--dur" as string]: `${(TRAVEL_MS + n * 40) / speed}ms`,
              transform: from.x > to.x ? "scaleX(-1)" : undefined,
            }} />,
          );
        }
      });
    }
    if (phase === "impact") {
      targets.forEach((uid) => {
        const to = posOf(uid);
        for (let n = 0; n < fx.count; n++) {
          const kind = fx.travel ? "impact" : fx.kind;
          effects.push(
            <span key={`i${uid}${n}`} class={`fx ${kind}`} style={{
              left: `${to.x + (n - (fx.count - 1) / 2) * 5}%`, top: `${to.y - 8 + (n % 2) * 8}%`,
              ["--c" as string]: fx.color, animationDelay: `${n * 70}ms`,
            }} />,
          );
        }
      });
    }
  }

  const won = battle.winner === 0;
  const log = battle.events.slice(0, phase === "impact" ? index + 1 : index);

  return (
    <div class="battle">
      <div class={`arena ${crit ? "quake" : ""}`}>
        <Backdrop regionId={regionId} />
        {battle.units.map((u) => {
          const now = hp[u.uid] ?? u.maxHp;
          const list = sides[u.side];
          const i = list.indexOf(u);
          const w = 46 / list.length;
          const style = { left: u.side === 0 ? `${2 + i * w}%` : undefined, right: u.side === 1 ? `${2 + (list.length - 1 - i) * w}%` : undefined, width: `${w}%` };
          return (
            <div key={u.uid}>
              <div class={`fighter side${u.side} ${current?.actor === u.uid && phase === "cast" ? "acting" : ""} ${hitTargets.has(u.uid) ? "hit" : ""} ${now <= 0 ? "dead" : ""}`} style={style}>
                {CHARACTER_BY_ID[u.id] ? <CharacterBust characterId={u.id} /> : <NamedBust name={u.name} hostile={u.side === 1} />}
              </div>
              <div class={`hp-tag glass side${u.side}`} style={{ ...style, top: 8 }}>
                <div class="row between"><b class="small">{u.name}</b><span class="tiny num dim">{now}/{u.maxHp}</span></div>
                <Bar value={now} max={u.maxHp} color={u.side === 0 ? "var(--green)" : "var(--red)"} />
              </div>
            </div>
          );
        })}
        {effects}
        {floats.map((f) => {
          const p = posOf(f.uid);
          return <span key={f.key} class={`dmg ${f.cls}`} style={{ left: `${p.x + (f.offset % 2 ? 6 : -6) * Math.min(1, f.offset)}%`, top: `${p.y - 14 - f.offset * 7}%`, animationDelay: `${f.offset * 60}ms` }}>{f.text}</span>;
        })}
      </div>

      <div class="row between" style={{ padding: "8px var(--gutter)" }}>
        <b class="small">{title}</b>
        <div class="row" style={{ gap: 4 }}>
          {SPEEDS.map((s) => (
            <button key={s} class={`btn sm ${speed === s ? "primary" : ""}`} style={{ width: 38, padding: 0 }} onClick={() => setSpeed(s)}>{s}x</button>
          ))}
        </div>
      </div>
      <div class="log-box glass" ref={logRef}>
        {log.map((e) => <LogLine key={e.seq + e.kind + e.text} event={e} units={units} />)}
      </div>
      <div style={{ padding: "10px var(--gutter) calc(12px + env(safe-area-inset-bottom))", marginTop: "auto" }}>
        {finished && phase === "impact" ? (
          <div class="col" style={{ alignItems: "center" }}>
            <div class={`stamp ${won ? "crit" : "fail"}`}>{won ? "승리" : "패배"}</div>
            <button class="btn primary block" onClick={onDone}>계속</button>
          </div>
        ) : (
          <button class="btn block" onClick={() => { setIndex(battle.events.length - 1); setPhase("impact"); }}>결과 바로 보기</button>
        )}
      </div>
    </div>
  );
}
