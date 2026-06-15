/** The Grove brand mark — one trunk forking into three node-tipped shoots
 *  (docs/brand/assets/grove-mark.svg), inlined so it inherits `currentColor`. */
export function GroveMark({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden focusable="false">
      <title>Grove</title>
      <g stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 30 V 17" />
        <path d="M16 19 L 8.5 11" />
        <path d="M16 17 L 16 7" />
        <path d="M16 19 L 23.5 11" />
      </g>
      <g fill="currentColor">
        <circle cx="8.5" cy="9.6" r="2.3" />
        <circle cx="16" cy="5.6" r="2.3" />
        <circle cx="23.5" cy="9.6" r="2.3" />
      </g>
    </svg>
  );
}
