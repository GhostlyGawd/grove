import { createHost } from "@swarm/host";
import { type RunningHost, runDaemon } from "@swarm/host/daemon";

/**
 * @swarm/cli — the `grove` command-line entrypoint (spec §2, P13). Verb parsing
 * is real from Phase 0; `grove host` starts the real headless daemon (Phase 2),
 * remote/daemon-detach behavior attaches in Phase 5.
 */

export const CLI_VERSION = "0.1.0";

export const CLI_COMMANDS = [
  "start",
  "stop",
  "status",
  "host",
  "projects",
  "workspaces",
  "auth",
] as const;
export type CliCommand = (typeof CLI_COMMANDS)[number];

export interface ParsedInvocation {
  readonly command: CliCommand;
  readonly args: readonly string[];
}

function isCliCommand(value: string): value is CliCommand {
  return (CLI_COMMANDS as readonly string[]).includes(value);
}

/** Parse `grove <command> [args]` into a typed invocation. */
export function parseArgv(argv: readonly string[]): ParsedInvocation {
  const first = argv[0] ?? "status";
  if (!isCliCommand(first)) {
    throw new Error(`Unknown grove command: ${first}`);
  }
  return { command: first, args: argv.slice(1) };
}

/** Render the line the `grove status` verb prints. */
export function statusLine(): string {
  const status = createHost().status();
  return `grove ${status.version} bound ${status.boundTo} online=${status.online}`;
}

/** Read `--port`/`--db` flags off the `grove host` args. */
function parseHostArgs(args: readonly string[]): { port?: number; dataDir?: string } {
  let port: number | undefined;
  let dataDir: string | undefined;
  for (let i = 0; i < args.length; i += 1) {
    const flag = args[i];
    const value = args[i + 1];
    if (flag === "--port" && value !== undefined) {
      const parsed = Number(value);
      if (Number.isInteger(parsed) && parsed >= 0) {
        port = parsed;
      }
      i += 1;
    } else if (flag === "--db" && value !== undefined) {
      dataDir = value;
      i += 1;
    }
  }
  return { port, dataDir };
}

/**
 * Start the real host daemon and report where it bound + its manifest. The
 * listening server keeps the process alive; the returned handle lets a caller
 * (or test) shut it down. Must run under Node (the engine drives node-pty,
 * ADR-0007a).
 */
export async function runHost(args: readonly string[] = []): Promise<RunningHost> {
  const { port, dataDir } = parseHostArgs(args);
  const host = await runDaemon({ port, dataDir });
  console.log(
    `grove host listening on ${host.endpoint} (ws ${host.wsUrl})\nmanifest: ${host.manifestPath}`,
  );
  return host;
}

// Run the dispatcher only when executed directly (never on import). The cast
// keeps this typecheck-clean without depending on a runtime-specific ImportMeta
// augmentation; the field is set by Bun and Node when a module is the entrypoint.
if ((import.meta as { main?: boolean }).main === true) {
  const { command, args } = parseArgv(process.argv.slice(2));
  if (command === "host") {
    await runHost(args);
  } else if (command === "status") {
    console.log(statusLine());
  } else {
    console.log(`grove: '${command}' is not wired yet (Phase 2 ships 'host' + 'status').`);
  }
}
