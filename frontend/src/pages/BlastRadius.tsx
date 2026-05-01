import { AlertTriangle, ChevronRight, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ENTITY_TYPE_COLORS } from "../types";
import type { EntityType } from "../types";

const BLAST_SCENARIOS: Record<string, {
  entity: string; type: EntityType; health: number;
  affected: { name: string; type: EntityType; impact: "direct" | "indirect"; reason: string }[];
  teams: string[]; summary: string;
}> = {
  "payments-api": {
    entity: "payments-api", type: "API", health: 88,
    affected: [
      { name: "orders-svc", type: "Service", impact: "direct", reason: "DEPENDS_ON payments-api" },
      { name: "notification-svc", type: "Service", impact: "direct", reason: "SUBSCRIBES_TO payments.events" },
      { name: "analytics-svc", type: "Service", impact: "direct", reason: "SUBSCRIBES_TO payments.events" },
      { name: "reporting-svc", type: "Service", impact: "indirect", reason: "DEPENDS_ON analytics-svc" },
      { name: "gateway-prod", type: "API", impact: "direct", reason: "GATEWAY_FOR payments-api" },
    ],
    teams: ["payments-team", "orders-team"],
    summary: "Failure of payments-api cascades to 5 services and impacts 2 teams. Gateway degraded.",
  },
  "payments-db": {
    entity: "payments-db", type: "Database", health: 99,
    affected: [
      { name: "payments-svc", type: "Service", impact: "direct", reason: "STORED_IN payments-db" },
      { name: "payments-api", type: "API", impact: "indirect", reason: "via payments-svc" },
      { name: "orders-svc", type: "Service", impact: "indirect", reason: "DEPENDS_ON payments-svc" },
      { name: "notification-svc", type: "Service", impact: "indirect", reason: "via payments.events" },
      { name: "analytics-svc", type: "Service", impact: "indirect", reason: "via payments.events" },
      { name: "gateway-prod", type: "API", impact: "indirect", reason: "via payments-api" },
    ],
    teams: ["payments-team", "orders-team"],
    summary: "Database failure causes full payments pipeline outage. 6 services affected across 2 teams.",
  },
  "inventory-svc": {
    entity: "inventory-svc", type: "Service", health: 45,
    affected: [
      { name: "orders-svc", type: "Service", impact: "direct", reason: "DEPENDS_ON inventory-svc" },
      { name: "catalog-svc", type: "Service", impact: "indirect", reason: "via orders-svc" },
    ],
    teams: ["orders-team"],
    summary: "Inventory service (currently degraded at 45% health) affects 2 downstream services.",
  },
};

const DEFAULT_ENTITY = "payments-api";

const IMPACT_STYLE = {
  direct: { color: "#EF4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", label: "Direct" },
  indirect: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", label: "Indirect" },
};

export default function BlastRadius() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initEntity = searchParams.get("entity") || DEFAULT_ENTITY;
  const [selected, setSelected] = useState(initEntity);

  const scenario = BLAST_SCENARIOS[selected] || BLAST_SCENARIOS[DEFAULT_ENTITY];
  const entityColor = ENTITY_TYPE_COLORS[scenario.type] || "var(--p-text-3)";
  const direct = scenario.affected.filter((a) => a.impact === "direct").length;
  const indirect = scenario.affected.filter((a) => a.impact === "indirect").length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Blast Radius</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">BFS traversal · impact analysis · graph-grounded</p>
        </div>
      </div>

      {/* Entity selector */}
      <div className="flex gap-2 flex-wrap">
        {Object.keys(BLAST_SCENARIOS).map((id) => {
          const s = BLAST_SCENARIOS[id];
          const c = ENTITY_TYPE_COLORS[s.type] || "var(--p-text-3)";
          return (
            <button key={id} onClick={() => setSelected(id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: selected === id ? c + "20" : "#151D2E",
                color: selected === id ? c : "var(--p-text-3)",
                border: `1px solid ${selected === id ? c + "40" : "var(--p-bg-border)"}`,
              }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
              {id}
            </button>
          );
        })}
      </div>

      {/* Summary strip */}
      <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
        <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-semibold  mb-1" style={{ color: "var(--p-text-1)" }}>{scenario.summary}</div>
          <div className="flex gap-4 text-[11px] font-mono">
            <span style={{ color: "#EF4444" }}>{direct} direct</span>
            <span style={{ color: "#F59E0B" }}>{indirect} indirect</span>
            <span className="text-slate-600">{scenario.teams.length} teams</span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Origin node */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-slate-600 mb-3 font-semibold">Origin</div>
          <div className="p-4 rounded-xl flex items-center gap-3"
            style={{ background: "var(--p-bg-card)", border: `1px solid ${entityColor}40` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white"
              style={{ background: entityColor }}>
              {scenario.type[0]}
            </div>
            <div>
              <div className="text-sm font-mono font-semibold text-white">{scenario.entity}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{ background: entityColor + "20", color: entityColor }}>{scenario.type}</span>
                <span className="text-[11px] font-mono"
                  style={{ color: scenario.health >= 80 ? "#22C55E" : scenario.health >= 60 ? "#F59E0B" : "#EF4444" }}>
                  {scenario.health}% health
                </span>
              </div>
            </div>
            <Zap size={18} className="ml-auto text-red-400" />
          </div>
        </div>

        {/* Affected teams */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-slate-600 mb-3 font-semibold">Teams Impacted</div>
          <div className="space-y-2">
            {scenario.teams.map((t) => (
              <div key={t} className="p-3 rounded-xl flex items-center gap-2"
                style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)" }}>
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-mono text-slate-300">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Affected services */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.15em] text-slate-600 mb-3 font-semibold">
          Cascade ({scenario.affected.length} services)
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--p-border)" }}>
          {scenario.affected.map((a, i) => {
            const impStyle = IMPACT_STYLE[a.impact];
            const aColor = ENTITY_TYPE_COLORS[a.type] || "var(--p-text-3)";
            return (
              <div key={a.name} className="flex items-center gap-3 px-4 py-3 transition-colors"
                style={{ borderBottom: i < scenario.affected.length - 1 ? "1px solid var(--p-border)" : "none", background: "var(--p-bg-main)" }}
                onMouseEnter={(e) => ((e).currentTarget.style.background = "var(--p-bg-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--p-bg-main)")}>
                <ChevronRight size={12} className="text-slate-700 flex-shrink-0" />
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: aColor }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold " style={{ color: "var(--p-text-1)" }}>{a.name}</span>
                    <span className="text-[9px] text-slate-600">{a.type}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{a.reason}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                  style={{ background: impStyle.bg, color: impStyle.color, border: `1px solid ${impStyle.border}` }}>
                  {impStyle.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center pt-2">
        <button onClick={() => navigate("/topology")}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
          View in Topology Graph →
        </button>
      </div>
    </div>
  );
}
