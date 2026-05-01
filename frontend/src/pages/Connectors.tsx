import { Plus, RefreshCw, Sparkles, Zap } from "lucide-react";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";
import PageHead from "../components/common/PageHead";
import Section, { Mono } from "../components/common/Section";
import MetricCard from "../components/dashboard/MetricCard";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../stores/chat";

/* ── Types & data ───────────────────────────────────────── */
type CnStatus = "ok" | "warn" | "crit";

interface Connector {
  id: string;
  name: string;
  cat: string;
  col: string;
  status: CnStatus;
  ents: number;
  sync: string;
  latency: number[];
  note?: string;
}

const CONS: Connector[] = [
  { id: "kubernetes", name: "Kubernetes", cat: "Orchestration",   col: "#3B82F6", status: "ok",   ents: 312, sync: "2s ago",  latency: [4,5,4,5,5,4,4,5,4,5,4,4] },
  { id: "github",     name: "GitHub",     cat: "VCS",             col: "#24292F", status: "ok",   ents: 487, sync: "8s ago",  latency: [8,9,7,8,8,7,9,8,8,8,7,8] },
  { id: "datadog",    name: "Datadog",    cat: "Observability",   col: "#632CA6", status: "ok",   ents: 156, sync: "12s ago", latency: [12,11,13,12,12,11,12,13,12,11,12,12] },
  { id: "argocd",     name: "ArgoCD",     cat: "GitOps",          col: "#EC4899", status: "ok",   ents: 28,  sync: "4s ago",  latency: [4,4,5,4,3,4,5,4,4,4,3,4] },
  { id: "jira",       name: "Jira",       cat: "Work",            col: "#0052CC", status: "ok",   ents: 1284,sync: "18s ago", latency: [18,19,17,20,18,16,18,19,18,17,18,18] },
  { id: "snowflake",  name: "Snowflake",  cat: "Warehouse",       col: "#29B5E8", status: "ok",   ents: 112, sync: "2m ago",  latency: [115,120,125,118,122,119,120,121,118,120,122,120] },
  { id: "aws",        name: "AWS",        cat: "Cloud",           col: "#FF9900", status: "warn", ents: 238, sync: "1m ago",  latency: [30,32,34,40,45,52,58,62,60,62,62,62], note: "auth pending" },
  { id: "okta",       name: "Okta",       cat: "Identity",        col: "#007DC1", status: "ok",   ents: 47,  sync: "30s ago", latency: [29,30,31,30,29,30,31,30,30,29,30,30] },
  { id: "confluence", name: "Confluence", cat: "Docs",            col: "#172B4D", status: "ok",   ents: 482, sync: "9m ago",  latency: [480,520,540,538,540,540,540,540,540,540,540,540] },
  { id: "jenkins",    name: "Jenkins",    cat: "CI",              col: "#D33833", status: "ok",   ents: 73,  sync: "14s ago", latency: [13,14,15,14,13,14,15,14,13,14,14,14] },
  { id: "slack",      name: "Slack",      cat: "Comms",           col: "#4A154B", status: "ok",   ents: 88,  sync: "1s ago",  latency: [1,1,1,2,1,1,1,1,1,1,1,1] },
  { id: "splunk",     name: "Splunk",     cat: "Logs",            col: "#FF375F", status: "crit", ents: 0,   sync: "8m ago",  latency: [80,60,40,20,10,5,2,0,0,0,0,0], note: "ingest blocked" },
  { id: "vault",      name: "Vault",      cat: "Secrets",         col: "#6C4FBB", status: "ok",   ents: 92,  sync: "40s ago", latency: [38,40,41,40,39,40,41,40,39,40,40,40] },
  { id: "terraform",  name: "Terraform",  cat: "IaC",             col: "#7B42BC", status: "ok",   ents: 68,  sync: "5m ago",  latency: [295,300,302,300,298,300,302,300,299,300,301,300] },
  { id: "openshift",  name: "OpenShift",  cat: "Orchestration",   col: "#EE0000", status: "ok",   ents: 54,  sync: "22s ago", latency: [21,22,23,22,21,22,23,22,21,22,22,22] },
  { id: "jfrog",      name: "JFrog",      cat: "Artifacts",       col: "#41BF47", status: "ok",   ents: 89,  sync: "1m ago",  latency: [60,62,61,60,62,63,60,61,62,60,62,61] },
];

interface SyncEvent { t: string; name: string; event: string; status: CnStatus }
const EVENTS: SyncEvent[] = [
  { t: "19:42", name: "GitHub",    event: "12 repos · 487 entities · 8 ms",         status: "ok" },
  { t: "19:41", name: "Datadog",   event: "metric scrape · 156 services",            status: "ok" },
  { t: "19:38", name: "Splunk",    event: "ingest backoff · connection reset",       status: "crit" },
  { t: "19:36", name: "AWS",       event: "IAM token refresh · auth re-challenge",   status: "warn" },
  { t: "19:34", name: "Snowflake", event: "warehouse sync · 112 tables · 23 ms",     status: "ok" },
  { t: "19:32", name: "Okta",      event: "47 users · 19 groups synced",             status: "ok" },
  { t: "19:28", name: "Vault",     event: "92 secrets inventory · no drift",         status: "ok" },
];

/* ── Helpers ────────────────────────────────────────────── */
function sparkPath(values: number[], w: number, h: number, pad = 2) {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = pad + ((w - 2 * pad) * i) / (values.length - 1);
      const y = h - pad - ((v - min) / range) * (h - 2 * pad);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 140;
  const h = 24;
  const path = sparkPath(values, w, h, 2);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="my-2"
      style={{ width: "100%", height: 24 }}
    >
      <path d={path} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Pill({ status }: { status: CnStatus }) {
  const map = {
    ok:   { color: "var(--p-green)", bg: "var(--p-green-subtle)", label: "live" },
    warn: { color: "var(--p-amber)", bg: "var(--p-amber-subtle)", label: "auth" },
    crit: { color: "var(--p-red)",   bg: "var(--p-red-subtle)",   label: "down" },
  } as const;
  const cfg = map[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

/* ── Connector card ─────────────────────────────────────── */
function ConnectorCard({ c, onSync }: { c: Connector; onSync: (id: string) => void }) {
  const sparkColor =
    c.status === "ok"   ? "var(--p-green)" :
    c.status === "warn" ? "var(--p-amber)" : "var(--p-red)";

  const ringColor =
    c.status === "warn" ? "var(--p-amber)" :
    c.status === "crit" ? "var(--p-red)"   : undefined;

  return (
    <div
      className="rounded-xl p-4 transition-all relative overflow-hidden"
      style={{
        background: "var(--p-bg-card)",
        boxShadow: ringColor
          ? `var(--p-surface), inset 0 0 0 1px ${ringColor}`
          : "var(--p-surface)",
      }}
      onClick={() => onSync(c.id)}
      role="button"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold flex-shrink-0"
          style={{ background: c.col, color: "#fff", fontFamily: '"Geist", system-ui, sans-serif' }}
        >
          {c.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold truncate" style={{ color: "var(--p-text-1)" }}>{c.name}</div>
          <div className="text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>{c.cat}</div>
        </div>
        <Pill status={c.status} />
      </div>

      <Sparkline values={c.latency} color={sparkColor} />

      <div
        className="grid grid-cols-2 gap-2 pt-3"
        style={{ borderTop: "1px solid var(--p-border-subtle)" }}
      >
        <div>
          <div className="text-[9.5px] font-mono uppercase tracking-wider" style={{ color: "var(--p-text-3)" }}>Records</div>
          <Mono className="text-[12.5px] font-semibold mt-0.5 block" style={{ color: "var(--p-text-1)" }}>
            {c.ents > 0 ? c.ents.toLocaleString() : "—"}
          </Mono>
        </div>
        <div>
          <div className="text-[9.5px] font-mono uppercase tracking-wider" style={{ color: "var(--p-text-3)" }}>Sync</div>
          <Mono className="text-[12.5px] font-semibold mt-0.5 block" style={{ color: "var(--p-text-1)" }}>
            {c.sync}
          </Mono>
        </div>
      </div>

      {c.note && (
        <div
          className="mt-2 text-[10px] font-mono"
          style={{ color: c.status === "crit" ? "var(--p-red)" : "var(--p-amber)" }}
        >
          ⚠ {c.note}
        </div>
      )}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function Connectors() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const toggleChat = useChatStore((s) => s.toggleChat);
  const isOpen = useChatStore((s) => s.isOpen);

  const { data } = useQuery({
    queryKey: ["connectors"],
    queryFn: () => apiClient.get("/api/v1/connectors").then((r) => r.data),
    staleTime: 30_000,
    retry: false,
  });

  const { mutate: triggerSync } = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/v1/connectors/${id}/sync`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connectors"] }),
  });

  const connectors: Connector[] = useMemo(() => {
    const apiPlatforms = (data?.platforms as Array<{ id: string; entityCount?: number; status?: string; lastSynced?: string }> | undefined) || [];
    if (!apiPlatforms.length) return CONS;
    // Merge API counts into rich CONS template (so we keep UX even if API responds)
    return CONS.map((c) => {
      const m = apiPlatforms.find((p) => p.id === c.id);
      if (!m) return c;
      const status: CnStatus =
        m.status === "synced"  ? "ok" :
        m.status === "syncing" ? "warn" :
        m.status === "error"   ? "crit" : c.status;
      return {
        ...c,
        ents: typeof m.entityCount === "number" ? m.entityCount : c.ents,
        sync: m.lastSynced || c.sync,
        status,
      };
    });
  }, [data]);

  const totalEntities = connectors.reduce((a, c) => a + c.ents, 0);
  const failed = connectors.filter((c) => c.status === "crit").length;
  const totalConnected = connectors.length;

  const triggerIris = (q: string) => {
    void q;
    if (!isOpen) toggleChat();
  };

  // Entity-counts bars — sorted desc, top 8
  const sortedByEnts = [...connectors].sort((a, b) => b.ents - a.ents).slice(0, 8);
  const maxEnts = sortedByEnts[0]?.ents || 1;

  return (
    <div className="flex flex-col w-full min-h-full">
      <PageHead
        eyebrow={`INTELLIGENCE · ${connectors.length} PLATFORMS`}
        title="Connectors"
        subtitle="Each connector pulls one Perspective into the CPT graph. Read-only by default. Resolution happens server-side — your data never leaves your network."
        actions={
          <>
            <button
              onClick={() => triggerIris("Which connectors have degraded health and what is the impact on entity resolution?")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "transparent", color: "var(--p-text-2)", boxShadow: "var(--p-surface)", fontFamily: '"Geist", system-ui, sans-serif' }}
            >
              <RefreshCw size={12} /> Sync all
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "var(--p-accent)", color: "var(--p-text-inv)", fontFamily: '"Geist", system-ui, sans-serif' }}
            >
              <Plus size={12} /> Add connector
            </button>
          </>
        }
      />

      {/* Metric tiles */}
      <div className="grid grid-cols-4 gap-3 px-6 pb-4">
        <MetricCard label="Connected" value={`${totalConnected}/${totalConnected}`} />
        <MetricCard label="Avg sync"  value="23" unit="s" />
        <MetricCard label="Entities pulled" value={totalEntities.toLocaleString()} trend={218} trendDirection="up" />
        <MetricCard label="Failed" value={failed} trendDirection={failed > 0 ? "down" : "neutral"} />
      </div>

      {/* Connector cards grid */}
      <div className="px-6 pb-5">
        <div className="grid grid-cols-3 gap-3">
          {connectors.map((c) => (
            <ConnectorCard key={c.id} c={c} onSync={triggerSync} />
          ))}
          <button
            className="rounded-xl px-4 py-4 flex flex-col items-center justify-center gap-2 transition-all min-h-[160px]"
            style={{
              background: "var(--p-bg-card)",
              boxShadow: "inset 0 0 0 1px var(--p-border)",
              color: "var(--p-text-3)",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = "var(--p-accent)";
              el.style.boxShadow = "inset 0 0 0 1px var(--p-accent-border)";
              el.style.background = "var(--p-accent-subtle)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = "var(--p-text-3)";
              el.style.boxShadow = "inset 0 0 0 1px var(--p-border)";
              el.style.background = "var(--p-bg-card)";
            }}
          >
            <Plus size={20} />
            Add connector
          </button>
        </div>
      </div>

      {/* Bottom 2-col + sidebar */}
      <div className="grid grid-cols-12 gap-4 px-6 pb-6">
        <div className="col-span-9 flex flex-col gap-3">
          <Section
            eyebrow="SYNC"
            title="Sync event log"
            actions={
              <span className="inline-flex items-center gap-1 text-[10px] font-mono" style={{ color: "var(--p-iris)" }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--p-iris)" }} />
                live
              </span>
            }
          >
            <div className="flex flex-col">
              {EVENTS.map((e, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderBottom: i < EVENTS.length - 1 ? "1px solid var(--p-border-subtle)" : undefined }}
                >
                  <Mono className="text-[10.5px] flex-shrink-0" style={{ color: "var(--p-text-3)", width: 44 }}>{e.t}</Mono>
                  <Mono className="text-[11px] font-semibold flex-shrink-0" style={{ color: "var(--p-text-1)", width: 90 }}>{e.name}</Mono>
                  <Mono className="text-[12px] flex-1 min-w-0 truncate" style={{ color: "var(--p-text-2)" }}>{e.event}</Mono>
                  <Pill status={e.status} />
                </div>
              ))}
            </div>
          </Section>

          <Section eyebrow="DISTRIBUTION" title="Entity counts by connector">
            <div className="flex flex-col">
              {sortedByEnts.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderBottom: i < sortedByEnts.length - 1 ? "1px solid var(--p-border-subtle)" : undefined }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.col }} />
                  <Mono className="text-[12px] flex-shrink-0" style={{ color: "var(--p-text-1)", width: 110 }}>{c.name}</Mono>
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--p-bg-elevated)" }}
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${Math.round((c.ents / maxEnts) * 100)}%`, background: c.col }}
                    />
                  </div>
                  <Mono className="text-[11.5px] flex-shrink-0" style={{ color: "var(--p-text-2)", minWidth: 56, textAlign: "right" }}>
                    {c.ents.toLocaleString()}
                  </Mono>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Right sidebar */}
        <div className="col-span-3 flex flex-col gap-3">
          <Section eyebrow="CPT" title="Authority matrix">
            <div className="flex flex-col px-4 py-2">
              {[
                { k: "replica_count",  v: "k8s · 1.0" },
                { k: "p99_latency",    v: "datadog · 1.0" },
                { k: "api_contract",   v: "apigw · 1.0" },
                { k: "source_code",    v: "github · 1.0" },
                { k: "sast_findings",  v: "github · 1.0" },
                { k: "secret_path",    v: "vault · 1.0" },
              ].map((r, i, arr) => (
                <div
                  key={r.k}
                  className="flex items-center justify-between py-1.5"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--p-border-subtle)" : undefined }}
                >
                  <Mono className="text-[11px]" style={{ color: "var(--p-text-2)" }}>{r.k}</Mono>
                  <Mono className="text-[11px] font-semibold" style={{ color: "var(--p-text-1)" }}>{r.v}</Mono>
                </div>
              ))}
            </div>
          </Section>

          <Section eyebrow="INPUT" title="Dual-channel">
            <div className="flex flex-col px-4 py-3 gap-2">
              <div className="text-[10.5px] font-mono leading-relaxed" style={{ color: "var(--p-text-2)" }}>
                CPT reads from two channels simultaneously:
              </div>
              <div className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid var(--p-border-subtle)" }}>
                <Mono className="text-[11px] font-semibold" style={{ color: "var(--p-accent)" }}>CH1 · Live APIs</Mono>
                <Mono className="text-[11px]" style={{ color: "var(--p-text-2)" }}>WHAT exists now</Mono>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <Mono className="text-[11px] font-semibold" style={{ color: "var(--p-iris)" }}>CH2 · Documents</Mono>
                <Mono className="text-[11px]" style={{ color: "var(--p-text-2)" }}>WHY + WHO owns it</Mono>
              </div>
              <div className="text-[10px] font-mono mt-1" style={{ color: "var(--p-text-3)" }}>
                Hungarian algorithm aligns both perspectives into one canonical graph.
              </div>
            </div>
          </Section>

          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--p-iris-subtle)", boxShadow: "inset 0 0 0 1px var(--p-iris-border)" }}
          >
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--p-iris-border)" }}>
              <Sparkles size={12} style={{ color: "var(--p-iris)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--p-iris)", fontFamily: '"Geist", system-ui, sans-serif' }}>
                Ask Iris
              </span>
              <button
                onClick={() => navigate("/iris")}
                className="ml-auto text-[10px] font-mono uppercase tracking-wider"
                style={{ color: "var(--p-text-3)" }}
              >
                full chat →
              </button>
            </div>
            <div className="flex flex-col gap-1.5 p-3">
              {[
                "Changes since last Snowflake sync",
                "Splunk backoff blast radius",
                "Why is AWS in auth-pending state?",
              ].map((p) => (
                <button
                  key={p}
                  onClick={() => triggerIris(p)}
                  className="text-left px-2.5 py-2 rounded-md text-[11px] font-mono transition-colors"
                  style={{ background: "var(--p-bg-card)", color: "var(--p-iris)" }}
                >
                  › {p}
                </button>
              ))}
            </div>
            <div
              className="px-4 py-2 text-[10px] font-mono inline-flex items-center gap-1"
              style={{ color: "var(--p-text-3)", borderTop: "1px solid var(--p-iris-border)" }}
            >
              <Zap size={10} /> CPT engine grounded
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
