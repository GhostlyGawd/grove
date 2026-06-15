import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";

/**
 * Renderer build. `base: "./"` keeps asset URLs relative so Electron can load the
 * built `index.html` over `file://` in production; in dev the Electron main loads
 * the Vite dev server URL instead. Output lands in `dist/renderer` so the package
 * `build` script can drop the bundled main/preload alongside it under `dist/`.
 */
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist/renderer",
    emptyOutDir: true,
  },
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
});
