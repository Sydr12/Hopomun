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

/** 지역 배경 대체: 어두운 하늘 → 땅, 능선 형광 라인 색 */
export const REGION_THEME: Record<string, { sky: [string, string]; ridge: string; mist: string; line: string }> = {
  home: { sky: ["#07080b", "#10141a"], ridge: "#07090c", mist: "rgba(47,243,224,.10)", line: "#2ff3e0" },
  heukpung: { sky: ["#07080b", "#151510"], ridge: "#080806", mist: "rgba(255,159,67,.10)", line: "#ff9f43" },
  janggang: { sky: ["#06080b", "#0c1a20"], ridge: "#050b0e", mist: "rgba(127,232,255,.12)", line: "#7fe8ff" },
  nahan: { sky: ["#08070a", "#1a1208"], ridge: "#0a0704", mist: "rgba(255,216,74,.10)", line: "#ffd84a" },
  dokgok: { sky: ["#06080a", "#0f1a0c"], ridge: "#050a04", mist: "rgba(200,255,61,.10)", line: "#c8ff3d" },
  nakan: { sky: ["#08060a", "#1c0c16"], ridge: "#0b050a", mist: "rgba(255,79,216,.12)", line: "#ff4fd8" },
  binggung: { sky: ["#06080c", "#0e1a26"], ridge: "#050a10", mist: "rgba(180,235,255,.14)", line: "#9fe9ff" },
  dokchung: { sky: ["#05080a", "#08170f"], ridge: "#040a06", mist: "rgba(69,255,176,.10)", line: "#45ffb0" },
  geomchong: { sky: ["#07070a", "#12121a"], ridge: "#07070b", mist: "rgba(200,200,255,.08)", line: "#c9c9ff" },
  daesan: { sky: ["#08060a", "#1a0a0e"], ridge: "#0a0406", mist: "rgba(255,61,113,.10)", line: "#ff3d71" },
  hyeolji: { sky: ["#09050a", "#200609"], ridge: "#0c0304", mist: "rgba(255,40,70,.14)", line: "#ff2846" },
};
