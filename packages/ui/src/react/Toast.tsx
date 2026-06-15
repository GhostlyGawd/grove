import { AlertTriangle, Bell, CheckCircle2, Info, X, XOctagon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../cn";

export type ToastTone = "neutral" | "success" | "error" | "attention" | "info";

export interface ToastOptions {
  readonly tone?: ToastTone;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** Auto-dismiss after N ms (default 5000). */
  readonly duration?: number;
}

interface ToastRecord extends ToastOptions {
  readonly id: string;
}

interface ToastContextValue {
  readonly toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastTone, LucideIcon> = {
  neutral: Bell,
  success: CheckCircle2,
  error: XOctagon,
  attention: AlertTriangle,
  info: Info,
};

const ICON_TONE: Record<ToastTone, string> = {
  neutral: "text-fg-muted",
  success: "text-success-fg",
  error: "text-error-fg",
  attention: "text-attention-fg",
  info: "text-info-fg",
};

export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly ToastRecord[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    counter.current += 1;
    const id = `toast-${counter.current}`;
    setToasts((current) => [...current, { ...options, id }]);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <section
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
      >
        {toasts.map((item) => (
          <ToastItem key={item.id} record={item} onDismiss={remove} />
        ))}
      </section>
    </ToastContext.Provider>
  );
}

function ToastItem({
  record,
  onDismiss,
}: {
  readonly record: ToastRecord;
  readonly onDismiss: (id: string) => void;
}) {
  const tone = record.tone ?? "neutral";
  const Icon = ICONS[tone];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(record.id), record.duration ?? 5000);
    return () => clearTimeout(timer);
  }, [record.id, record.duration, onDismiss]);

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className="grove-anim-toast pointer-events-auto flex items-start gap-2.5 rounded-md border border-line-strong bg-overlay p-3 shadow-md"
    >
      <Icon aria-hidden className={cn("mt-px size-4 shrink-0", ICON_TONE[tone])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">{record.title}</p>
        {record.description ? (
          <p className="mt-0.5 text-xs text-fg-muted">{record.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(record.id)}
        className="-mr-1 -mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-fg-subtle transition-colors duration-fast hover:bg-raised hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-overlay"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

/** Access the toast dispatcher. Must be used within a ToastProvider. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}
