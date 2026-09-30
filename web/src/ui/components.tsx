import type { ComponentChildren } from "preact";
import { ART_FILES } from "../data/art";
import { FACTIONS } from "../data/factions";
import { SKILLS } from "../data/skills";
import type { CharacterDef, SkillGrade, StatKey, Stats } from "../core/types";
import { STAT_KEYS, STAT_NAMES } from "../core/types";

export const STAT_COLORS: Record<StatKey, string> = {
  outer: "var(--stat-outer)",
  inner: "var(--stat-inner)",
  guard: "var(--stat-guard)",
  vital: "var(--stat-vital)",
};

/** 일러스트 자리: 이미지가 있으면 쓰고, 없으면 세력 색 실루엣 + 이름 첫 글자 */
export function Portrait({ name, color, size, image }: { name: string; color: string; size?: "sm" | "lg"; image?: string }) {
  return (
    <div class={`portrait ${size ?? ""}`} style={{ background: `linear-gradient(160deg, ${color}, #2a2320)` }}>
      {name.slice(0, 1)}
      {image && <img src={image} alt="" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />}
    </div>
  );
}

export function CharacterPortrait({ character, size }: { character: CharacterDef; size?: "sm" | "lg" }) {
  const file = `char_${character.id}_face_default.webp`;
  const image = ART_FILES.has(file) ? `./art/${file}` : undefined;
  return <Portrait name={character.name} color={FACTIONS[character.faction].color} size={size} image={image} />;
}

export function Bar({ value, max, color, thin }: { value: number; max: number; color: string; thin?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div class={`bar ${thin ? "thin" : ""}`}>
      <span style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function StaminaBar({ value }: { value: number }) {
  const color = value >= 50 ? "var(--green)" : value >= 30 ? "#d6a54a" : "var(--red)";
  return (
    <div class="row">
      <b class="small" style={{ width: 34 }}>기력</b>
      <div class="grow"><Bar value={value} max={100} color={color} /></div>
      <span class="small" style={{ width: 30, textAlign: "right" }}>{value}</span>
    </div>
  );
}

/** 고유 + 수련 능력치 표시. 쓰지 않는 공격 스탯은 흐리게. */
export function StatTable({ base, training, attackType, preview, scaleMax }: {
  base: Stats; training: Stats; attackType: "outer" | "inner"; preview?: Partial<Stats>; scaleMax?: number;
}) {
  const max = scaleMax ?? Math.max(300, ...STAT_KEYS.map((k) => base[k] + training[k] + (preview?.[k] ?? 0)));
  return (
    <div class="col" style={{ gap: 6 }}>
      {STAT_KEYS.map((k) => {
        const unused = (k === "outer" || k === "inner") && k !== attackType;
        const total = base[k] + training[k];
        return (
          <div class={`stat-row ${unused ? "unused" : ""}`} key={k}>
            <span class="name" style={{ color: STAT_COLORS[k] }}>{STAT_NAMES[k]}</span>
            <div style={{ position: "relative" }}>
              <Bar value={total} max={max} color={STAT_COLORS[k]} />
              {preview?.[k] ? (
                <span class="small gain up" style={{ position: "absolute", right: 0, top: -18 }}>+{preview[k]}</span>
              ) : null}
            </div>
            <span class="val small">
              <b>{total}</b>
              <span class="faint"> ({training[k]})</span>
            </span>
          </div>
        );
      })}
      <p class="small faint" style={{ margin: 0 }}>괄호 안은 수련 스탯 · 흐린 공격 스탯은 이 캐릭터가 쓰지 않음</p>
    </div>
  );
}

export function Gains({ gains }: { gains: Partial<Stats> }) {
  const entries = STAT_KEYS.filter((k) => gains[k]);
  if (!entries.length) return null;
  return (
    <div class="row wrap">
      {entries.map((k) => (
        <span class={`chip ${gains[k]! > 0 ? "green" : "red"}`} key={k}>
          {STAT_NAMES[k]} {gains[k]! > 0 ? "+" : ""}{gains[k]}
        </span>
      ))}
    </div>
  );
}

export function GradeBadge({ grade }: { grade: SkillGrade | string }) {
  return <span class={`grade ${grade}`}>{grade}</span>;
}

export function skillName(id: string): string {
  return SKILLS[id]?.name ?? id;
}

export function Sheet({ children, onClose }: { children: ComponentChildren; onClose?: () => void }) {
  return (
    <div class="overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div class="sheet">{children}</div>
    </div>
  );
}

export function Modal({ children }: { children: ComponentChildren }) {
  return (
    <div class="overlay center">
      <div class="modal">{children}</div>
    </div>
  );
}
