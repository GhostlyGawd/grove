import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";

/**
 * Mobile PWA renderer build. Served same-origin by the Grove host (ADR-0014), so
 * asset URLs are root-absolute (`base: "/"`, the default). `public/` carries the
 * web app manifest + icon set, which Vite copies verbatim into `dist/`.
 */
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
});
