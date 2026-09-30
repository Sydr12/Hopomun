/**
 * 일러스트 · 배경 파일 목록 (public/art/ 아래)과 그림이 없을 때 쓰는 대체 색.
 * 파일명 규칙
 *   캐릭터 상반신: char_{캐릭터id}_bust.webp     예) char_dang_soha_bust.webp
 *   캐릭터 얼굴:   char_{캐릭터id}_face_default.webp
 *   지역 배경:     bg_{지역id}.webp               예) bg_heukpung.webp
 * 목록에 없는 그림은 실루엣 · 색 배경으로 대신 표시한다.
 */
export const ART_FILES = new Set<string>([]);

export function artUrl(file: string): string | undefined {
  return ART_FILES.has(file) ? `./art/${file}` : undefined;
}

/** 지역 배경 대체 색: 하늘 → 땅, 능선 색 */
export const REGION_THEME: Record<string, { sky: [string, string]; ridge: string; mist: string }> = {
  home: { sky: ["#5a4a3a", "#1d1712"], ridge: "#2e251d", mist: "rgba(224,189,111,.16)" },
  heukpung: { sky: ["#5d5344", "#1c1813"], ridge: "#352d23", mist: "rgba(190,160,120,.18)" },
  janggang: { sky: ["#3f6470", "#12202a"], ridge: "#234049", mist: "rgba(170,215,230,.2)" },
  nahan: { sky: ["#7a5530", "#20150c"], ridge: "#4a3219", mist: "rgba(245,190,110,.2)" },
  dokgok: { sky: ["#3f5a35", "#111a0e"], ridge: "#26381f", mist: "rgba(170,225,130,.18)" },
  nakan: { sky: ["#7a4a5e", "#1e1117"], ridge: "#4a2b38", mist: "rgba(250,185,210,.22)" },
  binggung: { sky: ["#5a7a96", "#131d27"], ridge: "#34495c", mist: "rgba(225,240,255,.26)" },
  dokchung: { sky: ["#2f5a44", "#0c1711"], ridge: "#1d3a2b", mist: "rgba(140,210,160,.2)" },
  geomchong: { sky: ["#50505c", "#141418"], ridge: "#2f2f38", mist: "rgba(215,215,235,.16)" },
  daesan: { sky: ["#6a3a3a", "#170c0c"], ridge: "#3e2020", mist: "rgba(230,110,100,.18)" },
  hyeolji: { sky: ["#7a2a2e", "#1a0809"], ridge: "#4a1519", mist: "rgba(240,80,80,.22)" },
};
