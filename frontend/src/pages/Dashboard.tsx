import {
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  Box,
  CheckCircle,
  Database,
  Layers,
  Shield,
  Sparkles,
  Triangle,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
import { useChatStore } from "../stores/chat";

/* ──────────────────────────────────────────────
   Page head
   ────────────────────────────────────────────── */
function PageHead() {
  return (
    <div className="flex items-end justify-between gap-6 mb-6">
      <div className="min-w-0">
        <div
          className="text-[10px] font-mono uppercase tracking-[0.14em] mb-2"
          style={{ color: "var(--p-text-3)" }}
        >
          OVERVIEW · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }).toUpperCase()}
        </div>
        <h1
          className="leading-tight tracking-tight"
          style={{
            fontFamily: '"Instrument Sans", system-ui, sans-serif',
            fontSize: 30,
            fontWeight: 700,
            color: "var(--p-text-1)",
            letterSpacing: "-0.025em",
            margin: 0,
          }}
        >
          Good morning, Jordan
        </h1>
        <p className="text-[14px] mt-2" style={{ color: "var(--p-text-2)" }}>
          Your graph is <strong style={{ color: "var(--p-text-1)" }}>97.4% resolved</strong>.{" "}
          <strong style={{ color: "#FCA5A5" }}>3 incidents</strong> need attention,{" "}
          <strong style={{ color: "#7DD3FC" }}>12 follow-ups</strong> from Iris are waiting.
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Metric tile with eyebrow + icon + big number + footer
   ────────────────────────────────────────────── */
function MetricTile({
  label,
  value,
  unit,
  footer,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: string | number;
  unit?: string;
  footer: React.ReactNode;
  icon: React.ComponentType<any>;
  iconColor: string;
}) {
  return (
    <div
      className="rounded-xl px-5 py-4 flex flex-col"
      style={{
        background: "var(--p-bg-card)",
        boxShadow: "var(--p-surface)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className="text-[10px] font-mono uppercase tracking-[0.14em]"
          style={{ color: "var(--p-text-3)" }}
        >
          {label}
        </span>
        <div
          className="rounded-md flex items-center justify-center"
          style={{
            width: 26,
            height: 26,
            background: `${iconColor}18`,
            color: iconColor,
          }}
        >
          <Icon size={13} />
        </div>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span
          className="font-mono font-semibold leading-none"
          style={{
            fontSize: 30,
            color: "var(--p-text-1)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[14px] font-mono" style={{ color: "var(--p-text-3)" }}>
            {unit}
          </span>
        )}
      </div>
      <div className="text-[11px] font-mono" style={{ color: "var(--p-text-3)" }}>
        {footer}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Iris hero card
   ────────────────────────────────────────────── */
const IRIS_PROMPTS = [
  "What changed in the orders system in the last 24h?",
  "If orders-pg-primary fails, what breaks?",
  "Generate SOC 2 evidence for CC6.1 last quarter",
  "Which services run vulnerable xz-utils?",
];

function IrisHero() {
  const setOpen = useChatStore((s) => s.toggleChat);
  const isOpen = useChatStore((s) => s.isOpen);
  const ask = (q: string) => {
    if (!isOpen) setOpen();
    void q;
  };

  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(34,211,238,0.05) 0%, rgba(34,211,238,0.01) 100%)",
        border: "1px solid var(--p-iris-border)",
        boxShadow: "0 0 0 1px var(--p-iris-border), 0 0 60px var(--p-iris-glow)",
      }}
    >
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: -100,
          top: -50,
          width: 400,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 65%)",
          filter: "blur(20px)",
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--p-iris)", animation: "pulse 2s infinite" }} />
          <span className="text-[10px] font-mono uppercase tracking-[0.14em]" style={{ color: "var(--p-iris)" }}>
            IRIS · GROUNDED COPILOT
          </span>
        </div>
        <h2
          className="leading-tight tracking-tight mb-2"
          style={{
            fontFamily: '"Instrument Sans", system-ui, sans-serif',
            fontSize: 22,
            fontWeight: 600,
            color: "var(--p-text-1)",
            letterSpacing: "-0.02em",
          }}
        >
          Ask anything. Get a citation, not a hallucination.
        </h2>
        <p className="text-[13px] mb-5" style={{ color: "var(--p-text-2)" }}>
          Every Iris answer is anchored to the canonical graph and your indexed docs. Try one of these — or open the chat with the spark icon.
        </p>

        <div className="space-y-2">
          {IRIS_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => ask(p)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-md transition-colors text-left"
              style={{
                background: "var(--p-bg-deep)",
                border: "1px solid var(--p-border)",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 12,
                color: "var(--p-text-1)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "var(--p-iris-subtle)";
                el.style.borderColor = "var(--p-iris-border)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "var(--p-bg-deep)";
                el.style.borderColor = "var(--p-border)";
              }}
            >
              <span>
                <span style={{ color: "var(--p-text-3)" }}>›</span> {p}
              </span>
              <ArrowRight size={12} style={{ color: "var(--p-iris)" }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   System health donut
   ────────────────────────────────────────────── */
function SystemHealth({ resolved = 97.4 }: { resolved?: number }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (resolved / 100) * c;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col"
      style={{
        background: "var(--p-bg-card)",
        boxShadow: "var(--p-surface)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[12px] font-semibold" style={{ color: "var(--p-text-1)" }}>
          System health
        </span>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono"
          style={{
            background: "rgba(52,211,153,0.10)",
            color: "var(--p-green)",
            border: "1px solid rgba(52,211,153,0.25)",
          }}
        >
          <span className="w-1 h-1 rounded-full" style={{ background: "var(--p-green)" }} />
          LIVE
        </span>
      </div>

      <div className="flex items-center gap-4 mb-5">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--p-bg-elevated)" strokeWidth="8" />
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="var(--p-iris)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
            style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,0.45))" }}
          />
        </svg>
        <div>
          <div className="flex items-baseline">
            <span
              className="font-mono font-semibold leading-none"
              style={{ fontSize: 32, color: "var(--p-text-1)", fontVariantNumeric: "tabular-nums" }}
            >
              {resolved}
            </span>
            <span className="text-[16px] font-mono" style={{ color: "var(--p-text-3)" }}>
              %
            </span>
          </div>
          <div className="text-[11px] font-mono mt-1" style={{ color: "var(--p-text-3)" }}>
            resolved & green
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { label: "healthy",    value: "1,632", color: "var(--p-green)" },
          { label: "degraded",   value: "7",     color: "var(--p-amber)" },
          { label: "critical",   value: "3",     color: "var(--p-red)"   },
          { label: "unresolved", value: "33",    color: "var(--p-text-3)" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: row.color }} />
              <span className="text-[11px] font-mono" style={{ color: "var(--p-text-2)" }}>
                {row.label}
              </span>
            </div>
            <span
              className="text-[12px] font-mono font-semibold"
              style={{ color: "var(--p-text-1)", fontVariantNumeric: "tabular-nums" }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Activity feed
   ────────────────────────────────────────────── */
type ActivityKind = "incident" | "iris" | "deploy" | "vuln" | "compliance" | "connector";

const ACTIVITY: { kind: ActivityKind; icon: string; iconBg: string; iconColor: string; title: string; meta: string[]; ago: string }[] = [
  {
    kind: "incident",
    icon: "!",
    iconBg: "rgba(248,113,113,0.12)",
    iconColor: "#F87171",
    title: "orders-pg-primary · CPU sustained > 90% for 8m",
    meta: ["service: orders", "blast: 17 entities", "PD-3122"],
    ago: "4m ago",
  },
  {
    kind: "iris",
    icon: "★",
    iconBg: "rgba(34,211,238,0.10)",
    iconColor: "#22D3EE",
    title: "Iris flagged: failover candidate orders-pg-replica is 12s behind WAL",
    meta: ["confidence 94%", "grounded"],
    ago: "6m ago",
  },
  {
    kind: "deploy",
    icon: "↑",
    iconBg: "rgba(94,106,210,0.12)",
    iconColor: "#9DA5F5",
    title: "orders-api-v2 · v3.1.0 → v3.1.1 deployed by ci-bot",
    meta: ["rolled to 12 pods", "passed canary"],
    ago: "14m ago",
  },
  {
    kind: "vuln",
    icon: "⚠",
    iconBg: "rgba(251,191,36,0.12)",
    iconColor: "#FCD34D",
    title: "CVE-2024-3094 · xz-utils backdoor matched on 7 services",
    meta: ["severity 10.0", "fix: xz 5.4.6"],
    ago: "2h ago",
  },
  {
    kind: "compliance",
    icon: "✓",
    iconBg: "rgba(52,211,153,0.10)",
    iconColor: "#34D399",
    title: "SOC 2 CC6.1 · access review passed for 47 users",
    meta: ["Okta evidence pulled", "2026-Q1"],
    ago: "3h ago",
  },
  {
    kind: "connector",
    icon: "◆",
    iconBg: "rgba(167,139,250,0.10)",
    iconColor: "#A78BFA",
    title: "Connector sync: Datadog · pulled 156 monitors, 14 deltas",
    meta: ["9s latency"],
    ago: "5h ago",
  },
  {
    kind: "iris",
    icon: "★",
    iconBg: "rgba(34,211,238,0.10)",
    iconColor: "#22D3EE",
    title: "Iris answered 24 questions today · 0 hallucinations · all grounded",
    meta: ["avg latency 1.4s"],
    ago: "today",
  },
];

function ActivityFeed() {
  return (
    <div
      className="rounded-2xl"
      style={{
        background: "var(--p-bg-card)",
        boxShadow: "var(--p-surface)",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--p-border-subtle)" }}
      >
        <span className="text-[13px] font-semibold" style={{ color: "var(--p-text-1)" }}>
          Activity · last 24h
        </span>
        <div className="flex items-center gap-1">
          {["ALL", "INCIDENTS", "IRIS", "DEPLOYS"].map((tab, i) => (
            <button
              key={tab}
              className="text-[10px] font-mono uppercase tracking-[0.14em] px-2.5 py-1 rounded transition-colors"
              style={{
                color: i === 0 ? "var(--p-text-1)" : "var(--p-text-3)",
                background: i === 0 ? "var(--p-bg-elevated)" : "transparent",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--p-border-subtle)" }}>
        {ACTIVITY.map((a, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-5 py-3.5 transition-colors cursor-pointer"
            style={{ borderBottom: i < ACTIVITY.length - 1 ? "1px solid var(--p-border-subtle)" : "none" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.015)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <div
              className="rounded-lg flex items-center justify-center flex-shrink-0 font-mono font-semibold"
              style={{
                width: 28,
                height: 28,
                background: a.iconBg,
                color: a.iconColor,
                fontSize: 13,
              }}
            >
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px]" style={{ color: "var(--p-text-1)" }}>
                {a.title}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                {a.meta.map((m, j) => (
                  <span key={j} className="text-[11px] font-mono" style={{ color: "var(--p-text-3)" }}>
                    {j > 0 && <span className="mr-1.5">·</span>}
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-[11px] font-mono flex-shrink-0" style={{ color: "var(--p-text-3)" }}>
              {a.ago}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Page
   ────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const setOpen = useChatStore((s) => s.toggleChat);
  const isOpen = useChatStore((s) => s.isOpen);

  const { data: metrics } = useQuery({
    queryKey: ["health-dashboard"],
    queryFn: () => apiClient.get("/api/v1/health/dashboard").then((r) => r.data),
    staleTime: 60_000,
  });

  void metrics;
  void navigate;

  return (
    <div className="px-7 py-6 w-full">
      <div className="flex items-end justify-between gap-6 mb-6">
        <PageHead />
        <div className="flex items-center gap-2 mb-2 flex-shrink-0">
          <button
            className="px-3 py-1.5 rounded-md text-[12px] font-medium"
            style={{
              background: "transparent",
              color: "var(--p-text-2)",
              boxShadow: "var(--p-surface)",
              fontFamily: '"Instrument Sans", system-ui, sans-serif',
            }}
          >
            Customize
          </button>
          <button
            onClick={() => { if (!isOpen) setOpen(); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold"
            style={{
              background: "var(--p-iris-subtle)",
              color: "var(--p-iris)",
              border: "1px solid var(--p-iris-border)",
              boxShadow: "0 0 18px var(--p-iris-glow)",
              fontFamily: '"Instrument Sans", system-ui, sans-serif',
            }}
          >
            <Sparkles size={12} />
            Ask Iris
          </button>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricTile
          label="ENTITIES"
          value="1,675"
          icon={Box}
          iconColor="#9DA5F5"
          footer={
            <span>
              <strong style={{ color: "var(--p-green)" }}>+142</strong>{" "}
              <span style={{ color: "var(--p-text-3)" }}>this week</span>
            </span>
          }
        />
        <MetricTile
          label="OPEN INCIDENTS"
          value="3"
          icon={Triangle}
          iconColor="#F87171"
          footer={
            <span>
              <strong style={{ color: "#FCA5A5" }}>1 critical</strong>
              <span style={{ color: "var(--p-text-3)" }}> · 2 high</span>
            </span>
          }
        />
        <MetricTile
          label="SOC 2 CONTROLS"
          value="142"
          unit="/147"
          icon={CheckCircle}
          iconColor="#34D399"
          footer={
            <span>
              <strong style={{ color: "var(--p-green)" }}>+3</strong>{" "}
              <span style={{ color: "var(--p-text-3)" }}>resolved this week</span>
            </span>
          }
        />
        <MetricTile
          label="IRIS ANSWERS"
          value="214"
          icon={Sparkles}
          iconColor="#22D3EE"
          footer={
            <span style={{ color: "var(--p-iris)" }}>0 hallucinations</span>
          }
        />
      </div>

      {/* Iris hero + System health */}
      <div className="grid grid-cols-[1fr_360px] gap-3 mb-5">
        <IrisHero />
        <SystemHealth />
      </div>

      {/* Activity */}
      <ActivityFeed />
    </div>
  );
}

void Database; void AlertTriangle; void Layers; void Shield; void ArrowUp; void Zap;
