import type { ReactNode } from "react";

interface Props {
  title?: string;
  eyebrow?: string;
  count?: number | string;
  actions?: ReactNode;
  children: ReactNode;
  padded?: boolean;
  noBorder?: boolean;
}

export default function Section({
  title,
  eyebrow,
  count,
  actions,
  children,
  padded = false,
  noBorder = false,
}: Props) {
  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        background: "var(--p-bg-card)",
        boxShadow: noBorder ? "none" : "var(--p-surface)",
      }}
    >
      {(title || eyebrow || actions) && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--p-border-subtle)" }}
        >
          <div className="flex items-baseline gap-2 min-w-0">
            {eyebrow && (
              <span
                className="text-[10px] font-mono uppercase tracking-[0.15em]"
                style={{ color: "var(--p-text-3)" }}
              >
                {eyebrow}
              </span>
            )}
            {title && (
              <span className="text-sm font-semibold" style={{ color: "var(--p-text-1)" }}>
                {title}
              </span>
            )}
            {count !== undefined && (
              <span className="text-[11px] font-mono" style={{ color: "var(--p-text-3)" }}>
                {count}
              </span>
            )}
          </div>
          {actions && <div className="flex items-center gap-1.5 flex-shrink-0">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-4" : ""}>{children}</div>
    </div>
  );
}

export function StatusDot({
  status,
  size = 7,
  pulse = false,
}: {
  status: "ok" | "warn" | "crit" | "idle" | "info";
  size?: number;
  pulse?: boolean;
}) {
  const color =
    status === "ok"   ? "var(--p-green)"  :
    status === "warn" ? "var(--p-amber)"  :
    status === "crit" ? "var(--p-red)"    :
    status === "info" ? "var(--p-accent)" :
    "var(--p-text-3)";
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: color,
        animation: pulse ? "pulse 2s infinite" : undefined,
      }}
    />
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      className="text-[10px] font-mono uppercase tracking-[0.15em] mb-2.5"
      style={{ color: "var(--p-text-3)" }}
    >
      {children}
    </div>
  );
}

export function Mono({ children, className = "", style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`font-mono ${className}`} style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {children}
    </span>
  );
}
