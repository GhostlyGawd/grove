import type { ReactNode } from "react";

export interface SectionProps {
  readonly id: string;
  readonly title: string;
  readonly kicker: string;
  readonly description?: ReactNode;
  readonly children: ReactNode;
}

export function Section({ id, title, kicker, description, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-16 border-t border-line py-10">
      <div className="mb-6">
        <p className="mb-1 font-mono text-2xs uppercase tracking-widest text-accent-fg">{kicker}</p>
        <h2 className="text-xl font-semibold text-fg">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm text-fg-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Subsection({
  title,
  children,
}: { readonly title: string; readonly children: ReactNode }) {
  return (
    <div className="mb-8 last:mb-0">
      <h3 className="mb-3 text-2xs font-medium uppercase tracking-widest text-fg-subtle">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function Demo({
  children,
  className,
}: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-4 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function Swatch({
  name,
  value,
  textClass,
}: {
  readonly name: string;
  readonly value: string;
  readonly textClass?: string;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface">
      <div className="h-12" style={{ backgroundColor: value }} />
      <div className="border-t border-line px-2 py-1.5">
        <p className={`text-2xs font-medium ${textClass ?? "text-fg"}`}>{name}</p>
        <p className="font-mono text-2xs tabular-nums text-fg-subtle">{value}</p>
      </div>
    </div>
  );
}
