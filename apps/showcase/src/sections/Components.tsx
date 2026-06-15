import { WORKSPACE_STATUSES } from "@swarm/db";
import {
  AgentStatusDot,
  Badge,
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  ListRow,
  Select,
  Sheet,
  Skeleton,
  Spinner,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  Tooltip,
  useToast,
} from "@swarm/ui/react";
import { FolderGit2, GitBranch, Inbox, Play, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { WORKSPACES } from "../data";
import { Demo, Section, Subsection } from "../kit";

export function Components() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState("w1");

  return (
    <Section
      id="components"
      kicker="02 — Library"
      title="Primitives"
      description="Hand-built on the platform (native <dialog>, styled native <select>), no component-library defaults. Every control is keyboard-operable with a visible focus ring."
    >
      <Subsection title="Button — primary · secondary · ghost · danger">
        <Demo>
          <Button variant="primary" icon={<Play />}>
            Run agent
          </Button>
          <Button variant="secondary" icon={<GitBranch />}>
            New workspace
          </Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger" icon={<Trash2 />}>
            Delete
          </Button>
          <Button variant="primary" loading>
            Starting
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <Button variant="secondary" size="sm">
            Small
          </Button>
        </Demo>
      </Subsection>

      <Subsection title="IconButton — labelled, square">
        <Demo>
          <Tooltip label="New terminal (Ctrl+Shift+T)">
            <IconButton aria-label="New terminal">
              <Plus />
            </IconButton>
          </Tooltip>
          <IconButton aria-label="Find" variant="secondary">
            <Search />
          </IconButton>
          <IconButton aria-label="Open in editor" variant="ghost">
            <FolderGit2 />
          </IconButton>
          <IconButton aria-label="Delete" variant="danger">
            <Trash2 />
          </IconButton>
        </Demo>
      </Subsection>

      <Subsection title="Input & Select — labelled, with hint and error states">
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <Input
            label="Workspace name"
            defaultValue="fix-auth-flow"
            hint="Lowercase, hyphenated."
          />
          <Input label="Branch" defaultValue="fix/auth-flow" leadingIcon={<GitBranch />} />
          <Input
            label="Base branch"
            defaultValue="man"
            error="Unknown ref — did you mean ‘main’?"
          />
          <Select label="Agent preset" defaultValue="claude">
            <option value="claude">Claude Code</option>
            <option value="codex">OpenAI Codex CLI</option>
            <option value="cursor">Cursor Agent</option>
            <option value="generic">Any CLI command</option>
          </Select>
        </div>
      </Subsection>

      <Subsection title="Badge, StatusBadge & AgentStatusDot — state, triple-encoded">
        <Demo className="!flex-col !items-start gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">v0.2.0</Badge>
            <Badge tone="accent" dot>
              live
            </Badge>
            <Badge tone="running" dot>
              streaming
            </Badge>
            <Badge tone="info">tRPC</Badge>
            <Badge tone="success">+128</Badge>
            <Badge tone="error">-34</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {WORKSPACE_STATUSES.map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {WORKSPACE_STATUSES.map((status) => (
              <span key={status} className="flex items-center gap-1.5 text-xs text-fg-muted">
                <AgentStatusDot status={status} />
                {status}
              </span>
            ))}
          </div>
        </Demo>
      </Subsection>

      <Subsection title="Tabs — roving tabindex, arrow-key navigation">
        <div className="rounded-lg border border-line bg-surface p-4">
          <Tabs
            items={[
              {
                value: "changes",
                label: "Changes",
                icon: <GitBranch />,
                content: <TabBody text="12 files changed across this worktree." />,
              },
              {
                value: "terminal",
                label: "Terminal",
                icon: <Play />,
                content: <TabBody text="Two live PTY sessions on this workspace." />,
              },
              {
                value: "ports",
                label: "Ports",
                content: <TabBody text="No forwarded ports detected yet." />,
              },
            ]}
          />
        </div>
      </Subsection>

      <Subsection title="Overlays — native <dialog> (focus-trapped) + toasts">
        <Demo>
          <Button variant="secondary" onClick={() => setDialogOpen(true)}>
            Open dialog
          </Button>
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>
            Open sheet
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast({
                tone: "success",
                title: "Workspace created",
                description: "fix-auth-flow is ready.",
              })
            }
          >
            Toast: success
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast({
                tone: "error",
                title: "Run failed",
                description: "auth/refresh.test.ts — exit 1.",
              })
            }
          >
            Toast: error
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast({
                tone: "attention",
                title: "Needs attention",
                description: "Agent is waiting on input.",
              })
            }
          >
            Toast: attention
          </Button>
        </Demo>

        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Delete workspace?"
          description="This removes the git worktree and its untracked files."
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={<Trash2 />}
                onClick={() => {
                  setDialogOpen(false);
                  toast({ tone: "neutral", title: "Workspace deleted" });
                }}
              >
                Delete worktree
              </Button>
            </>
          }
        >
          <p>
            The branch <code className="text-fg">fix/auth-flow</code> will be kept. Any uncommitted
            changes in the worktree are lost.
          </p>
        </Dialog>

        <Sheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="Workspace settings"
          description="fix-auth-flow"
        >
          <div className="flex flex-col gap-4">
            <Input label="Display name" defaultValue="fix-auth-flow" />
            <Select label="Default shell" defaultValue="pwsh">
              <option value="pwsh">PowerShell 7</option>
              <option value="cmd">cmd.exe</option>
              <option value="bash">Git Bash</option>
              <option value="wsl">WSL</option>
            </Select>
          </div>
        </Sheet>
      </Subsection>

      <Subsection title="Table & ListRow — the dense data surfaces">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Workspace</TableHeaderCell>
                  <TableHeaderCell>Agent</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Active</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {WORKSPACES.map((ws) => (
                  <TableRow key={ws.id}>
                    <TableCell className="font-medium">{ws.name}</TableCell>
                    <TableCell className="text-fg-muted">{ws.agent}</TableCell>
                    <TableCell>
                      <StatusBadge status={ws.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-fg-subtle">
                      {ws.meta}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-0.5 rounded-lg border border-line bg-surface p-1.5">
            {WORKSPACES.map((ws) => (
              <ListRow
                key={ws.id}
                selected={selected === ws.id}
                onSelect={() => setSelected(ws.id)}
                leading={<AgentStatusDot status={ws.status} />}
                trailing={<span className="font-mono text-2xs text-fg-subtle">{ws.meta}</span>}
              >
                {ws.name}
              </ListRow>
            ))}
          </div>
        </div>
      </Subsection>

      <Subsection title="Loading — Spinner & Skeleton">
        <Demo>
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-3 w-28" />
          </div>
        </Demo>
      </Subsection>

      <Subsection title="Empty & error states — never a blank panel">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface">
            <EmptyState
              icon={<Inbox />}
              title="No workspaces yet"
              description="Create an isolated worktree and point an agent at it."
              action={
                <Button variant="primary" icon={<Plus />}>
                  New workspace
                </Button>
              }
              hint="Ctrl+Shift+N"
            />
          </div>
          <div className="rounded-lg border border-line bg-surface">
            <ErrorState
              title="Host unreachable"
              description="The Grove engine on 127.0.0.1:7420 didn't respond."
              action={
                <Button variant="secondary" icon={<RefreshCw />}>
                  Retry connection
                </Button>
              }
              detail="ECONNREFUSED 127.0.0.1:7420"
            />
          </div>
        </div>
      </Subsection>
    </Section>
  );
}

function TabBody({ text }: { readonly text: string }) {
  return <p className="text-sm text-fg-muted">{text}</p>;
}
