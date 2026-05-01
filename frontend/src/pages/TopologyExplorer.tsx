import { Minus, Plus, RefreshCcw, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import PageHead from "../components/common/PageHead";
import { Eyebrow, Mono, StatusDot } from "../components/common/Section";
import TopologyGraph from "../components/graph/TopologyGraph";
import { useGraphStore } from "../stores/graph";
import { useChatStore } from "../stores/chat";
import { ENTITY_TYPE_COLORS } from "../types";
import type { EntityType } from "../types";

/* ──────────────────────────────────────────────────────────────────
   Reference design: 3-column dark command center.
   • Left rail (240px) — search + entity types + status + app
   • Center        — graph w/ zoom toolbar + LIVE badge + legend
   • Right rail (340px) — node inspector w/ properties + deps + actions
   ────────────────────────────────────────────────────────────────── */

interface TypeRow {
  key: EntityType | string;
  label: string;
  count: number;
  color: string;
}

interface StatusRow {
  key: "ok" | "warn" | "crit" | "unresolved";
  label: string;
  count: number;
  dot: "ok" | "warn" | "crit" | "info";
}

interface AppRow {
  key: string;
  label: string;
  count: number;
}

const FALLBACK_TYPE_ROWS: TypeRow[] = [
  { key: "Service",    label: "Services",  count: 218,  color: ENTITY_TYPE_COLORS.Service },
  { key: "API",        label: "APIs",      count: 84,   color: ENTITY_TYPE_COLORS.API },
  { key: "Database",   label: "Databases", count: 64,   color: ENTITY_TYPE_COLORS.Database },
  { key: "Topic",      label: "Queues",    count: 32,   color: ENTITY_TYPE_COLORS.Topic },
  { key: "Container",  label: "Caches",    count: 18,   color: ENTITY_TYPE_COLORS.Container },
  { key: "Pipeline",   label: "Monitors",  count: 156,  color: ENTITY_TYPE_COLORS.Pipeline },
  { key: "Repository", label: "Repos",     count: 142,  color: ENTITY_TYPE_COLORS.Repository },
  { key: "Secret",     label: "Secrets",   count: 92,   color: ENTITY_TYPE_COLORS.Secret },
];

const STATUS_ROWS: StatusRow[] = [
  { key: "ok",         label: "Healthy",     count: 1632, dot: "ok"   },
  { key: "warn",       label: "Degraded",    count: 7,    dot: "warn" },
  { key: "crit",       label: "Critical",    count: 3,    dot: "crit" },
  { key: "unresolved", label: "Unresolved",  count: 33,   dot: "info" },
];

const APP_ROWS: AppRow[] = [
  { key: "orders",    label: "Orders",    count: 42 },
  { key: "payments",  label: "Payments",  count: 38 },
  { key: "analytics", label: "Analytics", count: 28 },
  { key: "identity",  label: "Identity",  count: 19 },
];

/* ──────────────────────────────────────────────────────────────────
   Reusable bits
   ────────────────────────────────────────────────────────────────── */

function RailCheckRow({
  active, onToggle, dotColor, label, count,
}: {
  active: boolean;
  onToggle: () => void;
  dotColor?: string;
  label: string;
  count: number | string;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-1.5 py-1 rounded text-left transition-colors"
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--p-bg-elevated)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
    >
      <span
        aria-hidden
        className="inline-flex items-center justify-center rounded-[3px] flex-shrink-0"
        style={{
          width: 12, height: 12,
          background: active ? "var(--p-accent)" : "transparent",
          border: `1px solid ${active ? "var(--p-accent)" : "var(--p-border-strong)"}`,
        }}
      >
        {active && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4 L3.3 5.8 L6.5 2" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {dotColor && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
      )}
      <span className="text-[12px] flex-1 truncate" style={{ color: "var(--p-text-1)" }}>{label}</span>
      <Mono className="text-[10px]" style={{ color: "var(--p-text-3)" }}>
        {typeof count === "number" ? count.toLocaleString() : count}
      </Mono>
    </button>
  );
}

function RailHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10px] font-mono uppercase tracking-[0.18em] px-1.5 mb-1.5 mt-3"
      style={{ color: "var(--p-text-3)" }}
    >
      {children}
    </div>
  );
}

function ToolbarButton({
  onClick, children, ariaLabel,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
      style={{
        background: "var(--p-bg-elevated)",
        color: "var(--p-text-2)",
        border: "1px solid var(--p-border)",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--p-text-1)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--p-text-2)")}
    >
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Page
   ────────────────────────────────────────────────────────────────── */

export default function TopologyExplorer() {
  const navigate = useNavigate();
  const { selectedNode, graphData } = useGraphStore();
  const toggleChat = useChatStore((s) => s.toggleChat);
  const isOpen = useChatStore((s) => s.isOpen);
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    new Set(FALLBACK_TYPE_ROWS.map((r) => String(r.key)))
  );
  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(new Set(["ok", "warn", "crit"]));
  const [activeApps, setActiveApps] = useState<Set<string>>(new Set(["orders"]));
  const [zoom, setZoom] = useState(100);

  // Keep the live entity counts query alive (graceful fallback to demo numbers)
  const { data: metrics } = useQuery({
    queryKey: ["health-dashboard"],
    queryFn: () => apiClient.get("/api/v1/health/dashboard").then((r) => r.data),
    staleTime: 60_000,
  });

  const typeRows = useMemo<TypeRow[]>(() => {
    if (!graphData.nodes.length) return FALLBACK_TYPE_ROWS;
    const counts: Record<string, number> = {};
    graphData.nodes.forEach((n) => {
      counts[n.entityType] = (counts[n.entityType] || 0) + 1;
    });
    const live = Object.entries(counts).map<TypeRow>(([k, count]) => ({
      key: k,
      label: k,
      count,
      color: ENTITY_TYPE_COLORS[k as EntityType] || "var(--p-text-3)",
    }));
    return live.length ? live : FALLBACK_TYPE_ROWS;
  }, [graphData.nodes]);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void) => (key: string) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  };

  // Inspector data — live selection else demo "orders-api"
  const selectedColor = selectedNode
    ? ENTITY_TYPE_COLORS[selectedNode.entityType as EntityType] || "var(--p-text-3)"
    : ENTITY_TYPE_COLORS.API;

  const inspector = selectedNode
    ? {
        name: selectedNode.label,
        type: selectedNode.entityType,
        version: (selectedNode.properties as any)?.version || "v1.0.0",
        status: (selectedNode.healthScore ?? 100) >= 85
          ? "healthy"
          : (selectedNode.healthScore ?? 0) >= 70 ? "degraded" : "critical",
        properties: {
          type: selectedNode.entityType,
          region: (selectedNode.properties as any)?.region || selectedNode.environment || "us-east-1",
          owner: (selectedNode.properties as any)?.owner || (selectedNode.namespace ?? "—"),
          "latency p95": (selectedNode.properties as any)?.latency_p95 || "186 ms",
          "last deploy": (selectedNode.properties as any)?.last_deploy || "14m ago",
          resolution: `${selectedNode.complianceScore ?? 95}%`,
        },
        dependsOn: ["orders-pg", "fulfillment", "session-cache", "notif-q", "payments", "edge-gw", "pd-monitor", "okta-roles"],
        dependedOnBy: [] as string[],
        id: selectedNode.id,
      }
    : {
        name: "orders-api",
        type: "API",
        version: "v3.1.0",
        status: "degraded",
        properties: {
          type: "API",
          region: "us-east-1",
          owner: "orders",
          "latency p95": "186 ms",
          "last deploy": "14m ago",
          resolution: "95%",
        },
        dependsOn: ["orders-pg", "fulfillment", "session-cache", "notif-q", "payments", "edge-gw", "pd-monitor", "okta-roles"],
        dependedOnBy: [] as string[],
        id: "orders-api",
      };

  const statusColor =
    inspector.status === "healthy"  ? "var(--p-green)" :
    inspector.status === "degraded" ? "var(--p-amber)" : "var(--p-red)";

  void metrics;

  return (
    <div className="flex flex-col w-full min-h-full">
      <PageHead
        eyebrow="Knowledge graph"
        title="Topology Explorer"
        subtitle="Convergent perspective topology · 16 platforms · graph-grounded"
      />

      {/* Three-column body */}
      <div className="grid grid-cols-[240px_1fr_340px] gap-4 px-6 pb-6 flex-1 min-h-0">
        {/* ── Left rail ──────────────────────────────────────── */}
        <aside
          className="rounded-xl flex flex-col overflow-hidden"
          style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface)" }}
        >
          <div className="px-4 pt-4 pb-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
            <RailHeading>Search</RailHeading>
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md"
              style={{ background: "var(--p-bg-elevated)", border: "1px solid var(--p-border)" }}
            >
              <Search size={11} style={{ color: "var(--p-text-3)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="orders-* / payments / *-q"
                className="bg-transparent outline-none text-[11px] font-mono w-full"
                style={{ color: "var(--p-text-1)" }}
              />
            </div>

            <RailHeading>Entity types</RailHeading>
            <div className="flex flex-col gap-0.5">
              {typeRows.map((r) => (
                <RailCheckRow
                  key={String(r.key)}
                  active={activeTypes.has(String(r.key))}
                  onToggle={() => toggle(activeTypes, setActiveTypes)(String(r.key))}
                  dotColor={r.color}
                  label={r.label}
                  count={r.count}
                />
              ))}
            </div>

            <RailHeading>Status</RailHeading>
            <div className="flex flex-col gap-0.5">
              {STATUS_ROWS.map((r) => (
                <RailCheckRow
                  key={r.key}
                  active={activeStatuses.has(r.key)}
                  onToggle={() => toggle(activeStatuses, setActiveStatuses)(r.key)}
                  dotColor={
                    r.dot === "ok"   ? "var(--p-green)" :
                    r.dot === "warn" ? "var(--p-amber)" :
                    r.dot === "crit" ? "var(--p-red)"   : "var(--p-text-3)"
                  }
                  label={r.label}
                  count={r.count}
                />
              ))}
            </div>

            <RailHeading>App</RailHeading>
            <div className="flex flex-col gap-0.5">
              {APP_ROWS.map((r) => (
                <RailCheckRow
                  key={r.key}
                  active={activeApps.has(r.key)}
                  onToggle={() => toggle(activeApps, setActiveApps)(r.key)}
                  label={r.label}
                  count={r.count}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* ── Center graph ────────────────────────────────────── */}
        <section
          className="rounded-xl flex flex-col overflow-hidden relative"
          style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface)" }}
        >
          {/* Top toolbar */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <div
              className="flex items-center gap-1 p-1 rounded-md"
              style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface)" }}
            >
              <ToolbarButton ariaLabel="Zoom out" onClick={() => setZoom((z) => Math.max(25, z - 10))}>
                <Minus size={12} />
              </ToolbarButton>
              <Mono className="text-[11px] px-1.5 w-10 text-center" style={{ color: "var(--p-text-2)" }}>
                {zoom}%
              </Mono>
              <ToolbarButton ariaLabel="Zoom in" onClick={() => setZoom((z) => Math.min(200, z + 10))}>
                <Plus size={12} />
              </ToolbarButton>
              <ToolbarButton ariaLabel="Reset zoom" onClick={() => setZoom(100)}>
                <RefreshCcw size={11} />
              </ToolbarButton>
            </div>
          </div>
          <div className="absolute top-3 right-3 z-10">
            <div
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider"
              style={{
                background: "var(--p-green-subtle)",
                color: "var(--p-green)",
                border: "1px solid var(--p-border)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--p-green)", boxShadow: "0 0 6px var(--p-green)" }} />
              LIVE
            </div>
          </div>

          {/* Graph canvas */}
          <div className="flex-1 min-h-0 relative" style={{ background: "var(--p-bg-main)" }}>
            <TopologyGraph />
          </div>

          {/* Bottom legend */}
          <div
            className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-3 px-3 py-2 rounded-md text-[10px] font-mono"
            style={{
              background: "var(--p-bg-card)",
              boxShadow: "var(--p-surface)",
              color: "var(--p-text-3)",
            }}
          >
            {[
              { label: "Service", color: ENTITY_TYPE_COLORS.Service },
              { label: "API",     color: ENTITY_TYPE_COLORS.API },
              { label: "DB",      color: ENTITY_TYPE_COLORS.Database },
              { label: "Queue",   color: ENTITY_TYPE_COLORS.Topic },
              { label: "Cache",   color: ENTITY_TYPE_COLORS.Container },
              { label: "Monitor", color: ENTITY_TYPE_COLORS.Pipeline },
            ].map((l, i, arr) => (
              <span key={l.label} className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />
                <span style={{ color: "var(--p-text-2)" }}>{l.label}</span>
                {i < arr.length - 1 && <span style={{ color: "var(--p-text-3)" }}>·</span>}
              </span>
            ))}
            <span className="ml-auto" style={{ color: "var(--p-text-3)" }}>
              scroll: zoom · drag canvas: pan · drag node: rearrange
            </span>
          </div>
        </section>

        {/* ── Right inspector ─────────────────────────────────── */}
        <aside
          className="rounded-xl flex flex-col overflow-hidden"
          style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface)" }}
        >
          <div className="px-5 pt-5 pb-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
            {/* Title */}
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ background: selectedColor }} />
              <h2
                className="text-[18px] font-semibold leading-none truncate"
                style={{ color: "var(--p-text-1)" }}
              >
                {inspector.name}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono mb-5" style={{ color: "var(--p-text-3)" }}>
              <span>{inspector.type}</span>
              <span>·</span>
              <span>{inspector.version}</span>
              <span
                className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px]"
                style={{
                  background: `color-mix(in srgb, ${statusColor} 14%, transparent)`,
                  color: statusColor,
                }}
              >
                <span className="w-1 h-1 rounded-full" style={{ background: statusColor }} />
                {inspector.status}
              </span>
            </div>

            {/* Properties */}
            <Eyebrow>Properties</Eyebrow>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 mb-5">
              {Object.entries(inspector.properties).map(([k, v]) => (
                <Mono
                  key={k}
                  className="text-[11px] contents"
                >
                  <span style={{ color: "var(--p-text-3)" }}>{k}</span>
                  <span className="text-right truncate" style={{ color: "var(--p-text-1)" }}>{String(v)}</span>
                </Mono>
              ))}
            </div>

            {/* Depends on */}
            <div className="flex items-baseline justify-between mb-2">
              <Eyebrow>Depends on ({inspector.dependsOn.length})</Eyebrow>
            </div>
            <div className="flex flex-col gap-0.5 mb-5">
              {inspector.dependsOn.map((dep) => (
                <button
                  key={dep}
                  onClick={() => navigate(`/app/${dep}`)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors"
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--p-bg-elevated)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <Mono className="text-[12px]" style={{ color: "var(--p-text-1)" }}>{dep}</Mono>
                  <span style={{ color: "var(--p-text-3)" }}>→</span>
                </button>
              ))}
            </div>

            {/* Depended on by */}
            <Eyebrow>Depended on by ({inspector.dependedOnBy.length})</Eyebrow>
            <div className="text-[11px] font-mono mb-5 px-2 py-1.5" style={{ color: "var(--p-text-3)" }}>
              none
            </div>

            {/* Quick actions */}
            <Eyebrow>Quick actions</Eyebrow>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => { if (!isOpen) toggleChat(); }}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-md text-[12px] transition-colors"
                style={{
                  background: "var(--p-iris)",
                  color: "var(--p-text-inv)",
                  fontFamily: '"Geist", system-ui, sans-serif',
                  fontWeight: 500,
                }}
              >
                <Sparkles size={12} /> Ask Iris about this
              </button>
              <button
                onClick={() => navigate(`/blast-radius?entity=${inspector.id}`)}
                className="w-full inline-flex items-center justify-between px-3 py-2 rounded-md text-[12px] transition-colors"
                style={{
                  background: "var(--p-bg-elevated)",
                  color: "var(--p-text-1)",
                  border: "1px solid var(--p-border)",
                  fontFamily: '"Geist", system-ui, sans-serif',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--p-border-strong)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--p-border)")}
              >
                <span>View blast radius</span>
                <span style={{ color: "var(--p-text-3)" }}>→</span>
              </button>
              <button
                onClick={() => navigate(`/app/${inspector.id}`)}
                className="w-full inline-flex items-center justify-between px-3 py-2 rounded-md text-[12px] transition-colors"
                style={{
                  background: "var(--p-bg-elevated)",
                  color: "var(--p-text-1)",
                  border: "1px solid var(--p-border)",
                  fontFamily: '"Geist", system-ui, sans-serif',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--p-border-strong)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--p-border)")}
              >
                <span>Open in App Lens</span>
                <span style={{ color: "var(--p-text-3)" }}>→</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

void StatusDot;
