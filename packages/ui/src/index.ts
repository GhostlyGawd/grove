/**
 * @swarm/ui — the Grove design system.
 *
 * This entry is intentionally framework-agnostic: tokens, contrast utilities,
 * status semantics, and the class-name helper. It carries no React, so the
 * headless engine and other non-renderer packages can depend on the token
 * contract without pulling in a UI runtime.
 *
 * React components live behind the `@swarm/ui/react` subpath; the Tailwind
 * preset behind `@swarm/ui/tailwind-preset`; the CSS variable layer is
 * `@swarm/ui/tokens.css` + `@swarm/ui/styles.css`.
 *
 * See `docs/design-system.md` for the thesis, type scale, and color rationale.
 */

export const UI_VERSION = "0.2.0";

export * from "./cn";
export * from "./contrast";
export * from "./status";
export * from "./tokens";
