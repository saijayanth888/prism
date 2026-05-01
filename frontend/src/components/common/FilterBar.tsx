import { Search } from "lucide-react";
import type { ReactNode, ChangeEvent } from "react";

interface Props {
  query: string;
  onQuery: (q: string) => void;
  placeholder?: string;
  filters?: ReactNode;
  trailing?: ReactNode;
}

export default function FilterBar({
  query,
  onQuery,
  placeholder = "Search…",
  filters,
  trailing,
}: Props) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-xl"
      style={{
        background: "var(--p-bg-card)",
        boxShadow: "var(--p-surface)",
      }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0 px-2">
        <Search size={13} style={{ color: "var(--p-text-3)" }} />
        <input
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none font-mono text-xs"
          style={{ color: "var(--p-text-1)" }}
        />
      </div>
      {filters && (
        <div className="flex items-center gap-2 flex-shrink-0 pl-3" style={{ borderLeft: "1px solid var(--p-border)" }}>
          {filters}
        </div>
      )}
      {trailing && <div className="flex items-center gap-2 flex-shrink-0">{trailing}</div>}
    </div>
  );
}

export function ChipSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {label && (
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--p-text-3)" }}>
          {label}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-[11px] rounded-md px-2 py-1 outline-none font-mono cursor-pointer"
        style={{
          background: "var(--p-bg-elevated)",
          color: "var(--p-text-2)",
          border: "1px solid var(--p-border)",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FilterChip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
      style={{
        background: active ? "var(--p-accent-subtle)" : "transparent",
        color: active ? "var(--p-accent)" : "var(--p-text-2)",
        border: `1px solid ${active ? "var(--p-accent-border)" : "var(--p-border)"}`,
        fontFamily: '"Geist", system-ui, sans-serif',
      }}
    >
      {children}
      {count !== undefined && (
        <span className="font-mono" style={{ color: active ? "var(--p-accent)" : "var(--p-text-3)" }}>
          {count}
        </span>
      )}
    </button>
  );
}
