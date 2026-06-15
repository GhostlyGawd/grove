import { homedir } from "node:os";
import { join } from "node:path";
import { type AgentStatus, launchMockAgent } from "@swarm/agent-adapters";
import type { Project, Session, Workspace } from "@swarm/db";
import type { Store } from "@swarm/db/store";
import { WorktreeEngine } from "@swarm/git-worktree";
import type { PtySupervisor, ShellKind } from "@swarm/pty-supervisor";
import { toPosixPath } from "@swarm/shared";
import type { SessionId, WorkspaceId } from "@swarm/shared";
import type { EventLog } from "@swarm/sync";

/**
 * The host-side orchestration engine (P01 + P02 + P03). Given a project repo and
 * an agent preset it: cuts an isolated git worktree (branch-per-task) via
 * {@link WorktreeEngine}, launches the agent on a real PTY through the adapter
 * (Node, ADR-0007a), maps the adapter's status stream into {@link DomainEvent}s,
 * appends them to the durable {@link EventLog} (PGlite-backed), and keeps the
 * `workspaces`/`sessions` projections in step. Platform-touching, so it lives in
 * `apps/host` rather than the Node-free `core-engine`.
 *
 * The mock adapter is the only keyless agent and is gated behind an explicit
 * flag — it is never on a user happy path (RUBRIC §6.1). Real adapters
 * (Claude/Codex/Cursor/Gemini/generic) plug into the same status→event mapping.
 */
export interface OrchestratorDeps {
  readonly store: Store;
  readonly eventLog: EventLog;
  readonly supervisor: PtySupervisor;
  /** Base directory for worktrees created via the API (default `~/.grove/worktrees`). */
  readonly worktreesRoot?: string;
}

export interface CreateWorkspaceInput {
  readonly project: Project;
  readonly name: string;
  readonly branch: string;
  readonly baseBranch?: string;
  /** Base directory under which the per-task worktree directory is created. */
  readonly worktreesDir: string;
}

export interface PreparedWorkspace {
  readonly workspace: Workspace;
  /** OS-native worktree path (for PTY cwd). */
  readonly worktreePathOs: string;
  /** POSIX-normalized worktree path (as stored, spec §5). */
  readonly worktreePath: string;
}

export interface StartAgentOptions {
  readonly shell?: ShellKind;
  /** Length of the simulated working phase in ms (mock adapter). */
  readonly workMs?: number;
  /** File the agent writes into its worktree (defaults to the adapter default). */
  readonly fileName?: string;
  /** Explicit opt-in for the keyless mock adapter (tests/dev only). */
  readonly enableMock?: boolean;
}

export interface AgentRun {
  readonly workspace: Workspace;
  readonly session: Session;
  readonly worktreePath: string;
  readonly branch: string;
  /** Absolute (POSIX) path of the file the agent writes — for the diff viewer/tests. */
  readonly outputFile: string;
  /** Resolves once the agent reaches a terminal state and its events are persisted. */
  readonly done: Promise<{ readonly status: AgentStatus; readonly exitCode: number }>;
  /** Terminate the agent's PTY process tree. Idempotent. */
  stop(): Promise<void>;
}

interface RunContext {
  readonly workspace: Workspace;
  readonly session: Session;
  chain: Promise<void>;
  startedEmitted: boolean;
  finished: boolean;
  resolveDone: (value: { status: AgentStatus; exitCode: number }) => void;
}

function slugify(name: string): string {
  const slug = name.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : "workspace";
}

export class Orchestrator {
  private readonly store: Store;
  private readonly eventLog: EventLog;
  private readonly supervisor: PtySupervisor;
  private readonly engines = new Map<string, WorktreeEngine>();
  private readonly runs = new Map<SessionId, AgentRun>();
  readonly worktreesRoot: string;

  constructor(deps: OrchestratorDeps) {
    this.store = deps.store;
    this.eventLog = deps.eventLog;
    this.supervisor = deps.supervisor;
    this.worktreesRoot = deps.worktreesRoot ?? join(homedir(), ".grove", "worktrees");
  }

  private engineFor(repoRoot: string): WorktreeEngine {
    let engine = this.engines.get(repoRoot);
    if (engine === undefined) {
      engine = new WorktreeEngine(repoRoot);
      this.engines.set(repoRoot, engine);
    }
    return engine;
  }

  /**
   * Cut an isolated worktree + branch for a task and record the workspace.
   * Worktree creation is serialized by the caller (git locks `.git/worktrees`);
   * this is the P02 isolation primitive, not the parallel hot path.
   */
  async createWorkspace(input: CreateWorkspaceInput): Promise<PreparedWorkspace> {
    const repoRoot = input.project.localPath;
    if (!repoRoot) {
      throw new Error(`project ${input.project.id} has no local repo path to cut a worktree from`);
    }
    const baseBranch = input.baseBranch ?? input.project.defaultBranch ?? "main";
    const worktreePathOs = join(input.worktreesDir, slugify(input.name));

    const workspace = await this.store.createWorkspace({
      projectId: input.project.id,
      name: input.name,
      branch: input.branch,
      baseBranch,
      worktreePath: toPosixPath(worktreePathOs),
      status: "idle",
    });

    const created = await this.engineFor(repoRoot).create({
      workspaceId: workspace.id,
      branch: input.branch,
      baseBranch,
      path: worktreePathOs,
    });
    if (!created.ok) {
      await this.store.setWorkspaceStatus(workspace.id, "error");
      throw new Error(
        `worktree create failed for ${input.name} (${created.error.code}): ${created.error.message}`,
      );
    }

    await this.eventLog.append({
      type: "workspace.created",
      workspaceId: workspace.id,
      name: input.name,
    });

    return { workspace, worktreePathOs, worktreePath: created.value.path };
  }

  /**
   * Launch the agent in a prepared worktree on a real PTY and wire its status
   * stream to durable events. Returns immediately; `done` resolves when the agent
   * terminates. Launching many of these without awaiting `done` is exactly the
   * P01 parallel path — each runs in its own PTY + worktree.
   */
  startAgent(prepared: PreparedWorkspace, options: StartAgentOptions = {}): Promise<AgentRun> {
    return this.launch(prepared.workspace, prepared.worktreePathOs, options);
  }

  /** Convenience: prepare a worktree then start the agent in one call. */
  async spawnAgent(input: CreateWorkspaceInput & StartAgentOptions): Promise<AgentRun> {
    const prepared = await this.createWorkspace(input);
    return this.startAgent(prepared, input);
  }

  /** Start an agent in a workspace that already exists (the `agents.start` command). */
  async startAgentInWorkspace(
    workspaceId: WorkspaceId,
    options: StartAgentOptions = {},
  ): Promise<AgentRun> {
    const workspace = await this.store.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`unknown workspace: ${workspaceId}`);
    }
    const cwdOs =
      process.platform === "win32"
        ? workspace.worktreePath.replace(/\//g, "\\")
        : workspace.worktreePath;
    return this.launch(workspace, cwdOs, options);
  }

  /** Tree-kill a running agent's PTY by session id (the `agents.stop` command). */
  async stopAgent(sessionId: SessionId): Promise<void> {
    const run = this.runs.get(sessionId);
    if (run) {
      await run.stop();
    }
  }

  private async launch(
    workspace: Workspace,
    cwdOs: string,
    options: StartAgentOptions,
  ): Promise<AgentRun> {
    const session = await this.store.createSession({
      workspaceId: workspace.id,
      adapterId: "mock",
      mode: "terminal",
      status: "starting",
    });

    let resolveDone!: (value: { status: AgentStatus; exitCode: number }) => void;
    const done = new Promise<{ status: AgentStatus; exitCode: number }>((resolve) => {
      resolveDone = resolve;
    });

    const ctx: RunContext = {
      workspace,
      session,
      chain: Promise.resolve(),
      startedEmitted: false,
      finished: false,
      resolveDone,
    };

    // `launchMockAgent` fires onStatus("running") synchronously during launch,
    // so the context above is fully built before this call.
    const handle = launchMockAgent({
      supervisor: this.supervisor,
      workspaceId: workspace.id,
      cwd: cwdOs,
      shell: options.shell,
      enable: options.enableMock ?? true,
      workMs: options.workMs,
      fileName: options.fileName,
      onStatus: (status) => this.onStatus(ctx, status),
    });

    const run: AgentRun = {
      workspace,
      session,
      worktreePath: toPosixPath(cwdOs),
      branch: workspace.branch,
      outputFile: handle.outputFile,
      done,
      stop: () => handle.stop(),
    };
    this.runs.set(session.id, run);
    void done.finally(() => this.runs.delete(session.id));
    return run;
  }

  /** Map one adapter status into projection updates + durable domain events. */
  private onStatus(ctx: RunContext, status: AgentStatus): void {
    if (status === "running" && !ctx.startedEmitted) {
      ctx.startedEmitted = true;
      ctx.chain = ctx.chain
        .then(() =>
          this.eventLog.append({
            type: "session.started",
            sessionId: ctx.session.id,
            workspaceId: ctx.workspace.id,
          }),
        )
        .then(() => this.store.setWorkspaceStatus(ctx.workspace.id, "running"))
        .then(() =>
          this.eventLog.append({
            type: "workspace.status_changed",
            workspaceId: ctx.workspace.id,
            status: "running",
          }),
        )
        .then(() => undefined);
      return;
    }

    if (status === "needs_attention" && !ctx.finished) {
      ctx.chain = ctx.chain
        .then(() => this.store.setWorkspaceStatus(ctx.workspace.id, "needs_attention"))
        .then(() =>
          this.eventLog.append({
            type: "workspace.status_changed",
            workspaceId: ctx.workspace.id,
            status: "needs_attention",
          }),
        )
        .then(() => undefined);
      return;
    }

    if ((status === "done" || status === "error") && !ctx.finished) {
      ctx.finished = true;
      const exitCode = status === "done" ? 0 : 1;
      ctx.chain = ctx.chain
        .then(() => this.store.setWorkspaceStatus(ctx.workspace.id, status))
        .then(() =>
          this.eventLog.append({
            type: "workspace.status_changed",
            workspaceId: ctx.workspace.id,
            status,
          }),
        )
        .then(() => this.store.endSession(ctx.session.id, exitCode, status))
        .then(() =>
          this.eventLog.append({
            type: "session.exited",
            sessionId: ctx.session.id,
            exitCode,
          }),
        )
        .then(() => {
          ctx.resolveDone({ status, exitCode });
        });
    }
  }
}
