import { Button, ErrorState, Input, Select, Sheet, Spinner, useToast } from "@swarm/ui/react";
import { Bot, FolderPlus, Rocket } from "lucide-react";
import { useState } from "react";
import type { AdapterDescriptor } from "./host-reads.ts";
import { useAdapters, useProjects } from "./host-reads.ts";
import type { HostState } from "./useHost.ts";

type Mode = "worktree" | "agent";

interface DispatchSheetProps {
  readonly host: HostState;
  readonly onClose: () => void;
  /**
   * A real dispatch landed. `kind` says what to surface live: a fresh worktree
   * (refetch the list) or a started agent (refetch sessions). The workspace id lets
   * the parent focus it.
   */
  readonly onDispatched: (result: { kind: Mode; workspaceId: string }) => void;
}

/** Segmented mode switch — start work two ways from the phone. */
function ModeTabs({
  mode,
  onChange,
}: { readonly mode: Mode; readonly onChange: (m: Mode) => void }) {
  const tab = (id: Mode, label: string, Icon: typeof FolderPlus) => (
    <button
      type="button"
      onClick={() => onChange(id)}
      aria-pressed={mode === id}
      className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        mode === id
          ? "border-accent-border bg-accent-bg text-accent-fg"
          : "border-line bg-surface text-fg-muted"
      }`}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </button>
  );
  return (
    <div className="flex items-center gap-2">
      {tab("worktree", "New worktree", FolderPlus)}
      {tab("agent", "Start agent", Bot)}
    </div>
  );
}

/**
 * Dispatch / quick-create (W4): a phone Sheet to start work on the REAL host. "New
 * worktree" cuts a git worktree (`workspaces.create`); "Start agent" launches a real
 * agent on an existing worktree (`agents.start`) with an adapter picked from
 * `agents.listAdapters` — `generic` requires an explicit command, exactly as the host
 * enforces (no mock on this path). On success the parent refetches so the new
 * worktree / session shows up live in the list, Agents, and the worktree detail.
 */
export function DispatchSheet({ host, onClose, onDispatched }: DispatchSheetProps) {
  const { toast } = useToast();
  const projects = useProjects(host.client);
  const adapters = useAdapters(host.client);

  const [mode, setMode] = useState<Mode>("agent");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New-worktree fields.
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");

  // Start-agent fields.
  const [agentWorkspaceId, setAgentWorkspaceId] = useState(host.workspaces[0]?.id ?? "");
  const [adapterId, setAdapterId] = useState<AdapterDescriptor["id"]>("claude-code");
  const [command, setCommand] = useState("");

  const isGeneric = adapterId === "generic";

  const submit = async (): Promise<void> => {
    const client = host.client;
    if (!client) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === "worktree") {
        const created = await client.workspaces.create.mutate({
          projectId,
          name: name.trim(),
          branch: branch.trim(),
        });
        toast({ tone: "success", title: "Worktree created", description: created.name });
        onDispatched({ kind: "worktree", workspaceId: created.id });
      } else {
        const session = await client.agents.start.mutate({
          workspaceId: agentWorkspaceId,
          adapterId,
          command: isGeneric ? command.trim() : undefined,
        });
        toast({ tone: "success", title: "Agent dispatched", description: session.adapterId });
        onDispatched({ kind: "agent", workspaceId: session.workspaceId });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const canSubmit =
    mode === "worktree"
      ? projectId !== "" && name.trim() !== "" && branch.trim() !== ""
      : agentWorkspaceId !== "" &&
        adapterId !== ("" as AdapterDescriptor["id"]) &&
        (!isGeneric || command.trim() !== "");

  const projectList = projects.state === "ready" ? projects.value : [];
  const adapterList = adapters.state === "ready" ? adapters.value : [];

  return (
    <Sheet
      open
      onOpenChange={(next) => {
        if (!next && !busy) {
          onClose();
        }
      }}
      title="Dispatch work"
      description="Start a worktree or an agent on your paired host."
      footer={
        <>
          <Button variant="ghost" className="min-h-11" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={<Rocket className="size-4" />}
            className="min-h-11"
            loading={busy}
            disabled={!canSubmit || busy}
            onClick={() => void submit()}
          >
            {mode === "worktree" ? "Create" : "Dispatch"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <ModeTabs mode={mode} onChange={setMode} />

        {mode === "worktree" ? (
          projects.state === "loading" ? (
            <div className="grid place-items-center py-6">
              <Spinner size="lg" label="Loading projects" />
            </div>
          ) : projects.state === "error" ? (
            <ErrorState title="Could not load projects" description={projects.error} />
          ) : (
            <div className="flex flex-col gap-4">
              <Select
                label="Project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                hint="The repo a new worktree is cut from."
              >
                <option value="" disabled>
                  Select a project…
                </option>
                {projectList.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Worktree name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                hint="A short name, e.g. feature-login."
              />
              <Input
                label="Branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                hint="The new branch this worktree checks out, e.g. feat/login."
              />
            </div>
          )
        ) : (
          <div className="flex flex-col gap-4">
            <Select
              label="Worktree"
              value={agentWorkspaceId}
              onChange={(e) => setAgentWorkspaceId(e.target.value)}
              hint="Where the agent runs."
            >
              <option value="" disabled>
                Select a worktree…
              </option>
              {host.workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name} · {ws.branch}
                </option>
              ))}
            </Select>
            <Select
              label="Adapter"
              value={adapterId}
              onChange={(e) => setAdapterId(e.target.value as AdapterDescriptor["id"])}
              disabled={adapters.state !== "ready"}
              hint="The CLI agent to launch."
            >
              {adapterList.map((adapter) => (
                <option key={adapter.id} value={adapter.id}>
                  {adapter.label}
                </option>
              ))}
            </Select>
            {isGeneric ? (
              <Input
                label="Command"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                hint="The generic adapter runs exactly this command, e.g. npm run agent."
              />
            ) : null}
          </div>
        )}

        {error ? <p className="text-2xs text-error-fg">{error}</p> : null}
      </div>
    </Sheet>
  );
}
