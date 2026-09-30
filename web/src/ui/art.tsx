/** 배경 · 상반신 일러스트. 그림 파일이 없으면 색 배경과 실루엣으로 대신한다. */
import { artUrl, REGION_THEME } from "../data/art";
import { CHARACTER_BY_ID } from "../data/characters";
import { FACTIONS } from "../data/factions";

export function Backdrop({ regionId }: { regionId: string }) {
  const theme = REGION_THEME[regionId] ?? REGION_THEME.home;
  const image = artUrl(`bg_${regionId}.webp`);
  return (
    <div class="backdrop" style={{ background: `linear-gradient(180deg, ${theme.sky[0]}, ${theme.sky[1]})` }}>
      {image ? (
        <img src={image} alt="" />
      ) : (
        <>
          <svg viewBox="0 0 400 300" preserveAspectRatio="none" style={{ height: "70%", opacity: 0.55 }}>
            <path d="M0 150 L40 110 L80 140 L130 80 L175 130 L220 95 L270 140 L320 70 L360 120 L400 100 L400 300 L0 300 Z" fill={theme.ridge} />
          </svg>
          <svg viewBox="0 0 400 300" preserveAspectRatio="none" style={{ height: "55%" }}>
            <path d="M0 180 L50 150 L100 175 L150 130 L210 170 L260 140 L310 175 L360 150 L400 165 L400 300 L0 300 Z" fill="rgba(0,0,0,.45)" />
          </svg>
          <div class="mist" style={{ background: `radial-gradient(60% 30% at 30% 60%, ${theme.mist}, transparent), radial-gradient(50% 25% at 75% 45%, ${theme.mist}, transparent)` }} />
        </>
      )}
    </div>
  );
}

/** 상반신 실루엣 (세력 색) */
function Silhouette({ color, mark }: { color: string; mark: string }) {
  const id = `g${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg viewBox="0 0 200 240" style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color={color} stop-opacity=".95" />
          <stop offset="1" stop-color="#15110e" stop-opacity=".95" />
        </linearGradient>
      </defs>
      {/* 상투 · 머리 · 목 · 어깨(도포) */}
      <ellipse cx="100" cy="40" rx="14" ry="11" fill={`url(#${id})`} />
      <ellipse cx="100" cy="78" rx="34" ry="40" fill={`url(#${id})`} />
      <path d="M86 112 L114 112 L118 132 L82 132 Z" fill={`url(#${id})`} />
      <path d="M20 240 C22 170 50 140 100 132 C150 140 178 170 180 240 Z" fill={`url(#${id})`} />
      <path d="M100 134 L78 240 M100 134 L122 240" stroke="rgba(0,0,0,.35)" stroke-width="3" fill="none" />
      <ellipse cx="100" cy="78" rx="34" ry="40" fill="none" stroke="rgba(255,240,210,.18)" stroke-width="1.5" />
      <text x="100" y="205" text-anchor="middle" font-size="42" font-weight="900" fill="rgba(0,0,0,.35)" font-family="serif">{mark}</text>
    </svg>
  );
}

export function CharacterBust({ characterId, className }: { characterId: string; className?: string }) {
  const character = CHARACTER_BY_ID[characterId];
  const image = artUrl(`char_${characterId}_bust.webp`);
  const color = character ? FACTIONS[character.faction].color : "#7a6e62";
  return (
    <div class={`bust ${className ?? ""}`}>
      {image ? <img src={image} alt="" /> : <Silhouette color={color} mark={character?.name.slice(0, 1) ?? ""} />}
    </div>
  );
}

/** 이름으로만 아는 인물(보스 · 지역 인물): 붉은/회색 실루엣 */
export function NamedBust({ name, hostile, className }: { name: string; hostile?: boolean; className?: string }) {
  return (
    <div class={`bust ${className ?? ""}`}>
      <Silhouette color={hostile ? "#8e3a31" : "#6d6457"} mark={name.slice(0, 1)} />
    </div>
  );
}
