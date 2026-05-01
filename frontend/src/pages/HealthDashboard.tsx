import { Activity, AlertTriangle, CheckCircle, Clock, Download, RefreshCw, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import apiClient from "../api/client";
import PageHead from "../components/common/PageHead";
import FilterBar, { ChipSelect, FilterChip } from "../components/common/FilterBar";
import Section, { StatusDot, Mono, Eyebrow } from "../components/common/Section";
import MetricCard from "../components/dashboard/MetricCard";
import IrisQuickAsk from "../components/common/IrisQuickAsk";

/* ──────────────────────────────────────────────
   Demo data
   ────────────────────────────────────────────── */

type BlockKind = "ok" | "warn" | "crit" | "dep";

interface TimelineBlock {
  s: number;       // start hour (0..24, where 0=-24h, 24=now)
  d: number;       // duration hours
  k: BlockKind;    // kind
  l?: string;      // label
}

interface ServiceRow {
  name: string;
  sub: string;
  team: string;
  env: string;
  blocks: TimelineBlock[];
}

const TEAMS = ["payments-team", "orders-team", "platform-team", "identity-team", "data-team"];

const SERVICES: ServiceRow[] = [
  { name: "orders-pg-primary",  sub: "rds · pg 15.4",   team: "orders-team",   env: "prod", blocks: [{ s: 0, d: 14, k: "ok" }, { s: 14, d: 2, k: "warn", l: "CPU" }, { s: 16, d: 8, k: "crit", l: "PD-3122 · CPU>90%" }] },
  { name: "orders-api-v2",      sub: "k8s · 12 pods",   team: "orders-team",   env: "prod", blocks: [{ s: 0, d: 20, k: "ok" }, { s: 20, d: 0.3, k: "dep", l: "v3.1.0" }, { s: 20.3, d: 3.7, k: "warn", l: "p95 186ms" }] },
  { name: "payments-svc",       sub: "k8s · tier-0",    team: "payments-team", env: "prod", blocks: [{ s: 0, d: 24, k: "ok", l: "99.97%" }] },
  { name: "fulfillment-worker", sub: "k8s · 6 pods",    team: "orders-team",   env: "prod", blocks: [{ s: 0, d: 24, k: "ok", l: "100%" }] },
  { name: "analytics-replica",  sub: "pg replica",      team: "data-team",     env: "prod", blocks: [{ s: 0, d: 6, k: "ok" }, { s: 6, d: 0.5, k: "warn", l: "WAL" }, { s: 6.5, d: 13, k: "ok" }, { s: 19.5, d: 4.5, k: "warn", l: "WAL 12s" }] },
  { name: "edge-gateway",       sub: "kong · 3 pods",   team: "platform-team", env: "prod", blocks: [{ s: 0, d: 11, k: "ok" }, { s: 11, d: 0.3, k: "crit", l: "5xx" }, { s: 11.3, d: 12.7, k: "ok" }] },
  { name: "session-cache",      sub: "redis 7.2",       team: "platform-team", env: "prod", blocks: [{ s: 0, d: 24, k: "ok", l: "99.99%" }] },
  { name: "notifications-q",    sub: "sqs · 3 parts",   team: "platform-team", env: "prod", blocks: [{ s: 0, d: 24, k: "ok", l: "100%" }] },
  { name: "billing-worker",     sub: "k8s · 4 pods",    team: "payments-team", env: "prod", blocks: [{ s: 0, d: 8, k: "ok" }, { s: 8, d: 0.2, k: "warn", l: "retry" }, { s: 8.2, d: 15.8, k: "ok" }] },
  { name: "snowflake-etl",      sub: "warehouse",       team: "data-team",     env: "prod", blocks: [{ s: 0, d: 3, k: "ok" }, { s: 3, d: 1, k: "warn", l: "slow" }, { s: 4, d: 20, k: "ok" }] },
  { name: "splunk-ingest",      sub: "logging",         team: "platform-team", env: "prod", blocks: [{ s: 0, d: 14, k: "ok" }, { s: 14, d: 4, k: "warn", l: "backoff" }, { s: 18, d: 6, k: "crit", l: "blocked" }] },
  { name: "okta-sso",           sub: "identity",        team: "identity-team", env: "prod", blocks: [{ s: 0, d: 24, k: "ok", l: "100%" }] },
];

function blockBg(k: BlockKind): string {
  switch (k) {
    case "ok":   return "var(--p-green)";
    case "warn": return "var(--p-amber)";
    case "crit": return "var(--p-red)";
    case "dep":  return "var(--p-accent)";
  }
}

function laneStatus(blocks: TimelineBlock[]): "ok" | "warn" | "crit" {
  if (blocks.some((b) => b.k === "crit")) return "crit";
  if (blocks.some((b) => b.k === "warn")) return "warn";
  return "ok";
}

function laneHealth(blocks: TimelineBlock[]): number {
  const total = blocks.reduce((a, b) => a + b.d, 0) || 24;
  const okHrs = blocks.filter((b) => b.k === "ok" || b.k === "dep").reduce((a, b) => a + b.d, 0);
  return Math.round((okHrs / total) * 100);
}

/* ──────────────────────────────────────────────
   Continuous-bar swimlane
   ────────────────────────────────────────────── */

const HOUR_LABELS = ["-24h", "-20h", "-16h", "-12h", "-8h", "-4h", "now"];

function TimelineHeader() {
  return (
    <div
      className="flex items-stretch border-b"
      style={{ borderColor: "var(--p-border-subtle)", paddingLeft: 220 }}
    >
      <div className="flex-1 relative" style={{ height: 26 }}>
        {HOUR_LABELS.map((label, i) => (
          <div
            key={label}
            className="absolute top-0 bottom-0 flex items-center text-[9px] font-mono"
            style={{
              left: `${(i / (HOUR_LABELS.length - 1)) * 100}%`,
              transform: i === HOUR_LABELS.length - 1 ? "translateX(-100%)" : i === 0 ? "translateX(0)" : "translateX(-50%)",
              color: "var(--p-text-3)",
              padding: "0 4px",
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceSwimlane({ svc, onSelect, selected }: { svc: ServiceRow; onSelect: (s: ServiceRow) => void; selected: boolean }) {
  const status = laneStatus(svc.blocks);
  const health = laneHealth(svc.blocks);
  const single = svc.blocks.length === 1 && svc.blocks[0].k === "ok";
  return (
    <div
      onClick={() => onSelect(svc)}
      className="flex items-stretch cursor-pointer transition-colors"
      style={{
        borderBottom: "1px solid var(--p-border-subtle)",
        background: selected ? "var(--p-bg-elevated)" : "transparent",
      }}
      onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLElement).style.background = "var(--p-bg-elevated)"; }}
      onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <div
        className="flex items-center gap-2.5 flex-shrink-0 px-4 py-2.5"
        style={{ width: 220, borderRight: "1px solid var(--p-border-subtle)" }}
      >
        <StatusDot status={status} size={7} pulse={status === "crit"} />
        <div className="min-w-0 flex-1">
          <Mono className="text-[12px] font-semibold block truncate" style={{ color: "var(--p-text-1)" }}>
            {svc.name}
          </Mono>
          <span className="text-[10px]" style={{ color: "var(--p-text-3)" }}>
            {svc.sub}
          </span>
        </div>
        <Mono
          className="text-[11px] font-bold"
          style={{ color: status === "ok" ? "var(--p-green)" : status === "warn" ? "var(--p-amber)" : "var(--p-red)" }}
        >
          {health}
        </Mono>
      </div>
      <div className="flex-1 relative flex items-center" style={{ minHeight: 44, padding: "8px 0" }}>
        <div className="absolute inset-x-0 flex items-center" style={{ top: "50%", transform: "translateY(-50%)", height: 22 }}>
          {svc.blocks.map((b, i) => {
            const widthPct = (b.d / 24) * 100;
            const showLabel = !!b.l && widthPct > 6;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scaleX: 0.6 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.4, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className="h-full flex items-center justify-center overflow-hidden"
                style={{
                  width: `${widthPct}%`,
                  background: blockBg(b.k),
                  opacity: b.k === "ok" && !single ? 0.55 : single ? 0.18 : 0.95,
                  borderLeft: i === 0 ? "none" : "1px solid var(--p-bg-card)",
                  transformOrigin: "left center",
                }}
                title={b.l ? `${b.l} · +${b.d}h` : `${b.k} · +${b.d}h`}
              >
                {showLabel && (
                  <span
                    className="text-[10px] font-mono font-semibold whitespace-nowrap px-2"
                    style={{
                      color: single ? "var(--p-green)" : b.k === "ok" ? "var(--p-text-1)" : "#0C0C18",
                      textShadow: !single && b.k !== "ok" ? "0 1px 0 rgba(255,255,255,0.2)" : "none",
                    }}
                  >
                    {b.l}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Right-rail panels
   ────────────────────────────────────────────── */

interface OpenIncident {
  sev: "crit" | "warn";
  title: string;
  meta: string;
  age: string;
  pd: string;
}

const OPEN_INCIDENTS: OpenIncident[] = [
  { sev: "crit", title: "orders-pg-primary CPU > 90%",     meta: "orders · since 16:42",  age: "8m",  pd: "PD-3122" },
  { sev: "warn", title: "splunk-ingest backoff",           meta: "platform · ingest delay", age: "6m",  pd: "PD-3118" },
  { sev: "warn", title: "orders-api-v2 p95 latency",       meta: "orders · 186ms p95",      age: "1h",  pd: "PD-3120" },
  { sev: "warn", title: "analytics-replica WAL 12s behind", meta: "data · failover candidate", age: "12m", pd: "PD-3121" },
];

const MTTR_BREAKDOWN = [
  { k: "sev1", v: 38, color: "var(--p-red)" },
  { k: "sev2", v: 12, color: "var(--p-amber)" },
  { k: "sev3", v: 5,  color: "var(--p-green)" },
];

const IRIS_COMPARE = [
  { k: "with iris",    v: 9,  color: "var(--p-iris)" },
  { k: "without iris", v: 22, color: "var(--p-text-3)" },
];

const INCIDENTS_BY_APP = [
  { app: "orders",    n: 14 },
  { app: "payments",  n: 6 },
  { app: "analytics", n: 4 },
  { app: "identity",  n: 2 },
  { app: "edge",      n: 1 },
];

const UPTIME_TOP = [
  { svc: "payments-svc",  pct: 99.97 },
  { svc: "session-cache", pct: 99.95 },
  { svc: "okta-sso",      pct: 99.93 },
  { svc: "edge-gateway",  pct: 99.41 },
  { svc: "orders-pg",     pct: 94.80 },
];

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-1 rounded-full" style={{ background: "var(--p-bg-elevated)" }}>
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: color }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────
   Page
   ────────────────────────────────────────────── */

export default function HealthDashboard() {
  const [team, setTeam] = useState("all");
  const [envFilter, setEnvFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "ok" | "warn" | "crit">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ServiceRow>(SERVICES[0]); // orders-pg-primary

  useQuery({
    queryKey: ["health-dashboard"],
    queryFn: () => apiClient.get("/api/v1/health/dashboard").then((r) => r.data),
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    return SERVICES.filter((s) => {
      if (team !== "all" && s.team !== team) return false;
      if (envFilter !== "all" && s.env !== envFilter) return false;
      if (statusFilter !== "all" && laneStatus(s.blocks) !== statusFilter) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.sub.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [team, envFilter, statusFilter, search]);

  const avgHealth = Math.round(filtered.reduce((a, s) => a + laneHealth(s.blocks), 0) / Math.max(filtered.length, 1));
  const critical = filtered.filter((s) => laneStatus(s.blocks) === "crit").length;
  const degraded = filtered.filter((s) => laneStatus(s.blocks) === "warn").length;
  const healthy = filtered.filter((s) => laneStatus(s.blocks) === "ok").length;
  const totalIncidents = OPEN_INCIDENTS.length;
  const avgMttr = "16m";

  return (
    <div className="flex flex-col w-full min-h-full">
      <PageHead
        eyebrow="Operations"
        title="Health Dashboard"
        subtitle="24h timeline · service swimlanes · MTTR / MTTD telemetry"
        actions={
          <>
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "transparent", color: "var(--p-text-2)", boxShadow: "var(--p-surface)", fontFamily: '"Geist", system-ui, sans-serif' }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "var(--p-accent)", color: "#FFFFFF", fontFamily: '"Geist", system-ui, sans-serif' }}
            >
              <Download size={12} /> Export 24h
            </button>
          </>
        }
      />

      {/* Metric strip */}
      <div className="grid grid-cols-6 gap-3 px-6 pb-4">
        <MetricCard label="Avg Health" value={`${avgHealth}`} unit="%" trend={1} trendDirection="up" />
        <MetricCard label="Healthy" value={healthy} trendDirection="up" />
        <MetricCard label="Degraded" value={degraded} trendDirection={degraded > 0 ? "down" : "neutral"} />
        <MetricCard label="Critical" value={critical} trendDirection={critical > 0 ? "down" : "neutral"} />
        <MetricCard label="Open incidents" value={totalIncidents} trendDirection={totalIncidents > 1 ? "down" : "neutral"} />
        <MetricCard label="Avg MTTR" value={avgMttr} trendDirection="up" trend={8} />
      </div>

      {/* Filter bar */}
      <div className="px-6 pb-4">
        <FilterBar
          query={search}
          onQuery={setSearch}
          placeholder="Search services, namespaces…"
          filters={
            <>
              <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>All</FilterChip>
              <FilterChip active={statusFilter === "ok"} onClick={() => setStatusFilter("ok")}>
                <StatusDot status="ok" size={6} /> Healthy
              </FilterChip>
              <FilterChip active={statusFilter === "warn"} onClick={() => setStatusFilter("warn")}>
                <StatusDot status="warn" size={6} /> Degraded
              </FilterChip>
              <FilterChip active={statusFilter === "crit"} onClick={() => setStatusFilter("crit")}>
                <StatusDot status="crit" size={6} /> Critical
              </FilterChip>
            </>
          }
          trailing={
            <>
              <ChipSelect
                label="team"
                value={team}
                onChange={setTeam}
                options={[{ value: "all", label: "all teams" }, ...TEAMS.map((t) => ({ value: t, label: t }))]}
              />
              <ChipSelect
                label="env"
                value={envFilter}
                onChange={setEnvFilter}
                options={[
                  { value: "all", label: "all envs" },
                  { value: "prod", label: "prod" },
                  { value: "staging", label: "staging" },
                ]}
              />
            </>
          }
        />
      </div>

      {/* Main 2-col grid */}
      <div className="grid grid-cols-12 gap-4 px-6 pb-6 flex-1">
        {/* Timeline river — spans 8 cols */}
        <div className="col-span-8 flex flex-col gap-4 min-w-0">
          <Section
            eyebrow="24h"
            title="Service swimlanes"
            count={`${filtered.length} services`}
            actions={
              <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>
                {([
                  { k: "ok",   label: "ok",     color: "var(--p-green)" },
                  { k: "warn", label: "warn",   color: "var(--p-amber)" },
                  { k: "crit", label: "crit",   color: "var(--p-red)" },
                  { k: "dep",  label: "deploy", color: "var(--p-accent)" },
                ] as const).map((x) => (
                  <span key={x.k} className="inline-flex items-center gap-1">
                    <span className="inline-block rounded-sm" style={{ width: 10, height: 10, background: x.color }} />
                    {x.label}
                  </span>
                ))}
              </div>
            }
          >
            <TimelineHeader />
            <div className="overflow-x-auto">
              {filtered.map((svc) => (
                <ServiceSwimlane
                  key={svc.name}
                  svc={svc}
                  onSelect={setSelected}
                  selected={selected.name === svc.name}
                />
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-12 text-center text-xs" style={{ color: "var(--p-text-3)" }}>
                  No services match the filters.
                </div>
              )}
            </div>
            <div
              className="flex items-center justify-between px-4 py-2 text-[10px] font-mono"
              style={{ borderTop: "1px solid var(--p-border-subtle)", color: "var(--p-text-3)" }}
            >
              <span>● scroll timeline to zoom in · click any block to open incident</span>
              <span>{filtered.length} services · 24h</span>
            </div>
          </Section>
        </div>

        {/* Right rail — 4 cols */}
        <div className="col-span-4 flex flex-col gap-4 min-w-0">
          {/* Open incidents */}
          <Section title="Open incidents" eyebrow="now" count={`${OPEN_INCIDENTS.length} active`}>
            <div className="divide-y" style={{ borderColor: "var(--p-border-subtle)" }}>
              {OPEN_INCIDENTS.map((inc) => (
                <div key={inc.pd} className="flex items-start gap-2.5 px-4 py-2.5">
                  <StatusDot status={inc.sev} size={7} pulse={inc.sev === "crit"} />
                  <div className="min-w-0 flex-1">
                    <Mono className="text-[12px] font-semibold block truncate" style={{ color: "var(--p-text-1)" }}>
                      {inc.title}
                    </Mono>
                    <span className="text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>
                      {inc.pd} · {inc.meta}
                    </span>
                  </div>
                  <Mono className="text-[10px]" style={{ color: "var(--p-text-2)" }}>{inc.age}</Mono>
                </div>
              ))}
            </div>
          </Section>

          {/* MTTR breakdown */}
          <Section title="MTTR breakdown" eyebrow="30d">
            <div className="px-4 py-3 space-y-2.5">
              {MTTR_BREAKDOWN.map((m) => {
                const pct = Math.min((m.v / 45) * 100, 100);
                return (
                  <div key={m.k}>
                    <div className="flex items-center justify-between mb-1">
                      <Mono className="text-[11px]" style={{ color: "var(--p-text-2)" }}>{m.k}</Mono>
                      <Mono className="text-[11px] font-semibold" style={{ color: m.color }}>{m.v}m</Mono>
                    </div>
                    <MiniBar pct={pct} color={m.color} />
                  </div>
                );
              })}
              <div
                className="pt-2.5 mt-2.5 space-y-2.5"
                style={{ borderTop: "1px solid var(--p-border-subtle)" }}
              >
                {IRIS_COMPARE.map((m) => {
                  const pct = Math.min((m.v / 45) * 100, 100);
                  return (
                    <div key={m.k}>
                      <div className="flex items-center justify-between mb-1">
                        <Mono className="text-[11px]" style={{ color: "var(--p-text-2)" }}>{m.k}</Mono>
                        <Mono className="text-[11px] font-semibold" style={{ color: m.color }}>{m.v}m</Mono>
                      </div>
                      <MiniBar pct={pct} color={m.color} />
                    </div>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* Incidents by app */}
          <Section title="Incidents by app" eyebrow="30d">
            <div className="px-4 py-3 space-y-2">
              {INCIDENTS_BY_APP.map((row) => {
                const max = INCIDENTS_BY_APP[0].n;
                const pct = (row.n / max) * 100;
                return (
                  <div key={row.app} className="flex items-center gap-3">
                    <Mono className="text-[11px] flex-shrink-0" style={{ color: "var(--p-text-2)", width: 72 }}>
                      {row.app}
                    </Mono>
                    <div className="flex-1">
                      <MiniBar pct={pct} color="var(--p-accent)" />
                    </div>
                    <Mono className="text-[11px] font-semibold flex-shrink-0" style={{ color: "var(--p-text-1)", width: 24, textAlign: "right" }}>
                      {row.n}
                    </Mono>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Uptime 30d */}
          <Section title="Uptime" eyebrow="30d · top services">
            <div className="px-4 py-3 space-y-2">
              {UPTIME_TOP.map((row) => {
                const color = row.pct >= 99.9 ? "var(--p-green)" : row.pct >= 99 ? "var(--p-amber)" : "var(--p-red)";
                const pct = ((row.pct - 90) / 10) * 100;
                return (
                  <div key={row.svc} className="flex items-center gap-3">
                    <Mono className="text-[11px] flex-shrink-0 truncate" style={{ color: "var(--p-text-2)", width: 96 }}>
                      {row.svc}
                    </Mono>
                    <div className="flex-1">
                      <MiniBar pct={Math.max(pct, 8)} color={color} />
                    </div>
                    <Mono className="text-[11px] font-semibold flex-shrink-0" style={{ color, width: 48, textAlign: "right" }}>
                      {row.pct}%
                    </Mono>
                  </div>
                );
              })}
            </div>
          </Section>

          <IrisQuickAsk
            context={selected.name}
            prompts={[
              `Why is ${selected.name} degraded?`,
              `Show me the last incident for ${selected.name}`,
              `Who owns ${selected.name} and what's on-call?`,
              `What changed in ${selected.name} in the last 24h?`,
            ]}
          />
        </div>
      </div>
    </div>
  );
}

/* unused vars hint */
void Activity; void AlertTriangle; void CheckCircle; void Clock; void TrendingDown; void TrendingUp; void Zap; void Eyebrow;
