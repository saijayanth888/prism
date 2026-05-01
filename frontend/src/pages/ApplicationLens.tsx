import { Activity, AlertTriangle, ArrowDownRight, ArrowLeft, ArrowUpRight, BookOpen, Box, Database, ExternalLink, GitBranch, Globe, Layers, Search, Shield, Users, Zap } from "lucide-react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
import PageHead from "../components/common/PageHead";
import Section, { Eyebrow, Mono, StatusDot } from "../components/common/Section";
import IrisQuickAsk from "../components/common/IrisQuickAsk";
import { ENTITY_TYPE_COLORS } from "../types";
import type { EntityType } from "../types";

/* ──────────────────────────────────────────────
   App-switcher tabs (reference design)
   ────────────────────────────────────────────── */
const APP_TABS = [
  { key: "orders",   label: "Orders",   count: 42 },
  { key: "payments", label: "Payments", count: 38 },
];
const APP_TABS_OVERFLOW = 7;

/* ──────────────────────────────────────────────
   Demo data
   ────────────────────────────────────────────── */

const DEMO_ENTITIES: Record<string, any> = {
  "payments-svc": {
    id: "payments-svc", name: "payments-svc", entityType: "Service",
    environment: "production", namespace: "payments",
    healthScore: 82, complianceScore: 74, sloScore: 92,
    p99: 142, errorRate: 0.04, requestsPerSec: 1284, availability: 99.94,
    perfSeries: [120, 138, 142, 130, 145, 148, 142, 152, 138, 130, 142, 142],
    errorSeries: [0.02, 0.04, 0.03, 0.05, 0.04, 0.06, 0.04, 0.05, 0.03, 0.04, 0.04, 0.04],
    rpsSeries: [1100, 1180, 1220, 1280, 1340, 1400, 1380, 1320, 1290, 1280, 1240, 1284],
    vulnerabilities: [
      { id: "CVE-2024-3094",  severity: "critical", cvss: 10.0, description: "xz-utils backdoor · fix: xz 5.4.6",        patched: false, name: "xz-utils backdoor"     },
      { id: "CVE-2024-21345", severity: "high",     cvss: 8.8,  description: "openssl heap overflow · fix: openssl 3.3.1", patched: false, name: "openssl heap overflow" },
      { id: "CVE-2023-50387", severity: "high",     cvss: 7.5,  description: "KeyTrap DNSSEC DoS · fix: bind9 9.18.24",   patched: false, name: "KeyTrap DNSSEC DoS"    },
    ],
    platforms: ["kubernetes", "datadog", "argocd", "github", "sonarqube", "vault"],
    upstream: [
      { id: "api-gateway",  name: "api-gateway",  entityType: "API",     healthScore: 91, p99: 88 },
      { id: "mobile-bff",   name: "mobile-bff",   entityType: "Service", healthScore: 88, p99: 142 },
      { id: "checkout-web", name: "checkout-web", entityType: "Application", healthScore: 91, p99: 230 },
    ],
    downstream: [
      { id: "payments-db",      name: "payments-db",      entityType: "Database", healthScore: 97, p99: 8   },
      { id: "fraud-svc",        name: "fraud-svc",        entityType: "Service",  healthScore: 79, p99: 184 },
      { id: "notification-svc", name: "notification-svc", entityType: "Service",  healthScore: 65, p99: 412 },
      { id: "ledger-svc",       name: "ledger-svc",       entityType: "Service",  healthScore: 94, p99: 96  },
      { id: "payments.events",  name: "payments.events",  entityType: "Topic",    healthScore: 95, p99: 12  },
    ],
    policies: [
      { name: "PCI-DSS-3.2",   status: "partial", gaps: 2, severity: "high"     },
      { name: "SOC2-CC6.7",    status: "pass",    gaps: 0, severity: "low"      },
      { name: "HIPAA-164.312", status: "fail",    gaps: 4, severity: "critical" },
      { name: "ISO 27001-A.8", status: "pass",    gaps: 0, severity: "low"      },
    ],
    incidents: [
      { id: "PD-3122", severity: "critical", title: "orders-pg-primary CPU > 90%",       status: "active", at: "8m ago" },
      { id: "PD-3120", severity: "critical", title: "orders-api-v2 p95 latency degraded", status: "active", at: "1h ago" },
    ],
    docs: [
      { name: "Architecture", path: "wiki/payments-architecture", updated: "5d ago" },
      { name: "Runbook · Incident response", path: "runbooks/payments-ir", updated: "12d ago" },
      { name: "API spec · v2.4", path: "api/payments/v2.4", updated: "2d ago" },
      { name: "Deployment guide", path: "deploy/payments", updated: "30d ago" },
    ],
    owners: { team: "payments-team", lead: "j.chen@prism.ai", oncall: "pagerduty/payments", repo: "github.com/acme/payments-svc" },
    properties: { version: "v2.4.1", replicas: "3", image: "acme/payments-svc:2.4.1", language: "Java 17", region: "us-east-1" },
  },
  "inventory-svc": {
    id: "inventory-svc", name: "inventory-svc", entityType: "Service",
    environment: "production", namespace: "catalog",
    healthScore: 45, complianceScore: 61, sloScore: 64,
    p99: 1240, errorRate: 1.84, requestsPerSec: 412, availability: 97.12,
    perfSeries: [180, 220, 410, 680, 890, 1120, 1240, 1280, 1240, 1180, 1240, 1240],
    errorSeries: [0.2, 0.4, 0.8, 1.4, 1.6, 1.9, 1.84, 1.92, 1.86, 1.84, 1.82, 1.84],
    rpsSeries: [380, 410, 420, 380, 360, 410, 412, 420, 410, 400, 412, 412],
    vulnerabilities: [
      { id: "CVE-2024-0001", severity: "critical", cvss: 9.8, description: "SQL injection · CVSS 9.8 · awaiting patch", patched: false },
      { id: "CVE-2024-0203", severity: "high",     cvss: 7.2, description: "Auth bypass in legacy session handler",     patched: false },
    ],
    platforms: ["kubernetes", "sonarqube", "datadog", "github"],
    upstream: [{ id: "catalog-api", name: "catalog-api", entityType: "API", healthScore: 78, p99: 220 }],
    downstream: [
      { id: "inventory-db",  name: "inventory-db",  entityType: "Database", healthScore: 91, p99: 14 },
      { id: "warehouse-svc", name: "warehouse-svc", entityType: "Service",  healthScore: 83, p99: 180 },
    ],
    policies: [
      { name: "SOC2-CC6", status: "pass", gaps: 0, severity: "low"      },
      { name: "PCI-DSS",  status: "fail", gaps: 3, severity: "critical" },
    ],
    incidents: [{ id: "INC-2041", severity: "critical", title: "DB pool exhausted", status: "active", at: "30m ago" }],
    docs: [{ name: "Runbook", path: "runbooks/inventory", updated: "2d ago" }],
    owners: { team: "catalog-team", lead: "a.kumar@prism.ai", oncall: "pagerduty/catalog", repo: "github.com/acme/inventory-svc" },
    properties: { version: "v1.8.3", replicas: "2", restarts: "3", language: "Go 1.21" },
  },
};

function getDemoEntity(id: string) {
  return DEMO_ENTITIES[id] ?? { ...DEMO_ENTITIES["payments-svc"], id, name: id };
}

const SEV_COLOR: Record<string, string> = {
  critical: "var(--p-red)", high: "#FB923C", medium: "var(--p-amber)", low: "var(--p-green)",
};

function healthColor(score?: number) {
  if (score == null) return "var(--p-text-3)";
  return score >= 85 ? "var(--p-green)" : score >= 70 ? "var(--p-amber)" : "var(--p-red)";
}
function healthStatus(score?: number): "ok" | "warn" | "crit" | "idle" {
  if (score == null) return "idle";
  return score >= 85 ? "ok" : score >= 70 ? "warn" : "crit";
}

/* ──────────────────────────────────────────────
   Components
   ────────────────────────────────────────────── */

function Sparkline({ values, color = "var(--p-accent)", height = 40 }: { values: number[]; color?: string; height?: number }) {
  if (!values.length) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 100;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const last = values[values.length - 1];
  const lastX = w;
  const lastY = height - ((last - min) / range) * (height - 4) - 2;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <polyline points={`${points} ${lastX},${height} 0,${height}`} fill={color} opacity="0.08" />
      <circle cx={lastX} cy={lastY} r="2" fill={color} />
    </svg>
  );
}

function SLOGauge({ score }: { score: number }) {
  const color = score >= 99 ? "var(--p-green)" : score >= 95 ? "var(--p-amber)" : "var(--p-red)";
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--p-bg-elevated)" strokeWidth="6" />
        <circle
          cx="48" cy="48" r={r}
          fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 48 48)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Mono className="text-[18px] font-bold leading-none" style={{ color }}>{score}</Mono>
        <span className="text-[9px] font-mono" style={{ color: "var(--p-text-3)" }}>SLO</span>
      </div>
    </div>
  );
}

function DependencyRow({ d, side, navigate }: { d: any; side: "up" | "down"; navigate: (p: string) => void }) {
  const c = ENTITY_TYPE_COLORS[d.entityType as EntityType] || "var(--p-text-3)";
  const Icon = side === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <button
      onClick={() => navigate(`/app/${d.id}`)}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-left"
      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--p-bg-elevated)"}
      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
    >
      <Icon size={11} style={{ color: side === "up" ? "var(--p-accent)" : "var(--p-text-3)" }} />
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />
      <div className="flex-1 min-w-0">
        <Mono className="text-[12px] truncate" style={{ color: "var(--p-text-1)" }}>{d.name}</Mono>
        <span className="text-[10px]" style={{ color: "var(--p-text-3)" }}>{d.entityType}</span>
      </div>
      <Mono className="text-[11px] font-bold" style={{ color: healthColor(d.healthScore) }}>{d.healthScore}</Mono>
      <Mono className="text-[10px] w-12 text-right" style={{ color: "var(--p-text-3)" }}>{d.p99 ?? "—"}ms</Mono>
    </button>
  );
}

/* ──────────────────────────────────────────────
   Page
   ────────────────────────────────────────────── */

export default function ApplicationLens() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appQuery, setAppQuery] = useState("");

  const { data: liveEntity, isLoading } = useQuery({
    queryKey: ["entity", id],
    queryFn: () => apiClient.get(`/api/v1/entities/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 30_000,
    retry: 1,
  });

  if (!id) {
    return (
      <div className="flex flex-col w-full min-h-full">
        <PageHead
          eyebrow="Application Lens"
          title="Pick an application"
          subtitle="Topology · health · compliance · ownership · CVEs · runbooks — all in one view"
        />
        <div className="grid grid-cols-3 gap-3 px-6 pb-6 max-w-3xl">
          {Object.values(DEMO_ENTITIES).map((e: any) => (
            <button
              key={e.id}
              onClick={() => navigate(`/app/${e.id}`)}
              className="text-left p-4 rounded-xl transition-all"
              style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                  style={{ background: ENTITY_TYPE_COLORS[e.entityType as EntityType], color: "#FFF" }}>
                  {e.entityType[0]}
                </span>
                <Mono className="text-[12px] font-semibold" style={{ color: "var(--p-text-1)" }}>{e.name}</Mono>
              </div>
              <div className="text-[10px]" style={{ color: "var(--p-text-3)" }}>{e.namespace} · {e.environment}</div>
              <div className="mt-3 flex items-center gap-2">
                <StatusDot status={healthStatus(e.healthScore)} size={6} />
                <Mono className="text-[11px] font-bold" style={{ color: healthColor(e.healthScore) }}>{e.healthScore}</Mono>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 rounded" style={{ background: "var(--p-bg-elevated)" }} />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl" style={{ background: "var(--p-bg-card)" }} />)}
        </div>
      </div>
    );
  }

  const entity = liveEntity ?? getDemoEntity(id);
  const demo = getDemoEntity(id);
  // merge: prefer live for scalars but fallback to demo arrays/series when live is empty
  const e: any = { ...demo, ...entity };
  if (!Array.isArray(entity?.vulnerabilities) || !entity.vulnerabilities.length) e.vulnerabilities = demo.vulnerabilities;
  if (!Array.isArray(entity?.incidents)       || !entity.incidents.length)       e.incidents       = demo.incidents;
  if (!Array.isArray(entity?.policies)        || !entity.policies.length)        e.policies        = demo.policies;
  if (!Array.isArray(entity?.docs)            || !entity.docs.length)            e.docs            = demo.docs;
  if (!Array.isArray(entity?.upstream)        || !entity.upstream.length)        e.upstream        = demo.upstream;
  if (!Array.isArray(entity?.downstream)      || !entity.downstream.length)      e.downstream      = demo.downstream;
  const typeColor = ENTITY_TYPE_COLORS[e.entityType as EntityType] || "var(--p-text-3)";
  const hStatus = healthStatus(e.healthScore);

  return (
    <div className="flex flex-col w-full min-h-full">
      {/* Back to apps */}
      <div className="px-6 pt-5">
        <button
          onClick={() => navigate("/app")}
          className="inline-flex items-center gap-1.5 text-[12px] font-mono transition-colors"
          style={{ color: "var(--p-text-3)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--p-text-1)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--p-text-3)")}
        >
          <ArrowLeft size={12} /> Back to apps
        </button>
      </div>

      <PageHead
        eyebrow={`Application Lens · ${e.environment ?? "prod"}`}
        title={e.name}
        subtitle={`${e.entityType} · ${e.namespace ?? "—"} · ${e.owners?.team ?? "—"}`}
        actions={
          <>
            <button
              onClick={() => navigate(`/blast-radius?entity=${e.id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "transparent", color: "var(--p-text-2)", boxShadow: "var(--p-surface)", fontFamily: '"Geist", system-ui, sans-serif' }}
            >
              <Zap size={12} /> Blast radius
            </button>
            <button
              onClick={() => navigate(`/topology?focus=${e.id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "var(--p-accent)", color: "#FFF", fontFamily: '"Geist", system-ui, sans-serif' }}
            >
              <Layers size={12} /> View in topology
            </button>
          </>
        }
      />

      {/* App switcher tabs */}
      <div className="px-6 pb-3 flex items-center gap-2 flex-wrap">
        {APP_TABS.map((tab) => {
          const active = (id ?? "").toLowerCase().includes(tab.key) || tab.key === "orders" && !id;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(`/app/${tab.key === "orders" ? "payments-svc" : `${tab.key}-svc`}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-colors"
              style={{
                background: active ? "var(--p-accent-subtle)" : "var(--p-bg-card)",
                color:      active ? "var(--p-accent)"        : "var(--p-text-2)",
                border:     `1px solid ${active ? "var(--p-accent-border)" : "var(--p-border)"}`,
                fontFamily: '"Geist", system-ui, sans-serif',
                fontWeight: active ? 500 : 400,
              }}
            >
              {tab.label}
              <Mono className="text-[10px]" style={{ color: active ? "var(--p-accent)" : "var(--p-text-3)" }}>
                {tab.count}
              </Mono>
            </button>
          );
        })}
        <span className="text-[11px] font-mono" style={{ color: "var(--p-text-3)" }}>
          + {APP_TABS_OVERFLOW} more
        </span>
      </div>

      {/* Search bar with right-side tags */}
      <div className="px-6 pb-4">
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-xl"
          style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface)" }}
        >
          <Search size={13} style={{ color: "var(--p-text-3)" }} />
          <input
            value={appQuery}
            onChange={(ev) => setAppQuery(ev.target.value)}
            placeholder={`Search services, owners, CVEs, docs within ${e.name}…`}
            className="flex-1 bg-transparent outline-none text-[12px] font-mono"
            style={{ color: "var(--p-text-1)" }}
          />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-mono"
              style={{
                background: "var(--p-accent-subtle)",
                color: "var(--p-accent)",
                border: "1px solid var(--p-accent-border)",
              }}
            >
              tier-0
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-mono"
              style={{
                background: "var(--p-bg-elevated)",
                color: "var(--p-text-2)",
                border: "1px solid var(--p-border)",
              }}
            >
              {e.owners?.team ?? "orders"} · 8 eng
            </span>
          </div>
        </div>
      </div>

      {/* Hero strip */}
      <div className="grid grid-cols-12 gap-3 px-6 pb-4">
        {/* Identity card */}
        <div className="col-span-4 p-4 rounded-xl flex items-center gap-4"
             style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface)" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
               style={{ background: typeColor, color: "#FFF" }}>
            {e.entityType[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StatusDot status={hStatus} size={7} pulse={hStatus === "crit"} />
              <Mono className="text-[14px] font-semibold truncate" style={{ color: "var(--p-text-1)" }}>{e.name}</Mono>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                style={{ background: `${typeColor}22`, color: typeColor }}>{e.entityType}</span>
              {(e.platforms || []).slice(0, 4).map((p: string) => (
                <span key={p} className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                  style={{ background: "var(--p-bg-elevated)", color: "var(--p-text-2)" }}>{p}</span>
              ))}
              {(e.platforms?.length ?? 0) > 4 && (
                <span className="text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>+{e.platforms.length - 4}</span>
              )}
            </div>
          </div>
        </div>

        {/* Score tiles */}
        {[
          { label: "Health",     value: e.healthScore,     color: healthColor(e.healthScore) },
          { label: "Compliance", value: e.complianceScore, color: healthColor(e.complianceScore) },
          { label: "Avail",      value: e.availability,    suffix: "%", color: e.availability >= 99.9 ? "var(--p-green)" : "var(--p-amber)" },
          { label: "p99",        value: e.p99,             suffix: "ms", color: e.p99 < 200 ? "var(--p-green)" : e.p99 < 500 ? "var(--p-amber)" : "var(--p-red)" },
          { label: "Errors",     value: e.errorRate,       suffix: "%", color: e.errorRate < 0.5 ? "var(--p-green)" : "var(--p-red)" },
          { label: "RPS",        value: e.requestsPerSec ?? "—",  color: "var(--p-text-1)" },
          { label: "Vulns",      value: (e.vulnerabilities || []).filter((v: any) => !v.patched).length, color: "var(--p-red)" },
          { label: "Policies",   value: (e.policies || []).length, color: "var(--p-text-1)" },
        ].map((m) => (
          <div key={m.label} className="col-span-1 p-3 rounded-xl"
               style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface)" }}>
            <Eyebrow>{m.label}</Eyebrow>
            <Mono className="text-[18px] font-bold leading-none" style={{ color: m.color }}>
              {m.value ?? "—"}{m.suffix && <span className="text-[10px] ml-0.5" style={{ color: "var(--p-text-3)" }}>{m.suffix}</span>}
            </Mono>
          </div>
        ))}
      </div>

      {/* Main 12-col grid */}
      <div className="grid grid-cols-12 gap-4 px-6 pb-6 flex-1">
        {/* Left col — services, performance, incidents */}
        <div className="col-span-4 flex flex-col gap-4 min-w-0">
          <Section eyebrow="Dependencies" title="Upstream" count={(e.upstream || []).length}>
            <div className="px-2 py-2">
              {(e.upstream || []).map((d: any) => (
                <DependencyRow key={d.id} d={d} side="up" navigate={navigate} />
              ))}
              {(e.upstream || []).length === 0 && (
                <div className="px-3 py-4 text-[11px] text-center" style={{ color: "var(--p-text-3)" }}>none</div>
              )}
            </div>
          </Section>

          <Section eyebrow="Dependencies" title="Downstream" count={(e.downstream || []).length}>
            <div className="px-2 py-2">
              {(e.downstream || []).map((d: any) => (
                <DependencyRow key={d.id} d={d} side="down" navigate={navigate} />
              ))}
              {(e.downstream || []).length === 0 && (
                <div className="px-3 py-4 text-[11px] text-center" style={{ color: "var(--p-text-3)" }}>none</div>
              )}
            </div>
          </Section>

          <Section
            eyebrow="●"
            title="Active incidents"
            count={`${(e.incidents || []).filter((i: any) => i.status === "active").length} open`}
          >
            <div className="px-1 py-1">
              {(e.incidents || []).map((inc: any) => {
                const sev = inc.severity === "critical" ? "var(--p-red)" : inc.severity === "high" ? "#FB923C" : "var(--p-amber)";
                const sevLabel =
                  inc.severity === "critical" || inc.severity === "high" ? "sev1" :
                  inc.severity === "medium" ? "sev2" : "sev3";
                return (
                  <div key={inc.id} className="flex items-start gap-2 px-3 py-2 rounded-md">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono"
                          style={{ color: sev }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: sev }} />
                          {sevLabel}
                        </span>
                        <Mono className="text-[10px]" style={{ color: "var(--p-text-3)" }}>
                          {inc.id} · {inc.at.replace(" ago", "")}
                        </Mono>
                      </div>
                      <div className="text-[12px]" style={{ color: "var(--p-text-1)" }}>{inc.title}</div>
                    </div>
                  </div>
                );
              })}
              {(e.incidents || []).length === 0 && (
                <div className="px-3 py-4 text-[11px] text-center" style={{ color: "var(--p-text-3)" }}>no active incidents</div>
              )}
            </div>
          </Section>
        </div>

        {/* Center col — perf charts, vulnerabilities, compliance */}
        <div className="col-span-5 flex flex-col gap-4 min-w-0">
          <Section eyebrow="Performance" title="24h telemetry"
            actions={
              <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-0.5" style={{ background: "var(--p-accent)" }} /> p99 (ms)</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-0.5" style={{ background: "var(--p-red)" }} /> errors (%)</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-0.5" style={{ background: "var(--p-green)" }} /> rps</span>
              </div>
            }
          >
            <div className="px-4 py-4 grid grid-cols-3 gap-4">
              {[
                { label: "p99 latency", values: e.perfSeries,  color: "var(--p-accent)", current: `${e.p99}ms` },
                { label: "error rate",  values: e.errorSeries, color: "var(--p-red)",    current: `${e.errorRate}%` },
                { label: "throughput",  values: e.rpsSeries,   color: "var(--p-green)",  current: `${e.requestsPerSec} rps` },
              ].map((c) => (
                <div key={c.label}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <Eyebrow>{c.label}</Eyebrow>
                    <Mono className="text-[12px] font-bold" style={{ color: c.color }}>{c.current}</Mono>
                  </div>
                  <Sparkline values={c.values || []} color={c.color} height={50} />
                </div>
              ))}
            </div>
            <div className="px-4 py-3 flex items-center justify-around"
              style={{ borderTop: "1px solid var(--p-border-subtle)" }}>
              <SLOGauge score={e.sloScore ?? 92} />
              <div className="flex-1 grid grid-cols-2 gap-3 px-4">
                {[
                  { label: "Availability target", value: "99.9%" },
                  { label: "Error budget left",   value: "62%"   },
                  { label: "Mean response",       value: `${Math.round((e.p99 || 100) * 0.4)}ms` },
                  { label: "Saturation",          value: "41%"   },
                ].map((s) => (
                  <div key={s.label}>
                    <Eyebrow>{s.label}</Eyebrow>
                    <Mono className="text-[13px]" style={{ color: "var(--p-text-1)" }}>{s.value}</Mono>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section eyebrow="Security" title="CVE posture" count={(e.vulnerabilities || []).filter((v: any) => !v.patched).length}
            actions={
              <button className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--p-text-3)" }}>
                view all →
              </button>
            }
          >
            <div>
              {(e.vulnerabilities || []).map((v: any, i: number, arr: any[]) => (
                <div key={v.id} className="px-4 py-3 flex items-center justify-between gap-3"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--p-border-subtle)" : "none" }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold truncate" style={{ color: "var(--p-text-1)" }}>
                      {v.name ?? v.id}
                    </div>
                    <Mono className="text-[10px]" style={{ color: "var(--p-text-3)" }}>
                      {v.id}{v.description && !v.name ? ` · ${v.description}` : v.name ? ` · ${v.description.replace(`${v.name} · `, "")}` : ""}
                    </Mono>
                  </div>
                  <Mono
                    className="text-[14px] font-bold flex-shrink-0 px-2 py-0.5 rounded"
                    style={{
                      background: `${SEV_COLOR[v.severity]}22`,
                      color: SEV_COLOR[v.severity],
                    }}
                  >
                    {v.cvss?.toFixed ? v.cvss.toFixed(1) : v.cvss}
                  </Mono>
                </div>
              ))}
              {(e.vulnerabilities || []).length === 0 && (
                <div className="px-4 py-4 text-[11px] text-center" style={{ color: "var(--p-text-3)" }}>no known CVEs</div>
              )}
            </div>
          </Section>

          <Section eyebrow="Governance" title="Compliance" count={(e.policies || []).length}>
            <div className="px-4 py-3 grid grid-cols-2 gap-2">
              {(e.policies || []).map((p: any) => (
                <div key={p.name} className="rounded-md px-2.5 py-2 flex items-center gap-2"
                  style={{ background: "var(--p-bg-elevated)" }}>
                  <Shield size={12} style={{
                    color: p.status === "pass" ? "var(--p-green)" : p.status === "partial" ? "var(--p-amber)" : "var(--p-red)",
                  }} />
                  <div className="flex-1 min-w-0">
                    <Mono className="text-[11px] truncate" style={{ color: "var(--p-text-1)" }}>{p.name}</Mono>
                    <div className="text-[10px] font-mono"
                      style={{ color: p.status === "pass" ? "var(--p-green)" : p.status === "partial" ? "var(--p-amber)" : "var(--p-red)" }}>
                      {p.status}{p.gaps > 0 && ` · ${p.gaps} gaps`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Right col — owners, docs, properties, Iris */}
        <div className="col-span-3 flex flex-col gap-4 min-w-0">
          <Section eyebrow="Ownership" title="Team & on-call">
            <div className="px-4 py-3 space-y-2.5">
              {[
                { label: "team",   value: e.owners?.team,   icon: Users },
                { label: "lead",   value: e.owners?.lead,   icon: Users },
                { label: "oncall", value: e.owners?.oncall, icon: AlertTriangle },
                { label: "repo",   value: e.owners?.repo,   icon: GitBranch },
              ].map((o) => (
                <div key={o.label} className="flex items-start gap-2">
                  <o.icon size={11} className="mt-0.5 flex-shrink-0" style={{ color: "var(--p-text-3)" }} />
                  <div className="min-w-0 flex-1">
                    <Eyebrow>{o.label}</Eyebrow>
                    <Mono className="text-[11px] truncate block" style={{ color: "var(--p-text-1)" }}>{o.value ?? "—"}</Mono>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section eyebrow="Documentation" title="Runbooks & specs">
            <div className="px-2 py-1">
              {(e.docs || []).map((d: any) => (
                <button key={d.path} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left">
                  <BookOpen size={11} style={{ color: "var(--p-text-3)" }} />
                  <div className="flex-1 min-w-0">
                    <Mono className="text-[11px] truncate" style={{ color: "var(--p-text-1)" }}>{d.name}</Mono>
                    <Mono className="text-[10px]" style={{ color: "var(--p-text-3)" }}>updated {d.updated}</Mono>
                  </div>
                  <ExternalLink size={10} style={{ color: "var(--p-text-3)" }} />
                </button>
              ))}
            </div>
          </Section>

          <Section eyebrow="Runtime" title="Properties">
            <div className="px-4 py-3 space-y-1.5">
              {Object.entries(e.properties || {}).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <Mono className="text-[10px]" style={{ color: "var(--p-text-3)" }}>{k}</Mono>
                  <Mono className="text-[11px] truncate ml-2" style={{ color: "var(--p-text-1)" }}>{String(v)}</Mono>
                </div>
              ))}
            </div>
          </Section>

          <IrisQuickAsk
            context={e.name}
            prompts={[
              `Why is ${e.name} health at ${e.healthScore}%?`,
              `Show me the runbook for ${e.name} incidents`,
              `What CVEs are blocking deploy for ${e.name}?`,
              `Summarize ${e.name} for an exec audience`,
            ]}
          />
        </div>
      </div>
    </div>
  );
}

void Activity; void Box; void Database; void Globe;
