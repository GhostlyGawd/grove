import { TERMINAL_LINES } from "./data";
import type { TermTone } from "./data";

const TONE_CLASS: Record<TermTone, string> = {
  fg: "text-fg",
  muted: "text-fg-muted",
  subtle: "text-fg-subtle",
  accent: "text-accent-fg",
  running: "text-running-fg",
  success: "text-success-fg",
  error: "text-error-fg",
  attention: "text-attention-fg",
};

/** Sample agent/test output, standing in for the live xterm canvas. */
export function TerminalBody() {
  return (
    <div className="flex flex-col">
      {TERMINAL_LINES.map((line, index) =>
        line.text === "❯" ? (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: static sample output
            key={index}
            className="text-accent-fg"
          >
            ❯
            <span className="grove-pulse ml-0.5 inline-block h-3.5 w-2 translate-y-0.5 bg-accent-fg" />
          </span>
        ) : (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: static sample output
            key={index}
            className={TONE_CLASS[line.tone]}
          >
            {line.text}
          </span>
        ),
      )}
    </div>
  );
}
