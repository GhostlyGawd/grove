import { Badge, ThemeToggle } from "@swarm/ui/react";
import { Components } from "./sections/Components";
import { Console } from "./sections/Console";
import { Foundations } from "./sections/Foundations";
import { Surfaces } from "./sections/Surfaces";

function GroveMark({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden focusable="false">
      <title>Grove</title>
      <path
        d="M12 23V13M12 15L6 8.5M12 13.5L12 5M12 15L18 8.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="6" cy="8" r="1.8" fill="currentColor" />
      <circle cx="12" cy="4.5" r="1.8" fill="currentColor" />
      <circle cx="18" cy="8" r="1.8" fill="currentColor" />
    </svg>
  );
}

const NAV = [
  { href: "#foundations", label: "Foundations" },
  { href: "#components", label: "Primitives" },
  { href: "#surfaces", label: "Surfaces" },
  { href: "#console", label: "Console" },
];

export function App() {
  return (
    <div className="min-h-dvh bg-base text-fg">
      <header className="sticky top-0 z-40 border-b border-line bg-base">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2.5">
            <GroveMark className="size-6 text-accent-fg" />
            <span className="text-lg font-semibold tracking-tight text-fg">Grove</span>
            <Badge tone="neutral">Design System</Badge>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-2.5 py-1.5 text-sm text-fg-muted transition-colors duration-fast hover:bg-surface hover:text-fg"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24">
        <Hero />
        <Foundations />
        <Components />
        <Surfaces />
        <Console />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-8 text-2xs text-fg-subtle">
          <p className="font-mono">
            Grove · @swarm/ui · IBM Plex Sans + Mono (OFL) · Lucide (ISC) · all OSS
          </p>
          <p>Mission control for a swarm of coding agents — calm surface, swarming depth.</p>
        </div>
      </footer>
    </div>
  );
}

function Hero() {
  return (
    <section className="py-12">
      <div className="flex items-center gap-3">
        <GroveMark className="size-9 text-accent-fg" />
        <h1 className="text-3xl font-semibold tracking-tight text-fg">Grove</h1>
      </div>
      <p className="mt-4 max-w-2xl text-base text-fg-muted">
        A dense, dark-first operations console for orchestrating swarms of CLI coding agents across
        isolated git worktrees. Built like a cockpit, not a landing page: the chrome recedes so
        terminals, diffs, and agent state are the interface.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge tone="accent" dot>
          dark-first · light second
        </Badge>
        <Badge tone="success">WCAG AA enforced in CI</Badge>
        <Badge tone="info">IBM Plex Sans + Mono</Badge>
        <Badge tone="running" dot>
          real-time multi-agent
        </Badge>
        <Badge tone="neutral">keyboard-driven</Badge>
      </div>
    </section>
  );
}
