import { ArrowRight, GitMerge, Plus, RefreshCw, Shield, Trash2, TrendingDown, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type EventType = "entity_added" | "entity_removed" | "health_change" | "relationship_added" | "cve_discovered" | "compliance_change" | "sync";

const EVENTS: {
  id: string; type: EventType; time: string; ago: string;
  entity: string; platform: string; description: string;
  severity?: "critical" | "high" | "medium" | "low";
  meta?: string;
}[] = [
  { id: "e1", type: "health_change", time: "2025-01-28 14:32", ago: "8 min ago", entity: "inventory-svc", platform: "kubernetes", description: "Health dropped from 67% → 45% · 3 pod restarts detected", severity: "high" },
  { id: "e2", type: "cve_discovered", time: "2025-01-28 14:15", ago: "25 min ago", entity: "notification-svc", platform: "sonarqube", description: "CVE-2024-0042 detected · RCE via deserialization · CVSS 7.5", severity: "high" },
  { id: "e3", type: "entity_added", time: "2025-01-28 13:55", ago: "52 min ago", entity: "payments-svc-v2", platform: "kubernetes", description: "New deployment detected · namespace: payments · 3 replicas", meta: "resolved → payments-svc by CPT" },
  { id: "e4", type: "relationship_added", time: "2025-01-28 13:40", ago: "1 hr ago", entity: "analytics-svc", platform: "github", description: "New DEPENDS_ON edge: analytics-svc → reporting-db", meta: "via pull request #1847" },
  { id: "e5", type: "compliance_change", time: "2025-01-28 13:10", ago: "1.5 hr ago", entity: "payments-api", platform: "sonarqube", description: "PCI-DSS CC6.7 status changed: pass → partial · 2 new gaps", severity: "medium" },
  { id: "e6", type: "sync", time: "2025-01-28 13:00", ago: "1.6 hr ago", entity: "all platforms", platform: "prism", description: "Full sync completed · 1,675 entities · 13 platforms · 0 conflicts", meta: "duration: 4.2s" },
  { id: "e7", type: "entity_removed", time: "2025-01-28 12:30", ago: "2 hr ago", entity: "legacy-auth-svc", platform: "argocd", description: "Deployment deleted · dependency graph updated · 0 orphans", severity: "low" },
  { id: "e8", type: "relationship_added", time: "2025-01-28 12:00", ago: "2.5 hr ago", entity: "orders-svc", platform: "kubernetes", description: "New GATEWAY_FOR edge: gateway-prod → orders-svc v2 route added" },
  { id: "e9", type: "health_change", time: "2025-01-28 11:45", ago: "2.75 hr ago", entity: "catalog-svc", platform: "datadog", description: "Health improved from 74% → 91% after deployment rollout", severity: "low" },
  { id: "e10", type: "cve_discovered", time: "2025-01-28 10:00", ago: "4.5 hr ago", entity: "inventory-svc", platform: "sonarqube", description: "CVE-2024-0001 confirmed · SQL injection · CVSS 9.8 · awaiting patch", severity: "critical" },
  { id: "e11", type: "entity_added", time: "2025-01-28 09:15", ago: "5.25 hr ago", entity: "reporting-db", platform: "aws", description: "RDS PostgreSQL instance provisioned via Terraform · payments namespace" },
  { id: "e12", type: "sync", time: "2025-01-28 08:00", ago: "6.5 hr ago", entity: "all platforms", platform: "prism", description: "Scheduled sync · 1,671 entities · 4 new entities added · CPT resolved 3 conflicts" },
];

const TYPE_CONFIG: Record<EventType, { icon: React.FC<any>; color: string; bg: string; label: string }> = {
  entity_added:      { icon: Plus,         color: "#22C55E", bg: "rgba(34,197,94,0.1)",    label: "Added" },
  entity_removed:    { icon: Trash2,       color: "#EF4444", bg: "rgba(239,68,68,0.1)",   label: "Removed" },
  health_change:     { icon: TrendingDown, color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  label: "Health" },
  relationship_added:{ icon: ArrowRight,   color: "#3B82F6", bg: "rgba(59,130,246,0.1)",  label: "Relation" },
  cve_discovered:    { icon: Shield,       color: "#EF4444", bg: "rgba(239,68,68,0.12)",  label: "CVE" },
  compliance_change: { icon: Shield,       color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  label: "Compliance" },
  sync:              { icon: RefreshCw,    color: "#22D3EE", bg: "rgba(34,211,238,0.08)", label: "Sync" },
};

const SEV_COLOR: Record<string, string> = {
  critical: "#EF4444", high: "#EA580C", medium: "#D97706", low: "#22C55E",
};

const PLATFORM_COLORS: Record<string, string> = {
  kubernetes: "#3B82F6", github: "var(--p-text-2)", datadog: "#8B5CF6", aws: "#F59E0B",
  sonarqube: "#EF4444", argocd: "#EC4899", prism: "#22D3EE",
};

const FILTERS: { key: EventType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "health_change", label: "Health" },
  { key: "cve_discovered", label: "CVEs" },
  { key: "compliance_change", label: "Compliance" },
  { key: "entity_added", label: "Added" },
  { key: "relationship_added", label: "Relations" },
  { key: "sync", label: "Sync" },
];

export default function Changes() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<EventType | "all">("all");

  const filtered = filter === "all" ? EVENTS : EVENTS.filter((e) => e.type === filter);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Change Impact</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">Live event log · topology diffs · CPT-resolved</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color: "#22D3EE" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Streaming
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Events (24h)", value: "47", color: "#22D3EE" },
          { label: "Critical", value: "2", color: "#EF4444" },
          { label: "Health Drops", value: "3", color: "#F59E0B" },
          { label: "New CVEs", value: "2", color: "#EA580C" },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-xl" style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)" }}>
            <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">{s.label}</div>
            <div className="text-xl font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            style={{
              background: filter === f.key ? "rgba(34,211,238,0.12)" : "#151D2E",
              color: filter === f.key ? "#22D3EE" : "var(--p-text-3)",
              border: `1px solid ${filter === f.key ? "rgba(34,211,238,0.3)" : "var(--p-bg-border)"}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Event feed */}
      <div className="space-y-0 rounded-xl overflow-hidden" style={{ border: "1px solid var(--p-border)" }}>
        {filtered.map((ev, i) => {
          const cfg = TYPE_CONFIG[ev.type];
          const Icon = cfg.icon;
          const pc = PLATFORM_COLORS[ev.platform] || "var(--p-text-3)";
          return (
            <div key={ev.id}
              className="flex gap-4 px-4 py-3.5 transition-colors cursor-pointer"
              style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--p-border)" : "none", background: "var(--p-bg-main)" }}
              onMouseEnter={(e) => ((e).currentTarget.style.background = "var(--p-bg-elevated)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--p-bg-main)")}
              onClick={() => ev.type !== "sync" && navigate(`/app/${ev.entity}`)}>

              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.color}20` }}>
                  <Icon size={13} style={{ color: cfg.color }} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-xs font-mono font-semibold " style={{ color: "var(--p-text-1)" }}>{ev.entity}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                    style={{ background: `${pc}15`, color: pc }}>{ev.platform}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                    style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  {ev.severity && (
                    <span className="text-[9px] font-mono font-semibold"
                      style={{ color: SEV_COLOR[ev.severity] }}>{ev.severity}</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 leading-snug">{ev.description}</div>
                {ev.meta && (
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: "#22D3EE", opacity: 0.7 }}>
                    <GitMerge size={8} className="inline mr-1" />{ev.meta}
                  </div>
                )}
              </div>

              {/* Time */}
              <div className="flex-shrink-0 text-right">
                <div className="text-[10px] text-slate-600 font-mono">{ev.ago}</div>
                <div className="text-[9px] text-slate-700 font-mono mt-0.5">{ev.time}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <span className="text-[10px] text-slate-700 font-mono">
          Showing {filtered.length} of 47 events · last 24 hours
        </span>
      </div>
    </div>
  );
}
