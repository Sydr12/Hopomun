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
          <div class="mist" style={{ background: `radial-gradient(70% 35% at 30% 62%, ${theme.mist}, transparent), radial-gradient(55% 28% at 78% 48%, ${theme.mist}, transparent)` }} />
          <svg viewBox="0 0 400 300" preserveAspectRatio="none" style={{ height: "70%" }}>
            <path d="M0 150 L40 110 L80 140 L130 80 L175 130 L220 95 L270 140 L320 70 L360 120 L400 100 L400 300 L0 300 Z" fill={theme.ridge} />
            <path d="M0 150 L40 110 L80 140 L130 80 L175 130 L220 95 L270 140 L320 70 L360 120 L400 100" fill="none" stroke={theme.line} stroke-width="1.2" opacity=".55" style={{ filter: `drop-shadow(0 0 4px ${theme.line})` }} vector-effect="non-scaling-stroke" />
          </svg>
          <svg viewBox="0 0 400 300" preserveAspectRatio="none" style={{ height: "55%" }}>
            <path d="M0 180 L50 150 L100 175 L150 130 L210 170 L260 140 L310 175 L360 150 L400 165 L400 300 L0 300 Z" fill="#030405" />
            <path d="M0 180 L50 150 L100 175 L150 130 L210 170 L260 140 L310 175 L360 150 L400 165" fill="none" stroke={theme.line} stroke-width="1.5" style={{ filter: `drop-shadow(0 0 6px ${theme.line})` }} vector-effect="non-scaling-stroke" />
          </svg>
          <div class="grid" />
        </>
      )}
    </div>
  );
}

/** 상반신 실루엣: 검은 몸체 + 세력 색 형광 외곽선 */
function Silhouette({ color, mark }: { color: string; mark: string }) {
  const id = `g${color.replace(/[^a-z0-9]/gi, "")}`;
  const glow = { filter: `drop-shadow(0 0 3px ${color})` };
  return (
    <svg viewBox="0 0 200 240" style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color={color} stop-opacity=".1" />
          <stop offset=".5" stop-color="#050608" stop-opacity=".97" />
          <stop offset="1" stop-color="#050608" stop-opacity="1" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`} stroke={color} stroke-width="1.4" stroke-linejoin="round" style={glow}>
        <ellipse cx="100" cy="40" rx="14" ry="11" />
        <path d="M20 240 C22 170 50 140 86 132 L88 112 A34 40 0 1 1 112 112 L114 132 C150 140 178 170 180 240 Z" />
      </g>
      <path d="M100 136 L80 240 M100 136 L120 240" stroke={color} stroke-opacity=".35" stroke-width="1.2" fill="none" />
      <text x="100" y="206" text-anchor="middle" font-size="40" font-weight="900" fill={color} fill-opacity=".22" font-family="serif">{mark}</text>
    </svg>
  );
}

export function CharacterBust({ characterId, className }: { characterId: string; className?: string }) {
  const character = CHARACTER_BY_ID[characterId];
  const image = artUrl(`char_${characterId}_bust.webp`);
  const color = character ? FACTIONS[character.faction].color : "#8a9a97";
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
      <Silhouette color={hostile ? "#ff4fd8" : "#8a9a97"} mark={name.slice(0, 1)} />
    </div>
  );
}
