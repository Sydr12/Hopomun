import { useEffect, useMemo, useState } from "preact/hooks";
import type { BattleEvent, BattleResult } from "../../core/battle";
import { Bar, Portrait } from "../components";

const SPEEDS = [1, 2, 4];
const BASE_DELAY = 700;

interface Float {
  key: number;
  uid: string;
  text: string;
  kind: "dmg" | "crit" | "heal" | "miss";
}

/** 전투 관전: 기록된 이벤트를 차례로 재생한다. */
export function BattleView({ title, battle, onDone }: { title: string; battle: BattleResult; onDone: () => void }) {
  const [index, setIndex] = useState(-1);
  const [speed, setSpeed] = useState(1);
  const [floats, setFloats] = useState<Float[]>([]);
  const finished = index >= battle.events.length - 1;
  const hp: Record<string, number> = index >= 0
    ? battle.events[index].hp
    : Object.fromEntries(battle.units.map((u) => [u.uid, u.maxHp]));
  const current: BattleEvent | undefined = battle.events[index];

  useEffect(() => {
    if (finished) return;
    const t = setTimeout(() => setIndex((i) => i + 1), (index < 0 ? 400 : BASE_DELAY) / speed);
    return () => clearTimeout(t);
  }, [index, speed, finished]);

  useEffect(() => {
    if (!current) return;
    const next: Float[] = current.hits.flatMap((h, i): Float[] => {
      const key = current.seq * 100 + i + Math.random();
      if (h.evaded) return [{ key, uid: h.uid, text: "회피", kind: "miss" }];
      if (h.blocked) return [{ key, uid: h.uid, text: "무적", kind: "miss" }];
      if (h.damage) return [{ key, uid: h.uid, text: `-${h.damage}`, kind: h.crit ? "crit" : "dmg" }];
      if (h.heal) return [{ key, uid: h.uid, text: `+${h.heal}`, kind: "heal" }];
      return [];
    });
    setFloats(next);
  }, [index]);

  const sides = useMemo(() => [0, 1].map((side) => battle.units.filter((u) => u.side === side)), [battle]);
  const log = battle.events.slice(0, index + 1);
  const won = battle.winner === 0;

  return (
    <div class="overlay center" style={{ background: "rgba(10,8,7,.94)" }}>
      <div class="modal" style={{ borderColor: "var(--line)" }}>
        <div class="row between">
          <h3>{title}</h3>
          <div class="row" style={{ gap: 4 }}>
            {SPEEDS.map((s) => (
              <button key={s} class={`btn sm ${speed === s ? "primary" : "ghost"}`} style={{ minHeight: 30, padding: "0 8px" }} onClick={() => setSpeed(s)}>
                {s}x
              </button>
            ))}
          </div>
        </div>
        <div class="battle-field">
          {sides.map((units, side) => (
            <div class="col" key={side} style={{ gap: 8 }}>
              <span class="small faint">{side === 0 ? "아군" : "상대"}</span>
              {units.map((u) => {
                const now = hp[u.uid] ?? u.maxHp;
                return (
                  <div class={`fighter col ${now <= 0 ? "dead" : ""} ${current?.actor === u.uid ? "acting" : ""}`} key={u.uid} style={{ gap: 4 }}>
                    <div class="row" style={{ gap: 8 }}>
                      <Portrait name={u.name} color={side === 0 ? "#8f7640" : "#6b302a"} size="sm" />
                      <div class="grow">
                        <div class="small"><b>{u.name}</b></div>
                        <div class="small faint">{now} / {u.maxHp}</div>
                      </div>
                    </div>
                    <Bar value={now} max={u.maxHp} color={side === 0 ? "var(--green)" : "var(--red)"} />
                    {floats.filter((f) => f.uid === u.uid).map((f, i) => (
                      <span key={f.key} class={`float ${f.kind}`} style={{ top: -6 - i * 18 }}>{f.text}</span>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div class="battle-log">
          {[...log].reverse().slice(0, 40).map((e) => (
            <p key={e.seq + e.text} class={e.actor.startsWith("a") ? "me" : "foe"}>{e.text}</p>
          ))}
        </div>
        {finished ? (
          <div class="col">
            <h2 style={{ textAlign: "center", color: won ? "var(--gold)" : "var(--red)" }}>{won ? "승리" : "패배"}</h2>
            <button class="btn primary block" onClick={onDone}>계속</button>
          </div>
        ) : (
          <button class="btn block ghost" onClick={() => setIndex(battle.events.length - 1)}>결과 바로 보기</button>
        )}
      </div>
    </div>
  );
}
