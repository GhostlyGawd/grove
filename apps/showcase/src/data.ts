import type { ChangeType, WorkspaceStatus } from "@swarm/db";
import type { DiffLine } from "@swarm/ui/react";

export interface SampleWorkspace {
  readonly id: string;
  readonly name: string;
  readonly branch: string;
  readonly status: WorkspaceStatus;
  readonly agent: string;
  readonly meta: string;
}

export const WORKSPACES: readonly SampleWorkspace[] = [
  {
    id: "w1",
    name: "fix-auth-flow",
    branch: "fix/auth-flow",
    status: "running",
    agent: "Claude Code",
    meta: "2m",
  },
  {
    id: "w2",
    name: "port-scanner",
    branch: "feat/ports",
    status: "needs_attention",
    agent: "Codex",
    meta: "just now",
  },
  {
    id: "w3",
    name: "diff-virtualize",
    branch: "perf/diff",
    status: "done",
    agent: "Cursor",
    meta: "12m",
  },
  {
    id: "w4",
    name: "ws-resume-token",
    branch: "feat/sync",
    status: "error",
    agent: "Gemini",
    meta: "5m",
  },
  {
    id: "w5",
    name: "docs-keyboard",
    branch: "docs/hotkeys",
    status: "idle",
    agent: "—",
    meta: "1h",
  },
];

export type TermTone =
  | "fg"
  | "muted"
  | "subtle"
  | "accent"
  | "running"
  | "success"
  | "error"
  | "attention";

export interface TermLine {
  readonly tone: TermTone;
  readonly text: string;
}

export const TERMINAL_LINES: readonly TermLine[] = [
  { tone: "subtle", text: "grove › fix-auth-flow · pwsh 7.4 · D:\\src\\app" },
  { tone: "muted", text: "$ bun test auth/" },
  { tone: "fg", text: "bun test v1.3.14" },
  { tone: "success", text: "  ✓ auth/login.test.ts        (8 tests, 142ms)" },
  { tone: "success", text: "  ✓ auth/session.test.ts      (5 tests,  61ms)" },
  { tone: "error", text: "  ✗ auth/refresh.test.ts      (1 failed)" },
  { tone: "subtle", text: "      expected 200 — received 401 (token expired)" },
  { tone: "fg", text: "  13 pass · 1 fail · 19 expect() calls" },
  { tone: "attention", text: "› agent paused — waiting on your input to continue" },
  { tone: "accent", text: "❯" },
];

export interface SampleDiff {
  readonly path: string;
  readonly changeType: ChangeType;
  readonly additions: number;
  readonly deletions: number;
  readonly lines: readonly DiffLine[];
}

export const SAMPLE_DIFF: SampleDiff = {
  path: "packages/git-worktree/src/base-branch.ts",
  changeType: "modified",
  additions: 4,
  deletions: 1,
  lines: [
    { type: "hunk", text: "@@ -11,7 +11,10 @@ export function resolveBaseBranch(repo: Repo) {" },
    { type: "context", oldNumber: 11, newNumber: 11, text: "  const head = repo.head();" },
    { type: "context", oldNumber: 12, newNumber: 12, text: "  if (!head) {" },
    { type: "remove", oldNumber: 13, text: '    return "main";' },
    {
      type: "add",
      newNumber: 13,
      text: "    // Prefer the repo's configured default before guessing.",
    },
    { type: "add", newNumber: 14, text: '    return repo.defaultBranch ?? "main";' },
    { type: "add", newNumber: 15, text: "  }" },
    { type: "context", oldNumber: 14, newNumber: 16, text: "  return head.shorthand();" },
    { type: "add", newNumber: 17, text: "}" },
    { type: "context", oldNumber: 15, newNumber: 18, text: "" },
  ],
};

export const SAMPLE_CONFIG = `{
  "setup": ["bun install", "bun run db:migrate"],
  "teardown": ["bun run db:reset"],
  "run": ["bun run dev"]
}`;
