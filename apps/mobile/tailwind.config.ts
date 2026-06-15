import type { Config } from "tailwindcss";
import { swarmPreset } from "../../packages/ui/src/tailwind-preset";

/**
 * Mobile PWA Tailwind config. Every design decision lives in the Grove preset
 * (`@swarm/ui/tailwind-preset`); this file only points the scanner at the sources
 * that use the utilities. Theming is driven by `[data-theme]` + CSS variables.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [swarmPreset],
} satisfies Config;
