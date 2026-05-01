import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHead({ eyebrow, title, subtitle, actions }: Props) {
  return (
    <div className="flex items-end justify-between gap-6 px-6 pt-6 pb-4">
      <div className="min-w-0">
        {eyebrow && (
          <div
            className="text-[10px] font-mono uppercase tracking-[0.18em] mb-2"
            style={{ color: "var(--p-text-3)" }}
          >
            {eyebrow}
          </div>
        )}
        <h1
          className="text-[22px] font-semibold leading-tight tracking-tight"
          style={{ color: "var(--p-text-1)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-xs mt-1.5 font-mono"
            style={{ color: "var(--p-text-3)" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
