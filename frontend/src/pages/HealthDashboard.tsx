import { Activity, AlertTriangle, CheckCircle, TrendingDown, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";

const SERVICES = [
  { name: "payments-svc", namespace: "payments", health: 92, trend: +2, platform: "kubernetes", env: "prod" },
  { name: "orders-svc", namespace: "orders", health: 75, trend: -3, platform: "kubernetes", env: "prod" },
  { name: "inventory-svc", namespace: "inventory", health: 45, trend: -12, platform: "kubernetes", env: "prod" },
  { name: "user-svc", namespace: "auth", health: 94, trend: +1, platform: "kubernetes", env: "prod" },
  { name: "notification-svc", namespace: "notifications", health: 68, trend: -5, platform: "kubernetes", env: "prod" },
  { name: "analytics-svc", namespace: "analytics", health: 82, trend: +4, platform: "kubernetes", env: "prod" },
  { name: "reporting-svc", namespace: "analytics", health: 77, trend: 0, platform: "kubernetes", env: "prod" },
  { name: "search-svc", namespace: "catalog", health: 89, trend: +2, platform: "kubernetes", env: "prod" },
  { name: "catalog-svc", namespace: "catalog", health: 91, trend: +1, platform: "kubernetes", env: "prod" },
  { name: "payments-db", namespace: "payments", health: 99, trend: 0, platform: "aws", env: "prod" },
  { name: "catalog-db", namespace: "catalog", health: 97, trend: 0, platform: "aws", env: "prod" },
  { name: "payments-api", namespace: "payments", health: 88, trend: -1, platform: "apiconnect", env: "prod" },
];

function healthColor(score: number) {
  return score >= 85 ? "var(--p-green)" : score >= 70 ? "var(--p-amber)" : "var(--p-red)";
}

function HealthBar({ score }: { score: number }) {
  const color = healthColor(score);
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--p-bg-border)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[11px] font-mono font-bold w-8 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

function ServiceRow({ svc }: { svc: typeof SERVICES[0] }) {
  const color = healthColor(svc.health);
  const trendColor = svc.trend > 0 ? "var(--p-green)" : svc.trend < 0 ? "var(--p-red)" : "var(--p-text-3)";
  const TrendIcon = svc.trend > 0 ? TrendingUp : svc.trend < 0 ? TrendingDown : Activity;
  return (
    <div className="flex items-center gap-4 px-4 py-3 transition-colors"
      style={{ borderBottom: "1px solid var(--p-border-subtle)" }}
      onMouseEnter={(e) => ((e).currentTarget.style.background = "var(--p-bg-elevated)")}
      onMouseLeave={(e) => ((e).currentTarget.style.background = "transparent")}>
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold  truncate" style={{ color: "var(--p-text-1)" }}>{svc.name}</span>
          <span className="text-[9px]" style={{ color: "var(--p-text-3)" }}>{svc.namespace}</span>
        </div>
        <span className="text-[9px]" style={{ color: "var(--p-text-3)" }}>{svc.platform} · {svc.env}</span>
      </div>
      <HealthBar score={svc.health} />
      <div className="flex items-center gap-0.5 w-12 justify-end flex-shrink-0" style={{ color: trendColor }}>
        <TrendIcon size={10} />
        <span className="text-[10px] font-mono">{svc.trend !== 0 ? `${svc.trend > 0 ? "+" : ""}${svc.trend}%` : "—"}</span>
      </div>
    </div>
  );
}

export default function HealthDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ["health-dashboard"],
    queryFn: () => apiClient.get("/api/v1/health/dashboard").then((r) => r.data),
    staleTime: 60_000,
  });

  const avgHealth = Math.round(SERVICES.reduce((a, s) => a + s.health, 0) / SERVICES.length);
  const critical = SERVICES.filter((s) => s.health < 60).length;
  const degraded = SERVICES.filter((s) => s.health >= 60 && s.health < 80).length;
  const healthy = SERVICES.filter((s) => s.health >= 80).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--p-text-1)", fontFamily: '"Syne", sans-serif' }}>Health Dashboard</h1>
          <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--p-text-3)" }}>Service health · composite scores · live</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono" style={{ color: "var(--p-text-3)" }}>synced 2 min ago</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Avg Health", value: `${avgHealth}%`, color: healthColor(avgHealth) },
          { label: "Healthy", value: healthy, color: "var(--p-green)", icon: CheckCircle },
          { label: "Degraded", value: degraded, color: "var(--p-amber)", icon: AlertTriangle },
          { label: "Critical", value: critical, color: "var(--p-red)", icon: AlertTriangle },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl flex flex-col gap-1"
            style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)" }}>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--p-text-3)" }}>{s.label}</span>
            <span className="text-2xl font-mono font-bold" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Services table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--p-border)" }}>
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: "var(--p-bg-card)", borderBottom: "1px solid var(--p-border)" }}>
          <div className="flex items-center gap-2">
            <Activity size={13} style={{ color: "var(--p-text-3)" }} />
            <span className="text-sm font-semibold " style={{ color: "var(--p-text-1)" }}>Services</span>
            <span className="text-xs font-mono" style={{ color: "var(--p-text-3)" }}>({SERVICES.length})</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>
            <span>Name</span>
            <span className="w-32">Health score</span>
            <span className="w-12 text-right">Trend</span>
          </div>
        </div>
        <div style={{ background: "var(--p-bg-main)" }}>
          {[...SERVICES].sort((a, b) => a.health - b.health).map((s) => (
            <ServiceRow key={s.name} svc={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
