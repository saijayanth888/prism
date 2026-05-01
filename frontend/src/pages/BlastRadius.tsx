import {
  AlertTriangle,
  ChevronRight,
  Database,
  Layers,
  Sliders,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHead from "../components/common/PageHead";
import { ChipSelect } from "../components/common/FilterBar";
import Section, { Eyebrow, Mono, StatusDot } from "../components/common/Section";
import IrisQuickAsk from "../components/common/IrisQuickAsk";
import { ENTITY_TYPE_COLORS } from "../types";
import type { EntityType } from "../types";

/* ──────────────────────────────────────────────
   Blast scenarios
   ────────────────────────────────────────────── */

interface AffectedNode {
  name: string;
  type: EntityType;
  hop: 1 | 2 | 3;
  impact: "critical" | "high" | "medium" | "low";
  reason: string;
  team: string;
  health: number;
  app?: string;
}

interface Scenario {
  entity: string;
  type: EntityType;
  health: number;
  team: string;
  affected: AffectedNode[];
  teams: string[];
  apps: string[];
  summary: string;
  riskScore: number;
  pgVersion: string;
  platform: string;
  revenuePerHour: number; // dollars
  mttr: number; // minutes
}

const BLAST_SCENARIOS: Record<string, Scenario> = {
  "orders-pg-primary": {
    entity: "orders-pg-primary",
    type: "Database",
    health: 96,
    team: "orders-team",
    riskScore: 92,
    pgVersion: "pg 15.4",
    platform: "rds",
    revenuePerHour: 48000,
    mttr: 38,
    apps: ["checkout", "fulfillment", "ledger", "ops-portal"],
    teams: ["orders-team", "payments-team", "platform-team", "data-team"],
    summary:
      "Primary checkout database. 17 entities pull a hop on this volume. $48k/hour revenue at risk on outage.",
    affected: [
      // Hop 1 — direct (3)
      { name: "orders-svc",      type: "Service",     hop: 1, impact: "critical", reason: "STORED_IN orders-pg-primary", team: "orders-team",   health: 75, app: "checkout"     },
      { name: "ledger-svc",      type: "Service",     hop: 1, impact: "critical", reason: "READS orders-pg-primary",     team: "payments-team", health: 94, app: "ledger"       },
      { name: "orders-replica",  type: "Database",    hop: 1, impact: "high",     reason: "STREAMING_REPLICA",           team: "data-team",     health: 99, app: "ops-portal"   },
      // Hop 2 — transitive (6)
      { name: "payments-api",    type: "API",         hop: 2, impact: "critical", reason: "via orders-svc",              team: "payments-team", health: 88, app: "checkout"     },
      { name: "checkout-web",    type: "Application", hop: 2, impact: "critical", reason: "via orders-svc",              team: "orders-team",   health: 91, app: "checkout"     },
      { name: "fraud-svc",       type: "Service",     hop: 2, impact: "high",     reason: "DEPENDS_ON ledger-svc",       team: "payments-team", health: 84, app: "ledger"       },
      { name: "billing-export",  type: "Pipeline",    hop: 2, impact: "high",     reason: "READS orders-replica",        team: "data-team",     health: 89, app: "ledger"       },
      { name: "warehouse-svc",   type: "Service",     hop: 2, impact: "medium",   reason: "DEPENDS_ON orders-svc",       team: "orders-team",   health: 83, app: "fulfillment"  },
      { name: "ops-portal",      type: "Application", hop: 2, impact: "medium",   reason: "via orders-replica",          team: "platform-team", health: 89, app: "ops-portal"   },
      // Hop 3 — downstream (8)
      { name: "edge-gateway",    type: "API",         hop: 3, impact: "high",     reason: "ROUTES payments-api",         team: "platform-team", health: 99, app: "checkout"     },
      { name: "notification-svc",type: "Service",     hop: 3, impact: "medium",   reason: "CONSUMES orders.events",      team: "platform-team", health: 68, app: "checkout"     },
      { name: "analytics-svc",   type: "Service",     hop: 3, impact: "medium",   reason: "CONSUMES orders.events",      team: "data-team",     health: 82, app: "ledger"       },
      { name: "reporting-svc",   type: "Service",     hop: 3, impact: "low",      reason: "DEPENDS_ON analytics-svc",    team: "data-team",     health: 77, app: "ledger"       },
      { name: "shipping-svc",    type: "Service",     hop: 3, impact: "medium",   reason: "DEPENDS_ON warehouse-svc",    team: "orders-team",   health: 86, app: "fulfillment"  },
      { name: "tax-svc",         type: "Service",     hop: 3, impact: "low",      reason: "DEPENDS_ON ledger-svc",       team: "payments-team", health: 92, app: "ledger"       },
      { name: "inventory-cache", type: "Database",    hop: 3, impact: "low",      reason: "REFRESHED_BY warehouse-svc",  team: "orders-team",   health: 94, app: "fulfillment"  },
      { name: "admin-portal",    type: "Application", hop: 3, impact: "low",      reason: "via ops-portal",              team: "platform-team", health: 91, app: "ops-portal"   },
    ],
  },
  "payments-svc": {
    entity: "payments-svc",
    type: "Service",
    health: 92,
    team: "payments-team",
    riskScore: 87,
    pgVersion: "go 1.22",
    platform: "k8s",
    revenuePerHour: 62000,
    mttr: 42,
    apps: ["checkout", "ledger", "ops-portal"],
    teams: ["payments-team", "orders-team", "platform-team", "data-team"],
    summary:
      "Critical revenue path. Payments-svc failure cascades to checkout, fulfillment, and reporting.",
    affected: [
      { name: "payments-api",     type: "API",         hop: 1, impact: "critical", reason: "GATEWAY_FOR payments-svc", team: "payments-team", health: 88, app: "checkout" },
      { name: "orders-svc",       type: "Service",     hop: 1, impact: "critical", reason: "DEPENDS_ON payments-svc",  team: "orders-team",   health: 75, app: "checkout" },
      { name: "payments-db",      type: "Database",    hop: 1, impact: "high",     reason: "STORED_IN payments-svc",   team: "payments-team", health: 99, app: "ledger"   },
      { name: "fraud-svc",        type: "Service",     hop: 2, impact: "high",     reason: "CONSUMES payments.events", team: "payments-team", health: 84, app: "ledger"   },
      { name: "notification-svc", type: "Service",     hop: 2, impact: "medium",   reason: "CONSUMES payments.events", team: "platform-team", health: 68, app: "checkout" },
      { name: "analytics-svc",    type: "Service",     hop: 2, impact: "medium",   reason: "CONSUMES payments.events", team: "data-team",     health: 82, app: "ledger"   },
      { name: "ledger-svc",       type: "Service",     hop: 2, impact: "high",     reason: "DEPENDS_ON payments-api",  team: "payments-team", health: 94, app: "ledger"   },
      { name: "gateway-prod",     type: "API",         hop: 2, impact: "critical", reason: "ROUTES payments-api",      team: "platform-team", health: 99, app: "checkout" },
      { name: "checkout-web",     type: "Application", hop: 2, impact: "critical", reason: "CALLS payments-api",       team: "orders-team",   health: 91, app: "checkout" },
      { name: "reporting-svc",    type: "Service",     hop: 3, impact: "low",      reason: "DEPENDS_ON analytics-svc", team: "data-team",     health: 77, app: "ledger"   },
      { name: "billing-export",   type: "Pipeline",    hop: 3, impact: "medium",   reason: "DEPENDS_ON ledger-svc",    team: "data-team",     health: 89, app: "ledger"   },
    ],
  },
};

const IMPACT_STYLE: Record<
  AffectedNode["impact"],
  { color: string; bg: string; border: string }
> = {
  critical: { color: "var(--p-red)",   bg: "var(--p-red-subtle)",       border: "var(--p-red)" },
  high:     { color: "#EA580C",        bg: "rgba(234,88,12,0.12)",      border: "rgba(234,88,12,0.4)" },
  medium:   { color: "var(--p-amber)", bg: "var(--p-amber-subtle)",     border: "var(--p-amber)" },
  low:      { color: "var(--p-green)", bg: "var(--p-green-subtle)",     border: "var(--p-green)" },
};

/* ──────────────────────────────────────────────
   Concentric rings (HTML positioned chips)
   ────────────────────────────────────────────── */

function RingChip({
  node,
  hover,
  setHover,
}: {
  node: AffectedNode;
  hover: AffectedNode | null;
  setHover: (n: AffectedNode | null) => void;
}) {
  const color = ENTITY_TYPE_COLORS[node.type] || "var(--p-text-3)";
  const isHover = hover?.name === node.name;
  const isDimmed = !!hover && !isHover;
  return (
    <div
      onMouseEnter={() => setHover(node)}
      onMouseLeave={() => setHover(null)}
      className="absolute inline-flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-all"
      style={{
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        background: "var(--p-bg-card)",
        border: `1px solid ${isHover ? IMPACT_STYLE[node.impact].border : "var(--p-border)"}`,
        boxShadow: isHover ? "var(--p-surface-elevated)" : "var(--p-surface)",
        opacity: isDimmed ? 0.35 : 1,
        zIndex: isHover ? 30 : 5,
        whiteSpace: "nowrap",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: color }}
      />
      <Mono
        className="text-[10px]"
        style={{ color: isHover ? "var(--p-text-1)" : "var(--p-text-2)" }}
      >
        {node.name}
      </Mono>
    </div>
  );
}

function RingsViz({
  scenario,
  hover,
  setHover,
  ringsMax,
}: {
  scenario: Scenario;
  hover: AffectedNode | null;
  setHover: (n: AffectedNode | null) => void;
  ringsMax: number;
}) {
  const SIZE = 620;
  const CENTER = SIZE / 2;
  const RADII = [0, 130, 220, 290];

  const ringNodes: Record<number, AffectedNode[]> = { 1: [], 2: [], 3: [] };
  scenario.affected.forEach((n) => {
    if (n.hop <= ringsMax) ringNodes[n.hop].push(n);
  });

  const sourceColor = ENTITY_TYPE_COLORS[scenario.type] || "var(--p-red)";

  // Position helper: returns absolute pixel x/y for a node on a ring
  function pos(hop: 1 | 2 | 3, i: number, total: number) {
    const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
    const r = RADII[hop];
    const x = CENTER + r * Math.cos(angle);
    const y = CENTER + r * Math.sin(angle);
    return { x, y };
  }

  return (
    <div
      className="relative mx-auto"
      style={{ width: SIZE, height: SIZE, maxWidth: "100%" }}
    >
      {/* SVG layer for rings, glow, connector lines */}
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width="100%"
        height="100%"
        className="absolute inset-0"
      >
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(248,113,113,0.35)" />
            <stop offset="55%" stopColor="rgba(248,113,113,0.05)" />
            <stop offset="100%" stopColor="rgba(248,113,113,0)" />
          </radialGradient>
        </defs>

        <circle cx={CENTER} cy={CENTER} r={RADII[3] + 30} fill="url(#centerGlow)" />

        {[1, 2, 3].slice(0, ringsMax).map((hop) => (
          <g key={`ring-${hop}`}>
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADII[hop]}
              fill="none"
              stroke="rgba(248,113,113,0.45)"
              strokeWidth="1.25"
              strokeDasharray="3 5"
              opacity={0.65}
            />
          </g>
        ))}

        {/* Connector lines (rays from center to each chip) */}
        {([1, 2, 3] as const).slice(0, ringsMax).map((hop) => {
          const nodes = ringNodes[hop];
          return nodes.map((n, i) => {
            const { x, y } = pos(hop, i, nodes.length);
            const isHover = hover?.name === n.name;
            return (
              <line
                key={`line-${n.name}`}
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                stroke={
                  isHover
                    ? IMPACT_STYLE[n.impact].color
                    : "rgba(248,113,113,0.32)"
                }
                strokeWidth={isHover ? 1.6 : 0.9}
                strokeDasharray={isHover ? "0" : "2 4"}
                opacity={hover && !isHover ? 0.3 : 1}
              />
            );
          });
        })}
      </svg>

      {/* Ring labels (top of each ring) */}
      {([
        { hop: 1, label: "DIRECT · RING 1" },
        { hop: 2, label: "TRANSITIVE · RING 2" },
        { hop: 3, label: "DOWNSTREAM · RING 3" },
      ] as const)
        .filter((r) => r.hop <= ringsMax)
        .map((r) => (
          <div
            key={r.label}
            className="absolute"
            style={{
              left: "50%",
              top: CENTER - RADII[r.hop] - 14,
              transform: "translate(-50%, -50%)",
              zIndex: 8,
            }}
          >
            <span
              className="px-2 py-0.5 rounded-md text-[9px] font-mono uppercase tracking-[0.2em]"
              style={{
                background: "var(--p-bg-main)",
                color: "var(--p-text-3)",
                border: "1px solid var(--p-border-subtle)",
              }}
            >
              {r.label}
            </span>
          </div>
        ))}

      {/* Center source node */}
      <div
        className="absolute flex flex-col items-center"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 20,
        }}
      >
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: 96,
            height: 96,
            background: `radial-gradient(circle at 30% 30%, ${sourceColor}, ${sourceColor}cc)`,
            boxShadow: `0 0 0 4px var(--p-bg-main), 0 0 0 5px ${sourceColor}88, 0 0 40px ${sourceColor}66`,
          }}
        >
          <Database size={32} style={{ color: "#FFF" }} />
        </div>
        <div className="mt-3 text-center">
          <div
            className="text-[9px] font-mono uppercase tracking-[0.2em] mb-1"
            style={{ color: "var(--p-text-3)" }}
          >
            SOURCE · {scenario.pgVersion} · {scenario.platform}
          </div>
          <Mono
            className="text-[12px] font-bold"
            style={{ color: "var(--p-text-1)" }}
          >
            {scenario.entity}
          </Mono>
        </div>
      </div>

      {/* Positioned ring chips */}
      {([1, 2, 3] as const).slice(0, ringsMax).map((hop) => {
        const nodes = ringNodes[hop];
        return nodes.map((n, i) => {
          const { x, y } = pos(hop, i, nodes.length);
          return (
            <div
              key={n.name}
              className="absolute"
              style={{
                left: x,
                top: y,
                transform: "translate(-50%, -50%)",
              }}
            >
              <RingChip node={n} hover={hover} setHover={setHover} />
            </div>
          );
        });
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Page
   ────────────────────────────────────────────── */

export default function BlastRadius() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initEntity = searchParams.get("entity") || "orders-pg-primary";
  const [selected, setSelected] = useState(
    BLAST_SCENARIOS[initEntity] ? initEntity : "orders-pg-primary"
  );
  const [search, setSearch] = useState(initEntity);
  const [ringsMax, setRingsMax] = useState(3);
  const [impactFilter, setImpactFilter] = useState<
    "all" | "critical" | "high" | "medium" | "low"
  >("all");
  const [appFilter, setAppFilter] = useState<string>("all");
  const [hover, setHover] = useState<AffectedNode | null>(null);

  const scenario = BLAST_SCENARIOS[selected] || BLAST_SCENARIOS["orders-pg-primary"];

  const visibleAffected = useMemo(() => {
    return scenario.affected.filter((n) => {
      if (n.hop > ringsMax) return false;
      if (impactFilter !== "all" && n.impact !== impactFilter) return false;
      if (appFilter !== "all" && n.app !== appFilter) return false;
      return true;
    });
  }, [scenario, ringsMax, impactFilter, appFilter]);

  const direct = scenario.affected.filter((a) => a.hop === 1).length;
  const transitive = scenario.affected.filter((a) => a.hop === 2).length;
  const downstream = scenario.affected.filter((a) => a.hop === 3).length;
  const totalEntities = scenario.affected.length;

  // Hop trace path (simulated): origin → direct ancestor → hovered or first critical
  const traceTarget = hover
    ? hover
    : scenario.affected.find((a) => a.impact === "critical" && a.hop === 2) ||
      scenario.affected[0];
  const hopTrace = useMemo(() => {
    if (!traceTarget) return [];
    if (traceTarget.hop === 1) return [scenario.entity, traceTarget.name];
    if (traceTarget.hop === 2) {
      const ancestor = scenario.affected.find((a) => a.hop === 1) || { name: "—" };
      return [scenario.entity, ancestor.name, traceTarget.name];
    }
    const ancestor1 = scenario.affected.find((a) => a.hop === 1) || { name: "—" };
    const ancestor2 = scenario.affected.find((a) => a.hop === 2) || { name: "—" };
    return [scenario.entity, ancestor1.name, ancestor2.name, traceTarget.name];
  }, [traceTarget, scenario]);

  return (
    <div className="flex flex-col w-full min-h-full">
      <PageHead
        eyebrow="Govern · Impact analysis"
        title="Blast Radius"
        subtitle="Pick any entity. Prism walks the graph and shows direct, transitive, and downstream impact in concentric rings. Click a node to trace its hop path back to source."
      />

      {/* Filter bar — search + rings slider + severity + app */}
      <div className="px-6 pb-4">
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-xl"
          style={{
            background: "var(--p-bg-card)",
            boxShadow: "var(--p-surface)",
          }}
        >
          {/* Search with critical pill */}
          <div className="flex items-center gap-2 flex-1 min-w-0 px-2">
            <Sliders size={12} style={{ color: "var(--p-text-3)" }} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (BLAST_SCENARIOS[e.target.value]) setSelected(e.target.value);
              }}
              placeholder="Search entity…"
              className="bg-transparent outline-none font-mono text-xs"
              style={{ color: "var(--p-text-1)", minWidth: 200 }}
            />
            <span
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono"
              style={{
                background: "var(--p-red-subtle)",
                color: "var(--p-red)",
                border: "1px solid var(--p-red)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--p-red)" }}
              />
              critical
            </span>
          </div>

          {/* Rings slider */}
          <div
            className="flex items-center gap-2 px-3 flex-shrink-0"
            style={{ borderLeft: "1px solid var(--p-border)" }}
          >
            <Layers size={11} style={{ color: "var(--p-text-3)" }} />
            <span
              className="text-[10px] font-mono uppercase tracking-wider"
              style={{ color: "var(--p-text-3)" }}
            >
              rings
            </span>
            <input
              type="range"
              min={1}
              max={4}
              value={ringsMax}
              onChange={(e) => setRingsMax(Math.min(3, parseInt(e.target.value)))}
              style={{ width: 80, accentColor: "var(--p-accent)" }}
            />
            <Mono
              className="text-[11px] w-4"
              style={{ color: "var(--p-text-2)" }}
            >
              {ringsMax}
            </Mono>
          </div>

          {/* Severity */}
          <div className="flex-shrink-0">
            <ChipSelect
              label="severity"
              value={impactFilter}
              onChange={(v) => setImpactFilter(v as typeof impactFilter)}
              options={[
                { value: "all", label: "all" },
                { value: "critical", label: "critical" },
                { value: "high", label: "high" },
                { value: "medium", label: "medium" },
                { value: "low", label: "low" },
              ]}
            />
          </div>

          {/* App */}
          <div className="flex-shrink-0">
            <ChipSelect
              label="app"
              value={appFilter}
              onChange={setAppFilter}
              options={[
                { value: "all", label: "all" },
                ...scenario.apps.map((a) => ({ value: a, label: a })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* Main grid — rings | sidebar */}
      <div className="grid grid-cols-12 gap-4 px-6 pb-6 flex-1">
        {/* Rings viz */}
        <div className="col-span-8 min-w-0">
          <Section eyebrow="Topology" title="Concentric blast rings">
            <div
              className="px-4 py-6 flex items-center justify-center"
              style={{ minHeight: 640 }}
            >
              <RingsViz
                scenario={scenario}
                hover={hover}
                setHover={setHover}
                ringsMax={ringsMax}
              />
            </div>
            {hover && (
              <div
                className="px-4 py-3"
                style={{ borderTop: "1px solid var(--p-border-subtle)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Mono
                    className="text-[12px] font-semibold"
                    style={{ color: "var(--p-text-1)" }}
                  >
                    {hover.name}
                  </Mono>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{
                      background: IMPACT_STYLE[hover.impact].bg,
                      color: IMPACT_STYLE[hover.impact].color,
                      border: `1px solid ${IMPACT_STYLE[hover.impact].border}`,
                    }}
                  >
                    {hover.impact}
                  </span>
                </div>
                <Mono className="text-[11px]" style={{ color: "var(--p-text-3)" }}>
                  hop {hover.hop} · {hover.team} · {hover.reason}
                </Mono>
              </div>
            )}
          </Section>
        </div>

        {/* Right sidebar */}
        <div className="col-span-4 flex flex-col gap-4 min-w-0">
          {/* IF THIS FAILS card */}
          <Section eyebrow="Impact projection" title="If this fails…">
            <div className="px-4 py-3 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div
                  className="rounded-lg px-2.5 py-2"
                  style={{ background: "var(--p-bg-elevated)" }}
                >
                  <Eyebrow>Total</Eyebrow>
                  <Mono
                    className="text-[18px] font-bold"
                    style={{ color: "var(--p-text-1)" }}
                  >
                    {totalEntities}
                  </Mono>
                  <div
                    className="text-[10px] font-mono"
                    style={{ color: "var(--p-text-3)" }}
                  >
                    entities
                  </div>
                </div>
                <div
                  className="rounded-lg px-2.5 py-2"
                  style={{ background: "var(--p-bg-elevated)" }}
                >
                  <Eyebrow>Direct</Eyebrow>
                  <Mono
                    className="text-[18px] font-bold"
                    style={{ color: "var(--p-red)" }}
                  >
                    {direct}
                  </Mono>
                  <div
                    className="text-[10px] font-mono"
                    style={{ color: "var(--p-text-3)" }}
                  >
                    hop 1
                  </div>
                </div>
                <div
                  className="rounded-lg px-2.5 py-2"
                  style={{ background: "var(--p-bg-elevated)" }}
                >
                  <Eyebrow>Transitive</Eyebrow>
                  <Mono
                    className="text-[18px] font-bold"
                    style={{ color: "var(--p-amber)" }}
                  >
                    {transitive}
                  </Mono>
                  <div
                    className="text-[10px] font-mono"
                    style={{ color: "var(--p-text-3)" }}
                  >
                    hop 2
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div
                  className="rounded-lg px-2.5 py-2"
                  style={{ background: "var(--p-bg-elevated)" }}
                >
                  <Eyebrow>Downstream</Eyebrow>
                  <Mono
                    className="text-[18px] font-bold"
                    style={{ color: "var(--p-accent)" }}
                  >
                    {downstream}
                  </Mono>
                  <div
                    className="text-[10px] font-mono"
                    style={{ color: "var(--p-text-3)" }}
                  >
                    hop 3
                  </div>
                </div>
                <div
                  className="rounded-lg px-2.5 py-2"
                  style={{ background: "var(--p-bg-elevated)" }}
                >
                  <Eyebrow>Revenue</Eyebrow>
                  <Mono
                    className="text-[16px] font-bold"
                    style={{ color: "var(--p-red)" }}
                  >
                    ${(scenario.revenuePerHour / 1000).toFixed(0)}k
                  </Mono>
                  <div
                    className="text-[10px] font-mono"
                    style={{ color: "var(--p-text-3)" }}
                  >
                    /hour
                  </div>
                </div>
                <div
                  className="rounded-lg px-2.5 py-2"
                  style={{ background: "var(--p-bg-elevated)" }}
                >
                  <Eyebrow>MTTR</Eyebrow>
                  <Mono
                    className="text-[18px] font-bold"
                    style={{ color: "var(--p-amber)" }}
                  >
                    {scenario.mttr}m
                  </Mono>
                  <div
                    className="text-[10px] font-mono"
                    style={{ color: "var(--p-text-3)" }}
                  >
                    expected
                  </div>
                </div>
              </div>

              <div
                className="flex items-start gap-2 p-2.5 rounded-lg"
                style={{
                  background: "var(--p-red-subtle)",
                  border: "1px solid var(--p-red)",
                }}
              >
                <AlertTriangle
                  size={12}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "var(--p-red)" }}
                />
                <span className="text-[11px]" style={{ color: "var(--p-text-2)" }}>
                  {scenario.summary}
                </span>
              </div>
            </div>
          </Section>

          {/* HOP TRACE — cyan-bordered iris card */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(34,211,238,0.06), rgba(34,211,238,0.02))",
              border: "1px solid var(--p-iris-border)",
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid var(--p-iris-border)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--p-iris)" }}
              />
              <span
                className="text-[10px] font-mono uppercase tracking-[0.2em]"
                style={{ color: "var(--p-iris)" }}
              >
                Hop trace
              </span>
              <span
                className="ml-auto text-[10px] font-mono"
                style={{ color: "var(--p-text-3)" }}
              >
                {hopTrace.length - 1} hop{hopTrace.length - 1 === 1 ? "" : "s"}
              </span>
            </div>
            <div className="px-4 py-3 space-y-1.5">
              {hopTrace.map((name, i) => (
                <div key={`${name}-${i}`} className="flex items-center gap-2">
                  <span
                    className="text-[9px] w-4 h-4 rounded-full inline-flex items-center justify-center font-mono"
                    style={{
                      background: i === 0 ? "var(--p-red-subtle)" : "var(--p-iris-subtle)",
                      color: i === 0 ? "var(--p-red)" : "var(--p-iris)",
                      border: `1px solid ${
                        i === 0 ? "var(--p-red)" : "var(--p-iris-border)"
                      }`,
                    }}
                  >
                    {i}
                  </span>
                  <Mono
                    className="text-[11px] flex-1 truncate"
                    style={{ color: "var(--p-text-2)" }}
                  >
                    {name}
                  </Mono>
                  {i < hopTrace.length - 1 && (
                    <ChevronRight
                      size={10}
                      style={{ color: "var(--p-text-3)" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* APPS IN BLAST */}
          <Section eyebrow="Apps in blast" title="Affected apps" count={scenario.apps.length}>
            <div className="px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                {scenario.apps.map((a) => {
                  const count = scenario.affected.filter((n) => n.app === a).length;
                  return (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px]"
                      style={{
                        background: "var(--p-accent-subtle)",
                        color: "var(--p-accent)",
                        border: "1px solid var(--p-accent-border)",
                        fontFamily: '"JetBrains Mono", monospace',
                      }}
                    >
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{ background: "var(--p-accent)" }}
                      />
                      {a}
                      <span style={{ color: "var(--p-text-3)" }}>· {count}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* Visible affected list (filtered) */}
          <Section
            eyebrow={`${visibleAffected.length} of ${scenario.affected.length}`}
            title="Affected entities"
          >
            <div className="max-h-[300px] overflow-y-auto">
              {visibleAffected.map((a, i) => {
                const aColor = ENTITY_TYPE_COLORS[a.type] || "var(--p-text-3)";
                const imp = IMPACT_STYLE[a.impact];
                return (
                  <div
                    key={a.name}
                    onMouseEnter={() => setHover(a)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() =>
                      navigate(
                        `/blast-radius?entity=${
                          BLAST_SCENARIOS[a.name] ? a.name : selected
                        }`
                      )
                    }
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors"
                    style={{
                      borderBottom:
                        i < visibleAffected.length - 1
                          ? "1px solid var(--p-border-subtle)"
                          : "none",
                      background:
                        hover?.name === a.name
                          ? "var(--p-bg-elevated)"
                          : "transparent",
                    }}
                  >
                    <Mono
                      className="text-[9px] w-5 text-center py-0.5 rounded flex-shrink-0"
                      style={{
                        background:
                          a.hop === 1
                            ? "var(--p-red-subtle)"
                            : a.hop === 2
                            ? "var(--p-amber-subtle)"
                            : "var(--p-accent-subtle)",
                        color:
                          a.hop === 1
                            ? "var(--p-red)"
                            : a.hop === 2
                            ? "var(--p-amber)"
                            : "var(--p-accent)",
                      }}
                    >
                      {a.hop}
                    </Mono>
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: aColor }}
                    />
                    <Mono
                      className="text-[11px] truncate flex-1"
                      style={{ color: "var(--p-text-2)" }}
                    >
                      {a.name}
                    </Mono>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-mono flex-shrink-0"
                      style={{
                        background: imp.bg,
                        color: imp.color,
                        border: `1px solid ${imp.border}`,
                      }}
                    >
                      {a.impact}
                    </span>
                  </div>
                );
              })}
              {visibleAffected.length === 0 && (
                <div
                  className="px-4 py-6 text-center text-xs"
                  style={{ color: "var(--p-text-3)" }}
                >
                  No entities for current filters.
                </div>
              )}
            </div>
          </Section>

          {/* Teams paged */}
          <Section eyebrow="Ownership" title="Teams paged">
            <div className="px-4 py-3 space-y-1.5">
              {scenario.teams.map((t) => (
                <div key={t} className="flex items-center justify-between">
                  <Mono className="text-[11px]" style={{ color: "var(--p-text-2)" }}>
                    {t}
                  </Mono>
                  <StatusDot status="warn" size={6} pulse />
                </div>
              ))}
            </div>
          </Section>

          {/* Iris quick ask */}
          <IrisQuickAsk
            context={scenario.entity}
            prompts={[
              `Summarize the blast radius for ${scenario.entity}`,
              `What's the safest rollback order?`,
              `Which teams should I notify first?`,
              `Recent incidents tied to ${scenario.entity}`,
            ]}
          />
        </div>
      </div>
    </div>
  );
}
