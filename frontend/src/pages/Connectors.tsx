import {
  AlertTriangle, Check, ChevronRight, ExternalLink, Plus, RefreshCw,
  Settings, Sparkles, X, Zap, Eye, EyeOff,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";
import PageHead from "../components/common/PageHead";
import Section, { Mono } from "../components/common/Section";
import MetricCard from "../components/dashboard/MetricCard";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../stores/chat";

/* ── Types ──────────────────────────────────────────────── */
type CnStatus = "ok" | "warn" | "crit";

interface Connector {
  id: string; name: string; cat: string; col: string;
  status: CnStatus; ents: number; sync: string; latency: number[]; note?: string;
}

interface FieldDef {
  key: string; label: string; type: "text" | "password" | "textarea" | "checkbox" | "number" | "select";
  placeholder?: string; required?: boolean; options?: string[];
}

interface ConnectorConfig {
  connector_id: string; auth_method: string;
  fields: FieldDef[]; values: Record<string, string>;
  is_configured: boolean;
}

interface CatalogItem {
  id: string; name: string; category: string; icon_color: string; auth_methods: string[];
}

/* ── Static display data ─────────────────────────────────── */
const CONS: Connector[] = [
  { id: "kubernetes", name: "Kubernetes", cat: "Orchestration",  col: "#3B82F6", status: "ok",   ents: 312, sync: "2s ago",  latency: [4,5,4,5,5,4,4,5,4,5,4,4] },
  { id: "github",     name: "GitHub",     cat: "VCS",            col: "#24292F", status: "ok",   ents: 487, sync: "8s ago",  latency: [8,9,7,8,8,7,9,8,8,8,7,8] },
  { id: "datadog",    name: "Datadog",    cat: "Observability",  col: "#632CA6", status: "ok",   ents: 156, sync: "12s ago", latency: [12,11,13,12,12,11,12,13,12,11,12,12] },
  { id: "argocd",     name: "ArgoCD",     cat: "GitOps",         col: "#EC4899", status: "ok",   ents: 28,  sync: "4s ago",  latency: [4,4,5,4,3,4,5,4,4,4,3,4] },
  { id: "jira",       name: "Jira",       cat: "Work",           col: "#0052CC", status: "ok",   ents: 1284,sync: "18s ago", latency: [18,19,17,20,18,16,18,19,18,17,18,18] },
  { id: "snowflake",  name: "Snowflake",  cat: "Warehouse",      col: "#29B5E8", status: "ok",   ents: 112, sync: "2m ago",  latency: [115,120,125,118,122,119,120,121,118,120,122,120] },
  { id: "aws",        name: "AWS",        cat: "Cloud",          col: "#FF9900", status: "warn", ents: 238, sync: "1m ago",  latency: [30,32,34,40,45,52,58,62,60,62,62,62], note: "auth pending" },
  { id: "okta",       name: "Okta",       cat: "Identity",       col: "#007DC1", status: "ok",   ents: 47,  sync: "30s ago", latency: [29,30,31,30,29,30,31,30,30,29,30,30] },
  { id: "confluence", name: "Confluence", cat: "Docs",           col: "#172B4D", status: "ok",   ents: 482, sync: "9m ago",  latency: [480,520,540,538,540,540,540,540,540,540,540,540] },
  { id: "jenkins",    name: "Jenkins",    cat: "CI",             col: "#D33833", status: "ok",   ents: 73,  sync: "14s ago", latency: [13,14,15,14,13,14,15,14,13,14,14,14] },
  { id: "slack",      name: "Slack",      cat: "Comms",          col: "#4A154B", status: "ok",   ents: 88,  sync: "1s ago",  latency: [1,1,1,2,1,1,1,1,1,1,1,1] },
  { id: "splunk",     name: "Splunk",     cat: "Logs",           col: "#FF375F", status: "crit", ents: 0,   sync: "8m ago",  latency: [80,60,40,20,10,5,2,0,0,0,0,0], note: "ingest blocked" },
  { id: "vault",      name: "Vault",      cat: "Secrets",        col: "#6C4FBB", status: "ok",   ents: 92,  sync: "40s ago", latency: [38,40,41,40,39,40,41,40,39,40,40,40] },
  { id: "terraform",  name: "Terraform",  cat: "IaC",            col: "#7B42BC", status: "ok",   ents: 68,  sync: "5m ago",  latency: [295,300,302,300,298,300,302,300,299,300,301,300] },
  { id: "openshift",  name: "OpenShift",  cat: "Orchestration",  col: "#EE0000", status: "ok",   ents: 54,  sync: "22s ago", latency: [21,22,23,22,21,22,23,22,21,22,22,22] },
  { id: "jfrog",      name: "JFrog",      cat: "Artifacts",      col: "#41BF47", status: "ok",   ents: 89,  sync: "1m ago",  latency: [60,62,61,60,62,63,60,61,62,60,62,61] },
];

const EVENTS = [
  { t: "19:42", name: "GitHub",    event: "12 repos · 487 entities · 8 ms",         status: "ok"   as CnStatus },
  { t: "19:41", name: "Datadog",   event: "metric scrape · 156 services",            status: "ok"   as CnStatus },
  { t: "19:38", name: "Splunk",    event: "ingest backoff · connection reset",       status: "crit" as CnStatus },
  { t: "19:36", name: "AWS",       event: "IAM token refresh · auth re-challenge",   status: "warn" as CnStatus },
  { t: "19:34", name: "Snowflake", event: "warehouse sync · 112 tables · 23 ms",     status: "ok"   as CnStatus },
  { t: "19:32", name: "Okta",      event: "47 users · 19 groups synced",             status: "ok"   as CnStatus },
  { t: "19:28", name: "Vault",     event: "92 secrets inventory · no drift",         status: "ok"   as CnStatus },
];

/* ── Sparkline ──────────────────────────────────────────── */
function sparkPath(values: number[], w: number, h: number, pad = 2) {
  if (!values.length) return "";
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  return values.map((v, i) => {
    const x = pad + ((w - 2 * pad) * i) / (values.length - 1);
    const y = h - pad - ((v - min) / range) * (h - 2 * pad);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const path = sparkPath(values, 140, 24, 2);
  return (
    <svg viewBox="0 0 140 24" preserveAspectRatio="none" className="my-2" style={{ width: "100%", height: 24 }}>
      <path d={path} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusPill({ status }: { status: CnStatus }) {
  const map = {
    ok:   { color: "var(--p-green)", bg: "var(--p-green-subtle)", label: "live" },
    warn: { color: "var(--p-amber)", bg: "var(--p-amber-subtle)", label: "auth" },
    crit: { color: "var(--p-red)",   bg: "var(--p-red-subtle)",   label: "down" },
  } as const;
  const cfg = map[status];
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

/* ── Connector card ─────────────────────────────────────── */
function ConnectorCard({
  c, onSync, onConfigure,
}: { c: Connector; onSync: (id: string) => void; onConfigure: (id: string) => void }) {
  const sparkColor = c.status === "ok" ? "var(--p-green)" : c.status === "warn" ? "var(--p-amber)" : "var(--p-red)";
  const ringColor  = c.status === "warn" ? "var(--p-amber)" : c.status === "crit" ? "var(--p-red)" : undefined;

  return (
    <div className="rounded-xl p-4 transition-all relative overflow-hidden"
      style={{
        background: "var(--p-bg-card)",
        boxShadow: ringColor ? `var(--p-surface), inset 0 0 0 1px ${ringColor}` : "var(--p-surface)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold flex-shrink-0"
          style={{ background: c.col, color: "#fff", fontFamily: '"Geist", system-ui, sans-serif' }}>
          {c.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold truncate" style={{ color: "var(--p-text-1)" }}>{c.name}</div>
          <div className="text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>{c.cat}</div>
        </div>
        <StatusPill status={c.status} />
      </div>

      <Sparkline values={c.latency} color={sparkColor} />

      <div className="grid grid-cols-2 gap-2 pt-3" style={{ borderTop: "1px solid var(--p-border-subtle)" }}>
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
        <div className="mt-2 text-[10px] font-mono"
          style={{ color: c.status === "crit" ? "var(--p-red)" : "var(--p-amber)" }}>
          ⚠ {c.note}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--p-border-subtle)" }}>
        <button
          onClick={() => onConfigure(c.id)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
          style={{ background: "var(--p-bg-elevated)", color: "var(--p-text-2)", border: "1px solid var(--p-border)" }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--p-accent-subtle)"; el.style.color = "var(--p-accent)"; el.style.borderColor = "var(--p-accent-border)"; }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--p-bg-elevated)"; el.style.color = "var(--p-text-2)"; el.style.borderColor = "var(--p-border)"; }}
        >
          <Settings size={11} /> Configure
        </button>
        <button
          onClick={() => onSync(c.id)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
          style={{ background: "var(--p-bg-elevated)", color: "var(--p-text-2)", border: "1px solid var(--p-border)" }}
          title="Sync now"
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--p-green-subtle)"; el.style.color = "var(--p-green)"; el.style.borderColor = "rgba(52,211,153,0.3)"; }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--p-bg-elevated)"; el.style.color = "var(--p-text-2)"; el.style.borderColor = "var(--p-border)"; }}
        >
          <RefreshCw size={11} />
        </button>
      </div>
    </div>
  );
}

/* ── Config Modal ───────────────────────────────────────── */
function ConnectorConfigModal({
  connectorId, connector, onClose,
}: { connectorId: string; connector: Connector | undefined; onClose: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: config, isLoading } = useQuery<ConnectorConfig>({
    queryKey: ["connector-config", connectorId],
    queryFn: () => apiClient.get(`/api/v1/connectors/${connectorId}/config`).then(r => r.data),
  });
  useEffect(() => {
    if (config) setValues(config.values || {});
  }, [config]);

  const { mutate: saveConfig, isLoading: isSaving } = useMutation({
    mutationFn: (vals: Record<string, string>) =>
      apiClient.put(`/api/v1/connectors/${connectorId}/config`, vals),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const { mutate: testConn, isLoading: isTesting } = useMutation({
    mutationFn: () => apiClient.post(`/api/v1/connectors/${connectorId}/test`),
    onSuccess: (r: any) => setTestResult(r.data),
    onError: () => setTestResult({ success: false, message: "Connection failed" }),
  });

  const set = (key: string, val: string) => setValues(p => ({ ...p, [key]: val }));
  const toggleShow = (key: string) => setShowSecrets(p => ({ ...p, [key]: !p[key] }));

  const fields = config?.fields || [];
  const col = connector?.col || "#5E6AD2";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl"
        style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface-float)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5" style={{ borderBottom: "1px solid var(--p-border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[15px] font-bold flex-shrink-0"
            style={{ background: col, color: "#fff" }}>
            {connector?.name?.[0] || connectorId[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold" style={{ color: "var(--p-text-1)" }}>
              Configure {connector?.name || connectorId}
            </div>
            {config && (
              <div className="flex items-center gap-2 mt-0.5">
                <Mono className="text-[11px]" style={{ color: "var(--p-text-3)" }}>
                  Auth: {config.auth_method}
                </Mono>
                {config.is_configured && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--p-green-subtle)", color: "var(--p-green)" }}>
                    <Check size={9} /> configured
                  </span>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ color: "var(--p-text-3)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--p-bg-elevated)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 rounded-full border-2 animate-spin"
                style={{ borderColor: "var(--p-border)", borderTopColor: "var(--p-accent)" }} />
            </div>
          ) : (
            <>
              {/* Auth method badge */}
              {config?.auth_method && (
                <div className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: "var(--p-accent-subtle)", border: "1px solid var(--p-accent-border)" }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--p-accent)" }} />
                  <Mono className="text-[11px] font-medium" style={{ color: "var(--p-accent)" }}>
                    Authentication: {config.auth_method}
                  </Mono>
                </div>
              )}

              {/* Auth fields */}
              <div className="space-y-3">
                <div className="text-[11px] font-mono uppercase tracking-widest"
                  style={{ color: "var(--p-text-3)" }}>
                  Connection settings
                </div>
                {fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[12px] font-medium"
                      style={{ color: "var(--p-text-2)" }}>
                      {field.label}
                      {field.required && <span style={{ color: "var(--p-red)" }}>*</span>}
                    </label>

                    {field.type === "textarea" ? (
                      <textarea
                        value={values[field.key] || ""}
                        onChange={(e) => set(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg text-[12px] font-mono resize-none outline-none"
                        style={{
                          background: "var(--p-bg-elevated)",
                          border: "1px solid var(--p-border)",
                          color: "var(--p-text-1)",
                          fontFamily: '"JetBrains Mono", monospace',
                        }}
                        onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-accent)"; }}
                        onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-border)"; }}
                      />
                    ) : field.type === "checkbox" ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={values[field.key] === "true"}
                          onChange={(e) => set(field.key, e.target.checked ? "true" : "false")}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: "var(--p-accent)" }}
                        />
                        <span className="text-[12px]" style={{ color: "var(--p-text-2)" }}>
                          {field.placeholder || "Enable"}
                        </span>
                      </label>
                    ) : (
                      <div className="relative">
                        <input
                          type={field.type === "password" && !showSecrets[field.key] ? "password" : "text"}
                          value={values[field.key] || ""}
                          onChange={(e) => set(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                          style={{
                            background: "var(--p-bg-elevated)",
                            border: "1px solid var(--p-border)",
                            color: "var(--p-text-1)",
                            fontFamily: field.type === "password" ? '"JetBrains Mono", monospace' : undefined,
                            paddingRight: field.type === "password" ? "36px" : undefined,
                          }}
                          onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-accent)"; }}
                          onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-border)"; }}
                        />
                        {field.type === "password" && (
                          <button
                            type="button"
                            onClick={() => toggleShow(field.key)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2"
                            style={{ color: "var(--p-text-3)" }}
                          >
                            {showSecrets[field.key] ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Test result */}
              {testResult && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px]"
                  style={{
                    background: testResult.success ? "var(--p-green-subtle)" : "var(--p-red-subtle)",
                    border: `1px solid ${testResult.success ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
                    color: testResult.success ? "var(--p-green)" : "var(--p-red)",
                  }}>
                  {testResult.success ? <Check size={13} /> : <AlertTriangle size={13} />}
                  {testResult.message}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 px-6 py-4" style={{ borderTop: "1px solid var(--p-border)" }}>
          <button
            onClick={() => testConn()}
            disabled={isTesting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
            style={{
              background: "var(--p-bg-elevated)",
              color: "var(--p-text-2)",
              border: "1px solid var(--p-border)",
              opacity: isTesting ? 0.6 : 1,
            }}
          >
            {isTesting
              ? <><div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" /> Testing…</>
              : <><Zap size={12} /> Test connection</>
            }
          </button>

          <div className="flex-1" />

          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[12px]"
            style={{ color: "var(--p-text-2)" }}>
            Cancel
          </button>
          <button
            onClick={() => saveConfig(values)}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-[12px] font-semibold transition-all"
            style={{
              background: saved ? "var(--p-green)" : "var(--p-accent)",
              color: "#fff",
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {saved ? <><Check size={12} /> Saved</> : isSaving ? "Saving…" : "Save configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add Connector Modal ────────────────────────────────── */
function AddConnectorModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"pick" | "configure">("pick");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedAuthMethod, setSelectedAuthMethod] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const { data: catalog } = useQuery<{ connectors: CatalogItem[] }>({
    queryKey: ["connector-catalog"],
    queryFn: () => apiClient.get("/api/v1/connectors/catalog").then(r => r.data),
  });

  const { data: configSchema } = useQuery<ConnectorConfig>({
    queryKey: ["connector-config", selectedId],
    queryFn: () => apiClient.get(`/api/v1/connectors/${selectedId}/config`).then(r => r.data),
    enabled: !!selectedId && step === "configure",
  });

  const catalogItems = catalog?.connectors || [];
  const selectedItem = catalogItems.find(c => c.id === selectedId);

  useEffect(() => {
    if (configSchema) {
      setSelectedAuthMethod(configSchema.auth_method || selectedItem?.auth_methods[0] || "");
      setValues(configSchema.values || {});
    } else if (selectedItem?.auth_methods.length) {
      setSelectedAuthMethod(selectedItem.auth_methods[0]);
    }
  }, [configSchema, selectedItem]);

  const { mutate: saveConfig, isLoading: isSaving } = useMutation({
    mutationFn: () =>
      apiClient.put(`/api/v1/connectors/${selectedId}/config`, values),
    onSuccess: () => { setSaved(true); setTimeout(() => { setSaved(false); onClose(); }, 1200); },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl"
        style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface-float)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: "1px solid var(--p-border)" }}>
          <Plus size={18} style={{ color: "var(--p-accent)" }} />
          <div className="flex-1">
            <div className="text-[15px] font-semibold" style={{ color: "var(--p-text-1)" }}>
              {step === "pick" ? "Add connector" : `Configure ${selectedItem?.name || ""}`}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-mono" style={{ color: step === "pick" ? "var(--p-accent)" : "var(--p-text-3)" }}>1 · Select</span>
              <ChevronRight size={10} style={{ color: "var(--p-text-3)" }} />
              <span className="text-[11px] font-mono" style={{ color: step === "configure" ? "var(--p-accent)" : "var(--p-text-3)" }}>2 · Configure</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ color: "var(--p-text-3)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === "pick" ? (
            <div className="grid grid-cols-2 gap-2.5">
              {catalogItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSelectedId(item.id); }}
                  className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
                  style={{
                    background: selectedId === item.id ? "var(--p-accent-subtle)" : "var(--p-bg-elevated)",
                    border: `1px solid ${selectedId === item.id ? "var(--p-accent-border)" : "var(--p-border)"}`,
                  }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold flex-shrink-0"
                    style={{ background: item.icon_color, color: "#fff" }}>
                    {item.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold truncate" style={{ color: "var(--p-text-1)" }}>{item.name}</div>
                    <div className="text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>{item.category}</div>
                  </div>
                  {selectedId === item.id && <Check size={14} style={{ color: "var(--p-accent)", flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Auth method selector */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium" style={{ color: "var(--p-text-2)" }}>Auth Method</label>
                <select
                  value={selectedAuthMethod}
                  onChange={(e) => setSelectedAuthMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--p-bg-elevated)", border: "1px solid var(--p-border)", color: "var(--p-text-1)" }}
                >
                  {selectedItem?.auth_methods.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Fields from schema */}
              {configSchema?.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "var(--p-text-2)" }}>
                    {field.label}{field.required && <span style={{ color: "var(--p-red)" }}>*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea rows={3} value={values[field.key] || ""} onChange={e => setValues(p => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder} className="w-full px-3 py-2 rounded-lg text-[12px] font-mono resize-none outline-none"
                      style={{ background: "var(--p-bg-elevated)", border: "1px solid var(--p-border)", color: "var(--p-text-1)" }} />
                  ) : (
                    <input type={field.type === "password" ? "password" : "text"}
                      value={values[field.key] || ""} onChange={e => setValues(p => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                      style={{ background: "var(--p-bg-elevated)", border: "1px solid var(--p-border)", color: "var(--p-text-1)" }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid var(--p-border)" }}>
          {step === "configure" && (
            <button onClick={() => setStep("pick")} className="px-4 py-2 rounded-lg text-[12px]"
              style={{ color: "var(--p-text-2)" }}>
              ← Back
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[12px]"
            style={{ color: "var(--p-text-2)" }}>
            Cancel
          </button>
          {step === "pick" ? (
            <button
              onClick={() => { if (selectedId) setStep("configure"); }}
              disabled={!selectedId}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-[12px] font-semibold"
              style={{ background: selectedId ? "var(--p-accent)" : "var(--p-bg-elevated)", color: selectedId ? "#fff" : "var(--p-text-3)" }}
            >
              Next: Configure <ChevronRight size={13} />
            </button>
          ) : (
            <button
              onClick={() => saveConfig()}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-[12px] font-semibold"
              style={{ background: saved ? "var(--p-green)" : "var(--p-accent)", color: "#fff" }}
            >
              {saved ? <><Check size={12} /> Added!</> : isSaving ? "Adding…" : "Add connector"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function Connectors() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const toggleChat = useChatStore((s) => s.toggleChat);
  const isOpen = useChatStore((s) => s.isOpen);
  const [configTarget, setConfigTarget] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data } = useQuery({
    queryKey: ["connectors"],
    queryFn: () => apiClient.get("/api/v1/connectors").then((r) => r.data),
    staleTime: 30_000,
    retry: false,
  });

  const { mutate: triggerSync, variables: syncingId } = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/v1/connectors/${id}/sync`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connectors"] }),
  });

  const connectors: Connector[] = useMemo(() => {
    const apiPlatforms = (data?.platforms as Array<{ id: string; entityCount?: number; status?: string; lastSynced?: string }> | undefined) || [];
    if (!apiPlatforms.length) return CONS;
    return CONS.map((c) => {
      const m = apiPlatforms.find((p) => p.id === c.id);
      if (!m) return c;
      const status: CnStatus = m.status === "synced" ? "ok" : m.status === "syncing" ? "warn" : m.status === "error" ? "crit" : c.status;
      return { ...c, ents: typeof m.entityCount === "number" ? m.entityCount : c.ents, sync: m.lastSynced || c.sync, status };
    });
  }, [data]);

  const totalEntities = connectors.reduce((a, c) => a + c.ents, 0);
  const failed = connectors.filter((c) => c.status === "crit").length;

  const triggerIris = (q: string) => { void q; if (!isOpen) toggleChat(); };

  const sortedByEnts = [...connectors].sort((a, b) => b.ents - a.ents).slice(0, 8);
  const maxEnts = sortedByEnts[0]?.ents || 1;
  const configConnector = connectors.find(c => c.id === configTarget);

  return (
    <div className="flex flex-col w-full min-h-full">
      <PageHead
        eyebrow={`INTELLIGENCE · ${connectors.length} PLATFORMS`}
        title="Connectors"
        subtitle="Each connector pulls one Perspective into the CPT graph. Read-only by default. Resolution happens server-side — your data never leaves your network."
        actions={
          <>
            <button
              onClick={() => {
                connectors.forEach(c => triggerSync(c.id));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "transparent", color: "var(--p-text-2)", boxShadow: "var(--p-surface)", fontFamily: '"Geist", system-ui, sans-serif' }}
            >
              <RefreshCw size={12} /> Sync all
            </button>
            <button
              onClick={() => setShowAdd(true)}
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
        <MetricCard label="Connected" value={`${connectors.length}`} />
        <MetricCard label="Avg sync"  value="23" unit="s" />
        <MetricCard label="Entities pulled" value={totalEntities.toLocaleString()} trend={218} trendDirection="up" />
        <MetricCard label="Failed" value={failed} trendDirection={failed > 0 ? "down" : "neutral"} />
      </div>

      {/* Connector cards grid */}
      <div className="px-6 pb-5">
        <div className="grid grid-cols-3 gap-3">
          {connectors.map((c) => (
            <ConnectorCard
              key={c.id} c={c}
              onSync={(id) => triggerSync(id)}
              onConfigure={(id) => setConfigTarget(id)}
            />
          ))}
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-xl px-4 py-4 flex flex-col items-center justify-center gap-2 transition-all min-h-[160px]"
            style={{
              background: "var(--p-bg-card)",
              boxShadow: "inset 0 0 0 1px var(--p-border)",
              color: "var(--p-text-3)",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12,
            }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "var(--p-accent)"; el.style.boxShadow = "inset 0 0 0 1px var(--p-accent-border)"; el.style.background = "var(--p-accent-subtle)"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "var(--p-text-3)"; el.style.boxShadow = "inset 0 0 0 1px var(--p-border)"; el.style.background = "var(--p-bg-card)"; }}
          >
            <Plus size={20} />
            Add connector
          </button>
        </div>
      </div>

      {/* Bottom layout */}
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
                <div key={i} className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderBottom: i < EVENTS.length - 1 ? "1px solid var(--p-border-subtle)" : undefined }}>
                  <Mono className="text-[10.5px] flex-shrink-0" style={{ color: "var(--p-text-3)", width: 44 }}>{e.t}</Mono>
                  <Mono className="text-[11px] font-semibold flex-shrink-0" style={{ color: "var(--p-text-1)", width: 90 }}>{e.name}</Mono>
                  <Mono className="text-[12px] flex-1 min-w-0 truncate" style={{ color: "var(--p-text-2)" }}>{e.event}</Mono>
                  <StatusPill status={e.status} />
                  <button
                    onClick={() => setConfigTarget(connectors.find(c => c.name === e.name)?.id || "")}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono"
                    style={{ color: "var(--p-text-3)", background: "var(--p-bg-elevated)" }}
                    onMouseEnter={(el) => { (el.currentTarget as HTMLElement).style.color = "var(--p-text-2)"; }}
                    onMouseLeave={(el) => { (el.currentTarget as HTMLElement).style.color = "var(--p-text-3)"; }}
                  >
                    <Settings size={9} /> configure
                  </button>
                </div>
              ))}
            </div>
          </Section>

          <Section eyebrow="DISTRIBUTION" title="Entity counts by connector">
            <div className="flex flex-col">
              {sortedByEnts.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderBottom: i < sortedByEnts.length - 1 ? "1px solid var(--p-border-subtle)" : undefined }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.col }} />
                  <Mono className="text-[12px] flex-shrink-0" style={{ color: "var(--p-text-1)", width: 110 }}>{c.name}</Mono>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--p-bg-elevated)" }}>
                    <span className="block h-full rounded-full"
                      style={{ width: `${Math.round((c.ents / maxEnts) * 100)}%`, background: c.col }} />
                  </div>
                  <Mono className="text-[11.5px] flex-shrink-0" style={{ color: "var(--p-text-2)", minWidth: 56, textAlign: "right" }}>
                    {c.ents.toLocaleString()}
                  </Mono>
                  <button onClick={() => setConfigTarget(c.id)}
                    className="w-6 h-6 flex items-center justify-center rounded"
                    style={{ color: "var(--p-text-3)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-2)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-3)"; }}>
                    <Settings size={11} />
                  </button>
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
                { k: "replica_count", v: "k8s · 1.0" },
                { k: "p99_latency",   v: "datadog · 1.0" },
                { k: "api_contract",  v: "apigw · 1.0" },
                { k: "source_code",   v: "github · 1.0" },
                { k: "sast_findings", v: "github · 1.0" },
                { k: "secret_path",   v: "vault · 1.0" },
              ].map((r, i, arr) => (
                <div key={r.k} className="flex items-center justify-between py-1.5"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--p-border-subtle)" : undefined }}>
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

          <div className="rounded-xl overflow-hidden"
            style={{ background: "var(--p-iris-subtle)", boxShadow: "inset 0 0 0 1px var(--p-iris-border)" }}>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--p-iris-border)" }}>
              <Sparkles size={12} style={{ color: "var(--p-iris)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--p-iris)", fontFamily: '"Geist", system-ui, sans-serif' }}>Ask Iris</span>
              <button onClick={() => navigate("/iris")} className="ml-auto text-[10px] font-mono uppercase tracking-wider"
                style={{ color: "var(--p-text-3)" }}>
                full chat →
              </button>
            </div>
            <div className="flex flex-col gap-1.5 p-3">
              {["Changes since last Snowflake sync", "Splunk backoff blast radius", "Why is AWS in auth-pending state?"].map((p) => (
                <button key={p} onClick={() => triggerIris(p)}
                  className="text-left px-2.5 py-2 rounded-md text-[11px] font-mono transition-colors"
                  style={{ background: "var(--p-bg-card)", color: "var(--p-iris)" }}>
                  › {p}
                </button>
              ))}
            </div>
            <div className="px-4 py-2 text-[10px] font-mono inline-flex items-center gap-1"
              style={{ color: "var(--p-text-3)", borderTop: "1px solid var(--p-iris-border)" }}>
              <Zap size={10} /> CPT engine grounded
            </div>
          </div>

          {/* Quick links */}
          <div className="rounded-xl p-4" style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface)" }}>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: "var(--p-text-3)" }}>Quick actions</div>
            {[
              { label: "View connector docs", icon: ExternalLink },
              { label: "Download connector SDK", icon: ExternalLink },
            ].map(({ label, icon: Icon }) => (
              <button key={label}
                className="w-full flex items-center gap-2 py-2 text-[11px] font-mono text-left"
                style={{ color: "var(--p-text-2)", borderBottom: "1px solid var(--p-border-subtle)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-2)"; }}
              >
                <Icon size={11} style={{ flexShrink: 0 }} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {configTarget && (
        <ConnectorConfigModal
          connectorId={configTarget}
          connector={configConnector}
          onClose={() => setConfigTarget(null)}
        />
      )}
      {showAdd && <AddConnectorModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
