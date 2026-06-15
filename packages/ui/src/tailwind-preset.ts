import type { Config } from "tailwindcss";

/**
 * Grove Tailwind preset.
 *
 * Every value resolves to a CSS custom property from `tokens.css`, so the same
 * compiled utilities serve both themes — switching is a `data-theme` swap, not a
 * rebuild. Consumers spread this into their own config's `presets` array and
 * point `content` at their sources plus `@swarm/ui`.
 *
 * Class names are always written as full literal strings in components so the
 * Tailwind content scanner can see them; never assembled dynamically.
 */
export const swarmPreset = {
  theme: {
    extend: {
      colors: {
        // surfaces
        inset: "var(--color-bg-inset)",
        base: "var(--color-bg-base)",
        surface: "var(--color-bg-surface)",
        raised: "var(--color-bg-raised)",
        overlay: "var(--color-bg-overlay)",
        // text
        fg: {
          DEFAULT: "var(--color-fg)",
          muted: "var(--color-fg-muted)",
          subtle: "var(--color-fg-subtle)",
          "on-accent": "var(--color-fg-on-accent)",
        },
        // structural lines
        line: {
          DEFAULT: "var(--color-line)",
          subtle: "var(--color-line-subtle)",
          strong: "var(--color-line-strong)",
        },
        // brand accent
        accent: {
          DEFAULT: "var(--color-accent)",
          fg: "var(--color-accent-fg)",
          bg: "var(--color-accent-bg)",
          border: "var(--color-accent-border)",
        },
        // signal / agent states
        idle: {
          DEFAULT: "var(--color-idle)",
          fg: "var(--color-idle-fg)",
          bg: "var(--color-idle-bg)",
          border: "var(--color-idle-border)",
        },
        running: {
          DEFAULT: "var(--color-running)",
          fg: "var(--color-running-fg)",
          bg: "var(--color-running-bg)",
          border: "var(--color-running-border)",
        },
        attention: {
          DEFAULT: "var(--color-attention)",
          fg: "var(--color-attention-fg)",
          bg: "var(--color-attention-bg)",
          border: "var(--color-attention-border)",
        },
        error: {
          DEFAULT: "var(--color-error)",
          fg: "var(--color-error-fg)",
          bg: "var(--color-error-bg)",
          border: "var(--color-error-border)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          fg: "var(--color-success-fg)",
          bg: "var(--color-success-bg)",
          border: "var(--color-success-border)",
        },
        info: {
          DEFAULT: "var(--color-info)",
          fg: "var(--color-info-fg)",
          bg: "var(--color-info-bg)",
          border: "var(--color-info-border)",
        },
        // diff surface
        "diff-add": {
          DEFAULT: "var(--color-diff-add-fg)",
          bg: "var(--color-diff-add-bg)",
          gutter: "var(--color-diff-add-gutter)",
        },
        "diff-remove": {
          DEFAULT: "var(--color-diff-remove-fg)",
          bg: "var(--color-diff-remove-bg)",
          gutter: "var(--color-diff-remove-gutter)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        "2xs": ["var(--text-2xs)", { lineHeight: "var(--leading-2xs)" }],
        xs: ["var(--text-xs)", { lineHeight: "var(--leading-xs)" }],
        sm: ["var(--text-sm)", { lineHeight: "var(--leading-sm)" }],
        base: ["var(--text-base)", { lineHeight: "var(--leading-base)" }],
        lg: ["var(--text-lg)", { lineHeight: "var(--leading-lg)" }],
        xl: ["var(--text-xl)", { lineHeight: "var(--leading-xl)" }],
        "2xl": ["var(--text-2xl)", { lineHeight: "var(--leading-2xl)" }],
        "3xl": ["var(--text-3xl)", { lineHeight: "var(--leading-3xl)" }],
      },
      borderRadius: {
        none: "0",
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        none: "none",
      },
      ringColor: {
        DEFAULT: "var(--color-accent)",
        accent: "var(--color-accent)",
        error: "var(--color-error)",
      },
      ringOffsetColor: {
        base: "var(--color-bg-base)",
        surface: "var(--color-bg-surface)",
        raised: "var(--color-bg-raised)",
        overlay: "var(--color-bg-overlay)",
        inset: "var(--color-bg-inset)",
      },
      transitionDuration: {
        instant: "var(--duration-instant)",
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
        exit: "var(--ease-exit)",
      },
    },
  },
} satisfies Partial<Config>;

export default swarmPreset;
