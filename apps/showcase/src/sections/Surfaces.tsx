import { CodeBlock, DiffView, IconButton, TerminalFrame } from "@swarm/ui/react";
import { FolderGit2 } from "lucide-react";
import { TerminalBody } from "../TerminalBody";
import { SAMPLE_CONFIG, SAMPLE_DIFF } from "../data";
import { Section, Subsection } from "../kit";

export function Surfaces() {
  return (
    <Section
      id="surfaces"
      kicker="03 — Surfaces"
      title="Terminal & Diff"
      description="The two surfaces the whole product is built around: a monospace terminal well and a gutter-aligned diff. ANSI/diff semantics map straight onto the color tokens."
    >
      <Subsection title="Terminal surface — tab strip, toolbar, status footer">
        <TerminalFrame
          tabs={[
            { id: "t1", label: "pwsh" },
            { id: "t2", label: "bun dev" },
            { id: "t3", label: "claude" },
          ]}
          activeTab="t1"
          shell="pwsh"
          cwd="D:\\src\\app"
          cols={128}
          rows={34}
          connected
          className="h-72"
        >
          <TerminalBody />
        </TerminalFrame>
      </Subsection>

      <Subsection title="Diff surface — change stats, hunks, add/remove tints">
        <DiffView
          path={SAMPLE_DIFF.path}
          changeType={SAMPLE_DIFF.changeType}
          additions={SAMPLE_DIFF.additions}
          deletions={SAMPLE_DIFF.deletions}
          lines={SAMPLE_DIFF.lines}
          actions={
            <IconButton aria-label="Open file in editor" size="sm">
              <FolderGit2 />
            </IconButton>
          }
        />
      </Subsection>

      <Subsection title="Code surface — .swarm/config.json">
        <CodeBlock title=".swarm/config.json" code={SAMPLE_CONFIG} />
      </Subsection>
    </Section>
  );
}
