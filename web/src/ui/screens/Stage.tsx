import { useEffect, useState } from "preact/hooks";
import { TRAININGS } from "../../data/balance";
import type { ActionResult } from "../../core/training";
import { Gains, Glyph, Sparks, StaminaBar, TRAINING_GLYPH } from "../components";

/** 훈련 · 휴식 연출: 붓글씨 제목 + 진행 막대 (탭하면 건너뛴다) */
export function ActionStage({ title, glyph, color, onDone }: { title: string; glyph: string; color: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1100);
    return () => clearTimeout(t);
  }, []);
  return (
    <div class="stage" onClick={onDone}>
      <div class="col" style={{ alignItems: "center", gap: 10 }}>
        <div style={{ transform: "scale(1.8)", animation: "pop .3s ease" }}><Glyph ch={glyph} color={color} /></div>
        <div class="stage-title">{title}</div>
        <div class="stage-bar"><span /></div>
      </div>
    </div>
  );
}

const CRIT_WORD: Record<string, string> = { train: "대성공!", rest: "숙면!", premium: "완전 회복!" };

/** 행동 결과 카드: 크리티컬이면 도장 · 섬광 · 불꽃 · 흔들림 */
export function ResultCard({ result, kind, onClose }: { result: ActionResult; kind: "train" | "rest" | "premium" | "other"; onClose: () => void }) {
  const [shake, setShake] = useState(result.crit || (!result.success && kind === "train"));
  useEffect(() => {
    const t = setTimeout(() => setShake(false), 450);
    return () => clearTimeout(t);
  }, []);
  const training = result.levelUp ? TRAININGS.find((t) => t.id === result.levelUp!.id) : undefined;
  const stampText = result.crit ? CRIT_WORD[kind] ?? "대성공!" : kind === "train" ? (result.success ? "성공" : "실패…") : null;
  const stampClass = result.crit ? "crit" : result.success ? "ok" : "fail";
  return (
    <div class="overlay center" style={{ zIndex: 32 }}>
      {result.crit && <div class="burst" />}
      <div class={`modal result-card ${shake ? "shake" : ""}`} style={{ alignItems: "stretch" }}>
        {result.crit && <Sparks count={18} />}
        <div class="row between">
          <b>{result.title}</b>
          {result.silver ? <span class="chip gold">은자 +{result.silver}</span> : null}
        </div>
        {stampText && <div class={`stamp ${stampClass}`}>{stampText}</div>}
        <Gains gains={result.gains} mult={result.crit && kind === "train" ? "×1.5" : undefined} />
        {result.levelUp && training && (
          <p class="levelup" style={{ textAlign: "center" }}>
            {TRAINING_GLYPH[training.id].ch} {training.name} Lv{result.levelUp.level} 달성!
          </p>
        )}
        {result.stamina && <StaminaBar value={result.stamina.before} preview={result.stamina.after} />}
        {result.messages.filter((m) => !m.startsWith("기력 +") && !m.includes("달성!")).map((m, i) => (
          <p key={i} class="small dim" style={{ textAlign: "center" }}>{m}</p>
        ))}
        <button class="btn primary block" onClick={onClose}>확인</button>
      </div>
    </div>
  );
}
