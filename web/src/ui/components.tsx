import type { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { artUrl } from "../data/art";
import { FACTIONS } from "../data/factions";
import { SKILLS } from "../data/skills";
import { TRAITS } from "../data/traits";
import type { CharacterDef, SkillDef, SkillGrade, StatKey, Stats, TargetRange } from "../core/types";
import { STAT_KEYS, STAT_NAMES } from "../core/types";

export const STAT_COLORS: Record<StatKey, string> = {
  outer: "var(--stat-outer)",
  inner: "var(--stat-inner)",
  guard: "var(--stat-guard)",
  vital: "var(--stat-vital)",
};

/** 훈련 · 상품 아이콘용 한자 */
export const TRAINING_GLYPH: Record<string, { ch: string; color: string }> = {
  outer: { ch: "剛", color: "var(--stat-outer)" },
  inner: { ch: "氣", color: "var(--stat-inner)" },
  guard: { ch: "盾", color: "var(--stat-guard)" },
  vital: { ch: "血", color: "var(--stat-vital)" },
  meditate: { ch: "靜", color: "var(--jade)" },
};

export function Glyph({ ch, color }: { ch: string; color: string }) {
  return <span class="glyph" style={{ background: color }}>{ch}</span>;
}

export function Portrait({ name, color, size, image }: { name: string; color: string; size?: number; image?: string }) {
  const s = size ?? 44;
  return (
    <div style={{
      width: s, height: s, borderRadius: s / 4, flexShrink: 0, display: "grid", placeItems: "center", position: "relative", overflow: "hidden",
      background: `linear-gradient(160deg, ${color}, #241d19)`, fontFamily: "var(--serif)", fontWeight: 900, fontSize: s * 0.42, color: "rgba(0,0,0,.5)",
      border: "1px solid var(--line-2)",
    }}>
      {name.slice(0, 1)}
      {image && <img src={image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
    </div>
  );
}

export function CharacterPortrait({ character, size }: { character: CharacterDef; size?: number }) {
  return <Portrait name={character.name} color={FACTIONS[character.faction].color} size={size} image={artUrl(`char_${character.id}_face_default.webp`)} />;
}

export function Bar({ value, max, color, ghost, lg }: { value: number; max: number; color: string; ghost?: number; lg?: boolean }) {
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;
  return (
    <div class={`bar ${lg ? "lg" : ""}`}>
      {ghost !== undefined && ghost > value && <span class="ghost-fill" style={{ width: pct(ghost), background: color }} />}
      <span style={{ width: pct(value), background: color, position: "relative" }} />
    </div>
  );
}

export function staminaColor(v: number): string {
  return v >= 50 ? "var(--green)" : v >= 30 ? "#e2b04f" : "var(--red)";
}

/** 기력 막대. preview가 있으면 "현재 → 예상"을 함께 보여준다. */
export function StaminaBar({ value, preview }: { value: number; preview?: number }) {
  const shown = preview ?? value;
  return (
    <div class="row" style={{ gap: 8 }}>
      <span class="tiny faint" style={{ width: 24 }}>기력</span>
      <div class="grow"><Bar value={Math.min(value, shown)} ghost={Math.max(value, shown)} max={100} color={staminaColor(shown)} lg /></div>
      <span class="small num" style={{ minWidth: 54, textAlign: "right" }}>
        {preview !== undefined && preview !== value ? <>{value}<span class="faint"> → </span><b style={{ color: staminaColor(preview) }}>{preview}</b></> : value}
      </span>
    </div>
  );
}

/** 값이 바뀌면 잠깐 튀어 오르는 표시 */
function useBump(value: number): boolean {
  const prev = useRef(value);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (value > prev.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 650);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value]);
  return bump;
}

function StatLine({ k, total, training, unused, plus, max }: { k: StatKey; total: number; training: number; unused: boolean; plus?: number; max: number }) {
  const bump = useBump(total);
  return (
    <div class={`s ${unused ? "unused" : ""} ${bump ? "bump" : ""}`}>
      <i style={{ background: STAT_COLORS[k] }} />
      <span class="small">{STAT_NAMES[k]}</span>
      <span class="v">{total}</span>
      <Bar value={total} ghost={plus ? total + plus : undefined} max={max} color={STAT_COLORS[k]} />
      {plus ? <span class="plus">+{plus}</span> : <span class="tiny faint" style={{ gridColumn: 3, justifySelf: "end", marginTop: -4 }}>수련 {training}</span>}
    </div>
  );
}

/** 화면 한쪽에 떠 있는 능력치 */
export function StatFloater({ base, training, attackType, preview }: { base: Stats; training: Stats; attackType: "outer" | "inner"; preview?: Partial<Stats> }) {
  const max = Math.max(250, ...STAT_KEYS.map((k) => base[k] + training[k] + (preview?.[k] ?? 0))) * 1.1;
  const order: StatKey[] = [attackType, "guard", "vital", attackType === "outer" ? "inner" : "outer"];
  return (
    <div class="stat-float glass">
      {order.map((k) => (
        <StatLine key={k} k={k} total={base[k] + training[k]} training={training[k]} unused={k !== attackType && (k === "outer" || k === "inner")} plus={preview?.[k]} max={max} />
      ))}
    </div>
  );
}

export function Gains({ gains, mult }: { gains: Partial<Stats>; mult?: string }) {
  const entries = STAT_KEYS.filter((k) => gains[k]);
  if (!entries.length) return null;
  return (
    <div class="row wrap" style={{ justifyContent: "center", gap: 6 }}>
      {entries.map((k, i) => (
        <span class="gain-chip" key={k} style={{ animationDelay: `${i * 80}ms`, color: gains[k]! > 0 ? STAT_COLORS[k] : "var(--red)" }}>
          <span class="small">{STAT_NAMES[k]}</span> {gains[k]! > 0 ? "+" : ""}{gains[k]}
        </span>
      ))}
      {mult && <span class="gain-chip gold" style={{ color: "var(--gold)" }}>{mult}</span>}
    </div>
  );
}

export function GradeBadge({ grade, lg }: { grade: SkillGrade | string; lg?: boolean }) {
  return <span class={`grade ${grade} ${lg ? "lg" : ""}`}>{grade}</span>;
}

export function skillName(id: string): string {
  return SKILLS[id]?.name ?? id;
}

const RANGE_LABEL: Record<TargetRange, string> = {
  single: "단일 (앞열)", pierce: "관통 (한 줄)", column: "열 공격", snipe: "저격 (후열)", lowest: "가장 약한 적",
  all: "적 전체", self: "자신", ally_lowest: "아군 1명", ally_cc: "아군 1명", allies: "아군 전체",
};
const AFFINITY_LABEL = { common: "공용", outer: "외공 전용", inner: "내공 전용" } as const;

/** 스킬 상세 (획득 · 선택 · 목록 공용) */
export function SkillDetail({ def, grade, level, traitTag, hideName }: { def: SkillDef; grade?: SkillGrade; level?: number; traitTag?: string; hideName?: boolean }) {
  const resonance = traitTag && def.tags.includes(traitTag as never);
  return (
    <div class="col" style={{ gap: 4 }}>
      <div class="row" style={{ gap: 6, display: hideName ? "none" : undefined }}>
        {grade && <GradeBadge grade={grade} />}
        {level && <span class="chip gold">{level}단계</span>}
        <b>{def.name}</b>
        <span class="grow" />
        {resonance && <span class="chip gold">천성 공명</span>}
      </div>
      <div class="row wrap" style={{ gap: 4 }}>
        <span class="chip">{def.type === "active" ? "액티브" : "패시브"}</span>
        <span class="chip">{AFFINITY_LABEL[def.affinity]}</span>
        {def.type === "active" && <span class="chip">{RANGE_LABEL[def.range]}</span>}
        {def.type === "active" && def.cooldown > 0 && <span class="chip">쿨타임 {def.cooldown}</span>}
        {def.type === "active" && def.initialCooldown ? <span class="chip">초기 쿨타임 {def.initialCooldown}</span> : null}
      </div>
      <p class="small dim">{def.desc}</p>
    </div>
  );
}

export function TraitLine({ character }: { character: CharacterDef }) {
  const t = TRAITS[character.trait];
  return (
    <div class="col" style={{ gap: 2 }}>
      <p class="small"><b class="gold">천성 {t.name}</b> {t.desc}</p>
      <p class="tiny faint">공명: {t.resonance}</p>
    </div>
  );
}

export function Sheet({ children, onClose }: { children: ComponentChildren; onClose?: () => void }) {
  return (
    <div class="overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div class="sheet">{children}</div>
    </div>
  );
}

export function Modal({ children, className }: { children: ComponentChildren; className?: string }) {
  return (
    <div class="overlay center">
      <div class={`modal ${className ?? ""}`}>{children}</div>
    </div>
  );
}

/** 폭죽 불꽃 (크리티컬 연출) */
export function Sparks({ count = 14, color = "var(--gold)" }: { count?: number; color?: string }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dist = 70 + (i % 3) * 30;
        return (
          <span key={i} class="spark" style={{
            left: "50%", top: "45%", background: color, animationDelay: `${(i % 4) * 30}ms`,
            ["--dx" as string]: `${Math.cos(angle) * dist}px`, ["--dy" as string]: `${Math.sin(angle) * dist}px`,
          }} />
        );
      })}
    </>
  );
}
