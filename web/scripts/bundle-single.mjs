/**
 * dist/ 빌드를 파일 하나짜리 페이지로 묶는다 (호스팅된 미리보기 페이지용).
 *   npx vite build && node scripts/bundle-single.mjs <출력 경로>
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const out = process.argv[2] ?? "dist/single.html";
const assets = readdirSync("dist/assets");
const css = readFileSync(`dist/assets/${assets.find((f) => f.endsWith(".css"))}`, "utf8");
const js = readFileSync(`dist/assets/${assets.find((f) => f.endsWith(".js"))}`, "utf8").replace(/<\/script/g, "<\\/script");
const html = `<title>강호육성기</title>
<meta name="theme-color" content="#14110f">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;700;900&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
<style>${css}</style>
<div id="app"></div>
<script type="module">${js}</script>
`;
writeFileSync(out, html);
console.log(`${out} ${(html.length / 1024).toFixed(1)}KB`);
