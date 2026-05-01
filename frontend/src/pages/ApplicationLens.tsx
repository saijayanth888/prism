import { Activity, AlertTriangle, ExternalLink, Layers, Shield, GitBranch, Box, Database, Globe } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
import DependencyChain from "../components/applens/DependencyChain";
import { ENTITY_TYPE_COLORS } from "../types";
import type { EntityType } from "../types";

const CARD = { background: "var(--p-bg-card)", border: "1px solid var(--p-border)" };

/* ── Demo data for offline / no-backend mode ─────────────── */
const DEMO_ENTITIES: Record<string, any> = {
  "payments-svc": {
    id: "payments-svc",
    name: "payments-svc",
    entityType: "Service",
    environment: "production",
    namespace: "payments",
    healthScore: 82,
    complianceScore: 74,
    vulnerabilities: [
      { id: "CVE-2024-0042", severity: "high",     cvss: 7.5, description: "RCE via deserialization in jackson-databind" },
      { id: "CVE-2024-0001", severity: "critical",  cvss: 9.8, description: "SQL injection via unsanitized query param" },
    ],
    platforms: ["kubernetes", "datadog", "argocd", "sonarqube"],
    upstream: [
      { id: "api-gateway",   name: "api-gateway",   entityType: "API",        healthScore: 91 },
      { id: "mobile-bff",    name: "mobile-bff",    entityType: "Service",    healthScore: 88 },
    ],
    downstream: [
      { id: "payments-db",    name: "payments-db",    entityType: "Database",   healthScore: 97 },
      { id: "fraud-svc",      name: "fraud-svc",      entityType: "Service",    healthScore: 79 },
      { id: "notification-svc",name: "notification-svc",entityType: "Service",  healthScore: 65 },
      { id: "ledger-svc",     name: "ledger-svc",     entityType: "Service",    healthScore: 94 },
    ],
    policies: [
      { name: "PCI-DSS-3.2",   status: "partial", gaps: 2 },
      { name: "SOC2-CC6.7",    status: "pass",    gaps: 0 },
      { name: "HIPAA-164.312", status: "fail",    gaps: 4 },
    ],
    properties: {
      version: "v2.4.1",
      replicas: "3",
      image: "acme/payments-svc:2.4.1",
      language: "Java 17",
      owner: "payments-team",
      oncall: "pagerduty/payments",
    },
  },
  "inventory-svc": {
    id: "inventory-svc",
    name: "inventory-svc",
    entityType: "Service",
    environment: "production",
    namespace: "catalog",
    healthScore: 45,
    complianceScore: 61,
    vulnerabilities: [
      { id: "CVE-2024-0001", severity: "critical", cvss: 9.8, description: "SQL injection · CVSS 9.8 · awaiting patch" },
    ],
    platforms: ["kubernetes", "sonarqube", "datadog"],
    upstream: [
      { id: "catalog-api", name: "catalog-api", entityType: "API", healthScore: 78 },
    ],
    downstream: [
      { id: "inventory-db", name: "inventory-db", entityType: "Database", healthScore: 91 },
      { id: "warehouse-svc", name: "warehouse-svc", entityType: "Service", healthScore: 83 },
    ],
    policies: [
      { name: "SOC2-CC6", status: "pass", gaps: 0 },
      { name: "PCI-DSS",  status: "fail", gaps: 3 },
    ],
    properties: {
      version: "v1.8.3",
      replicas: "2",
      restarts: "3",
      owner: "catalog-team",
    },
  },
};

/* Pick first demo entity if id isn't explicitly mapped */
function getDemoEntity(id: string) {
  return DEMO_ENTITIES[id] ?? { ...DEMO_ENTITIES["payments-svc"], id, name: id };
}

/* ── Sub-components ─────────────────────────────────────── */
function ScoreBadge({ label, score }: { label: string; score?: number }) {
  if (score == null) return null;
  const color = score >= 85 ? "var(--p-green)" : score >= 70 ? "var(--p-amber)" : "var(--p-red)";
  return (
    <div className="flex flex-col items-center p-4 rounded-xl" style={CARD}>
      <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-mono font-bold" style={{ color }}>{score}</div>
    </div>
  );
}

function PlatformTag({ name }: { name: string }) {
  const COLORS: Record<string, string> = {
    kubernetes: "#3B82F6", datadog: "#8B5CF6", argocd: "#EC4899",
    sonarqube: "#EF4444", github: "#94A3B8", aws: "#F59E0B",
  };
  const color = COLORS[name] || "#64748B";
  return (
    <span className="text-[10px] px-2.5 py-1 rounded-full font-mono flex items-center gap-1"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      {name}
    </span>
  );
}

const SEV_COLOR: Record<string, string> = {
  critical: "var(--p-red)", high: "#EA580C", medium: "var(--p-amber)", low: "var(--p-green)",
};

/* ── Demo mode banner ───────────────────────────────────── */
function DemoBanner() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-mono"
      style={{ background: "var(--p-iris-subtle)", border: "1px solid var(--p-iris-border)", color: "var(--p-iris)" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
      Demo mode · backend offline · showing synthetic data · run <code className="mx-1 px-1 rounded" style={{ background: "var(--p-iris-subtle)" }}>make dev</code> to connect live graph
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export default function ApplicationLens() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: liveEntity, isLoading, isError } = useQuery({
    queryKey: ["entity", id],
    queryFn: () => apiClient.get(`/api/v1/entities/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 30_000,
    retry: 1,
  });

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Layers size={40} className="mb-4" style={{ color: "var(--p-text-3)" }} />
        <h2 className="text-base font-semibold mb-2" style={{ color: "var(--p-text-1)", fontFamily: '"Syne", sans-serif' }}>Application Lens</h2>
        <p className="text-sm max-w-xs leading-relaxed" style={{ color: "var(--p-text-3)" }}>
          Select a node in the topology graph to explore its 360° view — dependencies, health, compliance, and blast radius.
        </p>
        <button onClick={() => navigate("/topology")}
          className="mt-5 text-xs font-medium flex items-center gap-1 transition-colors"
          style={{ color: "var(--p-iris)" }}>
          <ExternalLink size={11} />
          Open Topology
        </button>
        {/* Quick demo links */}
        <div className="mt-8 space-y-2 w-full max-w-xs">
          <div className="text-[9px] uppercase tracking-wider mb-3" style={{ color: "var(--p-text-3)" }}>Demo entities</div>
          {Object.values(DEMO_ENTITIES).map((e: any) => (
            <button key={e.id} onClick={() => navigate(`/app/${e.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
              style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)" }}
              onMouseEnter={(ev) => (ev.currentTarget.style.borderColor = "var(--p-iris-border)")}
              onMouseLeave={(ev) => (ev.currentTarget.style.borderColor = "var(--p-border)")}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ color: "var(--p-bg-deep)" }}
                style={{ background: ENTITY_TYPE_COLORS[e.entityType as EntityType] || "#64748B" }}>
                {e.entityType[0]}
              </div>
              <div>
                <div className="text-xs font-mono font-semibold" style={{ color: "var(--p-text-1)" }}>{e.name}</div>
                <div className="text-[10px]" style={{ color: "var(--p-text-3)" }}>{e.namespace} · {e.environment}</div>
              </div>
              <div className="ml-auto text-[10px] font-mono font-bold"
                style={{ color: e.healthScore >= 70 ? "var(--p-green)" : "var(--p-red)" }}>{e.healthScore}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 rounded" style={{ background: "var(--p-bg-border)" }} />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl" style={{ background: "var(--p-bg-card)" }} />)}
        </div>
        <div className="h-40 rounded-xl" style={{ background: "var(--p-bg-card)" }} />
      </div>
    );
  }

  /* Use live data if available, else fall back to demo data */
  const entity = liveEntity ?? (isError ? getDemoEntity(id) : null);
  const isDemo = !liveEntity;

  if (!entity) return null;

  const typeColor = ENTITY_TYPE_COLORS[entity.entityType as EntityType] || "#64748B";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Demo banner */}
      {isDemo && <DemoBanner />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: typeColor }}>
            {entity.entityType?.[0] || "?"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-mono">{entity.name}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: typeColor + "20", color: typeColor }}>
                {entity.entityType}
              </span>
              {entity.environment && (
                <span className="text-[11px] px-2 py-0.5 rounded-full text-slate-400"
                  style={{ background: "var(--p-bg-border)", border: "1px solid #334155" }}>
                  {entity.environment}
                </span>
              )}
              {entity.namespace && (
                <span className="text-[11px] text-slate-600 font-mono">{entity.namespace}</span>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => navigate(`/blast-radius?entity=${id}`)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: "rgba(217,119,6,0.12)", color: "#D97706", border: "1px solid rgba(217,119,6,0.25)" }}>
          <AlertTriangle size={11} />
          Blast Radius
        </button>
      </div>

      {/* Score grid */}
      <div className="grid grid-cols-4 gap-3">
        <ScoreBadge label="Health" score={entity.healthScore} />
        <ScoreBadge label="Compliance" score={entity.complianceScore} />
        <div className="flex flex-col items-center p-4 rounded-xl" style={CARD}>
          <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Vulns</div>
          <div className="text-2xl font-mono font-bold"
            style={{ color: (entity.vulnerabilities?.length || 0) > 0 ? "#EF4444" : "#22C55E" }}>
            {entity.vulnerabilities?.length || 0}
          </div>
        </div>
        <div className="flex flex-col items-center p-4 rounded-xl" style={CARD}>
          <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Platforms</div>
          <div className="text-2xl font-mono font-bold text-white">{entity.platforms?.length || 1}</div>
        </div>
      </div>

      {/* Vulnerabilities */}
      {entity.vulnerabilities?.length > 0 && (
        <div className="p-4 rounded-xl" style={CARD}>
          <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
            <Shield size={12} style={{ color: "#EF4444" }} />
            Vulnerabilities ({entity.vulnerabilities.length})
          </div>
          <div className="space-y-2">
            {entity.vulnerabilities.map((v: any) => (
              <div key={v.id} className="flex items-start gap-3 p-2.5 rounded-lg"
                style={{ background: "var(--p-bg-main)", border: "1px solid var(--p-border)" }}>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded flex-shrink-0"
                  style={{ background: `${SEV_COLOR[v.severity]}18`, color: SEV_COLOR[v.severity] }}>
                  {v.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-mono font-semibold text-slate-300">{v.id}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{v.description}</div>
                </div>
                {v.cvss && (
                  <span className="text-[10px] font-mono text-slate-600 flex-shrink-0">CVSS {v.cvss}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform footprint */}
      {entity.platforms?.length > 0 && (
        <div className="p-4 rounded-xl" style={CARD}>
          <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
            <Activity size={12} className="text-slate-600" />
            Platform Footprint
          </div>
          <div className="flex flex-wrap gap-2">
            {entity.platforms.map((p: string) => <PlatformTag key={p} name={p} />)}
          </div>
        </div>
      )}

      {/* Dependencies */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl" style={CARD}>
          <DependencyChain title="Upstream (calls this)" nodes={entity.upstream || []} direction="upstream" />
        </div>
        <div className="p-4 rounded-xl" style={CARD}>
          <DependencyChain title="Downstream (depends on)" nodes={entity.downstream || []} direction="downstream" />
        </div>
      </div>

      {/* Compliance */}
      <div className="p-4 rounded-xl" style={CARD}>
        <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
          <Shield size={12} className="text-slate-600" />
          Compliance Policies
        </div>
        <div className="flex flex-col gap-2.5">
          {(entity.policies || [
            { name: "PCI-DSS-3.2", status: "partial", gaps: 2 },
            { name: "SOC2-CC6",    status: "pass",    gaps: 0 },
          ]).map((p: { name: string; status: string; gaps: number }) => (
            <div key={p.name} className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300">{p.name}</span>
              <div className="flex items-center gap-2">
                {p.gaps > 0 && (
                  <span className="text-[10px]" style={{ color: "#EF4444" }}>{p.gaps} gaps</span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={
                    p.status === "pass"
                      ? { background: "rgba(34,197,94,0.12)",  color: "#22C55E", border: "1px solid rgba(34,197,94,0.25)" }
                      : p.status === "partial"
                      ? { background: "rgba(217,119,6,0.12)",  color: "#D97706", border: "1px solid rgba(217,119,6,0.25)" }
                      : { background: "rgba(239,68,68,0.12)",  color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)" }
                  }>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Properties */}
      {entity.properties && Object.keys(entity.properties).length > 0 && (
        <div className="p-4 rounded-xl" style={CARD}>
          <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
            <Box size={12} className="text-slate-600" />
            Properties
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {Object.entries(entity.properties).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600 font-mono w-20 flex-shrink-0">{k}</span>
                <span className="text-[10px] text-slate-400 font-mono truncate">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
