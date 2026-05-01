import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  trend?: number;
  trendDirection?: "up" | "down" | "neutral";
  unit?: string;
}

export default function MetricCard({ label, value, trend, trendDirection, unit }: Props) {
  const trendColor =
    trendDirection === "up"   ? "var(--p-green)" :
    trendDirection === "down" ? "var(--p-red)"   : "var(--p-text-3)";

  const TrendIcon =
    trendDirection === "up"   ? TrendingUp :
    trendDirection === "down" ? TrendingDown : Minus;

  return (
    <div
      className="rounded-xl px-4 py-3.5 flex flex-col gap-1"
      style={{
        background: "var(--p-bg-card)",
        boxShadow: "var(--p-surface)",
        fontFamily: '"Geist", system-ui, sans-serif',
      }}
    >
      <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--p-text-3)" }}>
        {label}
      </span>
      <div className="flex items-end gap-2">
        <span className="text-[22px] font-semibold leading-none font-mono" style={{ color: "var(--p-text-1)" }}>
          {value}
          {unit && <span className="text-sm ml-1" style={{ color: "var(--p-text-3)" }}>{unit}</span>}
        </span>
        {trend !== undefined && (
          <div className="flex items-center gap-0.5 text-xs pb-0.5" style={{ color: trendColor }}>
            <TrendIcon size={12} />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
