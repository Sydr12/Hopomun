import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [preact()],
  // GitHub Pages 등 하위 경로 배포를 위해 상대 경로 사용
  base: "./",
  test: { include: ["tests/**/*.test.ts"] },
});
