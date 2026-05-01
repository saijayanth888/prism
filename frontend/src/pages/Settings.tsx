import { Check, ChevronRight, Eye, EyeOff, RefreshCw, Shield } from "lucide-react";
import { useState } from "react";

const PLATFORMS = [
  { id: "kubernetes", name: "Kubernetes", status: "connected", entities: 312 },
  { id: "github", name: "GitHub", status: "connected", entities: 87 },
  { id: "datadog", name: "Datadog", status: "connected", entities: 204 },
  { id: "aws", name: "AWS", status: "connected", entities: 156 },
  { id: "confluent", name: "Confluent Kafka", status: "connected", entities: 43 },
  { id: "argocd", name: "ArgoCD", status: "syncing", entities: 28 },
  { id: "terraform", name: "Terraform", status: "connected", entities: 198 },
  { id: "vault", name: "HashiCorp Vault", status: "connected", entities: 67 },
  { id: "servicenow", name: "ServiceNow", status: "error", entities: 0 },
  { id: "jira", name: "Jira", status: "connected", entities: 112 },
  { id: "apiconnect", name: "IBM API Connect", status: "connected", entities: 95 },
  { id: "sonarqube", name: "SonarQube", status: "connected", entities: 284 },
  { id: "nexus", name: "Nexus Registry", status: "connected", entities: 89 },
];

const STATUS_COLOR: Record<string, string> = {
  connected: "var(--p-green)", syncing: "var(--p-amber)", error: "var(--p-red)",
};

export default function Settings() {
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [syncInterval, setSyncInterval] = useState("5");
  const [antiHallucination, setAntiHallucination] = useState(true);
  const [realtimeUpdates, setRealtimeUpdates] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--p-text-1)", fontFamily: '"Syne", sans-serif' }}>Settings</h1>
          <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--p-text-3)" }}>Platform config · LLM provider · sync intervals</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: saved ? "var(--p-green-subtle)" : "var(--p-iris)",
            color: saved ? "var(--p-green)" : "var(--p-bg-deep)",
            border: saved ? "1px solid rgba(52,211,153,0.3)" : "none",
          }}
        >
          {saved ? <Check size={13} /> : <ChevronRight size={13} />}
          {saved ? "Saved!" : "Save changes"}
        </button>
      </div>

      {/* LLM Provider */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--p-border)" }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ background: "var(--p-bg-card)", borderBottom: "1px solid var(--p-border)" }}>
          <Shield size={13} style={{ color: "var(--p-iris)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--p-text-1)" }}>AI Provider — Iris Copilot</span>
        </div>
        <div className="p-5 space-y-4" style={{ background: "var(--p-bg-main)" }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1.5 font-semibold" style={{ color: "var(--p-text-3)" }}>Provider</label>
              <div className="px-3 py-2.5 rounded-lg text-sm font-mono"
                style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)", color: "var(--p-iris)" }}>
                Anthropic Claude ✓
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1.5 font-semibold" style={{ color: "var(--p-text-3)" }}>Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-mono outline-none transition-all"
                style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)", color: "var(--p-text-2)" }}>
                <option value="claude-sonnet-4-6">claude-sonnet-4-6 (default)</option>
                <option value="claude-opus-4-7">claude-opus-4-7 (most capable)</option>
                <option value="claude-haiku-4-5">claude-haiku-4-5 (fastest)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider mb-1.5 font-semibold" style={{ color: "var(--p-text-3)" }}>API Key</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all"
                style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)" }}>
                <input
                  type={showKey ? "text" : "password"}
                  defaultValue="sk-ant-api03-••••••••••••••••••••••••••••••••"
                  className="flex-1 text-sm font-mono bg-transparent outline-none"
                  style={{ color: "var(--p-text-2)" }}
                />
                <button onClick={() => setShowKey(!showKey)} style={{ color: "var(--p-text-3)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-2)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-3)"; }}>
                  {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 px-3 rounded-lg text-[10px] font-medium"
                style={{ background: "var(--p-green-subtle)", color: "var(--p-green)", border: "1px solid rgba(52,211,153,0.25)" }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--p-green)" }} />
                Valid
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Max Tokens", value: "4,096" },
              { label: "Temperature", value: "0.1" },
              { label: "Context Window", value: "200K" },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-[10px] uppercase tracking-wider mb-1.5 font-semibold" style={{ color: "var(--p-text-3)" }}>{f.label}</label>
                <div className="px-3 py-2 rounded-lg text-sm font-mono"
                  style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)", color: "var(--p-text-2)" }}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* General settings */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--p-border)" }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ background: "var(--p-bg-card)", borderBottom: "1px solid var(--p-border)" }}>
          <RefreshCw size={13} style={{ color: "var(--p-text-3)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--p-text-1)" }}>Sync Configuration</span>
        </div>
        <div className="p-5 space-y-4" style={{ background: "var(--p-bg-main)" }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1.5 font-semibold" style={{ color: "var(--p-text-3)" }}>Sync Interval (minutes)</label>
              <select
                value={syncInterval}
                onChange={(e) => setSyncInterval(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-mono outline-none"
                style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)", color: "var(--p-text-2)" }}>
                <option value="1">1 minute</option>
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1.5 font-semibold" style={{ color: "var(--p-text-3)" }}>CPT Resolution Threshold</label>
              <div className="px-3 py-2.5 rounded-lg text-sm font-mono"
                style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)", color: "var(--p-text-2)" }}>
                0.85 confidence
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-xs font-medium" style={{ color: "var(--p-text-1)" }}>Anti-hallucination safeguards</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--p-text-3)" }}>Enforce mandatory graph query before every Iris response</div>
            </div>
            <button onClick={() => setAntiHallucination(v => !v)}
              className="w-10 h-5 rounded-full flex items-center px-0.5 cursor-pointer transition-all"
              style={{ background: antiHallucination ? "var(--p-iris)" : "var(--p-bg-border)", justifyContent: antiHallucination ? "flex-end" : "flex-start" }}>
              <div className="w-4 h-4 rounded-full" style={{ background: "var(--p-bg-deep)" }} />
            </button>
          </div>

          <div className="flex items-center justify-between py-2" style={{ borderTop: "1px solid var(--p-border)" }}>
            <div>
              <div className="text-xs font-medium" style={{ color: "var(--p-text-1)" }}>Real-time topology updates</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--p-text-3)" }}>Push graph changes to all connected clients via WebSocket</div>
            </div>
            <button onClick={() => setRealtimeUpdates(v => !v)}
              className="w-10 h-5 rounded-full flex items-center px-0.5 cursor-pointer transition-all"
              style={{ background: realtimeUpdates ? "var(--p-iris)" : "var(--p-bg-border)", justifyContent: realtimeUpdates ? "flex-end" : "flex-start" }}>
              <div className="w-4 h-4 rounded-full" style={{ background: "var(--p-bg-deep)" }} />
            </button>
          </div>
        </div>
      </div>

      {/* Platform connectors status */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.15em] mb-3 font-semibold" style={{ color: "var(--p-text-3)" }}>
          Platform Connectors ({PLATFORMS.length})
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
              style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--p-border-strong)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--p-border)")}>
              <div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: STATUS_COLOR[p.status] || "var(--p-text-3)" }} />
              <span className="text-xs font-medium flex-1 truncate" style={{ color: "var(--p-text-1)" }}>{p.name}</span>
              <span className="text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>{p.entities > 0 ? `${p.entities}` : "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
