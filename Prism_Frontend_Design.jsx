import { useState, useEffect, useRef } from "react";

const MODULES = [
  { id: "topology", icon: "◎", label: "Topology explorer", badge: null },
  { id: "applens", icon: "◉", label: "Application lens", badge: null },
  { id: "api", icon: "⬡", label: "API catalog", badge: "142" },
  { id: "compliance", icon: "◧", label: "Compliance center", badge: "3" },
  { id: "vuln", icon: "△", label: "Vulnerability intel", badge: "27" },
  { id: "blast", icon: "◎", label: "Blast radius", badge: null },
  { id: "copilot", icon: "◈", label: "AI copilot", badge: null },
  { id: "domain", icon: "◬", label: "Domain navigator", badge: null },
  { id: "health", icon: "◍", label: "Health dashboard", badge: null },
  { id: "reports", icon: "▣", label: "Reports tower", badge: null },
  { id: "change", icon: "⟳", label: "Change impact", badge: null },
  { id: "onboard", icon: "◐", label: "Onboarding", badge: null },
  { id: "market", icon: "⊞", label: "Connector marketplace", badge: null },
];

const TENANTS = ["Acme Financial Corp", "GlobalTech Industries", "Meridian Healthcare"];

const PLATFORMS = [
  { name: "OpenShift", count: 847, color: "#E24B4A", status: "synced" },
  { name: "GitHub/GHAS", count: 1203, color: "#1D9E75", status: "synced" },
  { name: "API Connect", count: 142, color: "#378ADD", status: "synced" },
  { name: "Datadog", count: 312, color: "#7F77DD", status: "synced" },
  { name: "ArgoCD", count: 96, color: "#D85A30", status: "synced" },
  { name: "Confluent Kafka", count: 58, color: "#EF9F27", status: "synced" },
  { name: "AWS EKS", count: 234, color: "#BA7517", status: "synced" },
  { name: "Terraform", count: 189, color: "#534AB7", status: "synced" },
  { name: "ServiceNow", count: 412, color: "#D4537E", status: "syncing" },
  { name: "Jira", count: 567, color: "#639922", status: "synced" },
  { name: "HashiCorp Vault", count: 34, color: "#888780", status: "synced" },
  { name: "SonarQube", count: 298, color: "#185FA5", status: "error" },
  { name: "Nexus/Artifactory", count: 456, color: "#993C1D", status: "synced" },
];

const GRAPH_NODES = [
  { id: 1, label: "payments-api", type: "api", x: 340, y: 160, platform: "API Connect" },
  { id: 2, label: "payments-svc", type: "service", x: 200, y: 280, platform: "OpenShift" },
  { id: 3, label: "payments-db", type: "database", x: 120, y: 420, platform: "AWS" },
  { id: 4, label: "auth-gateway", type: "api", x: 480, y: 100, platform: "API Connect" },
  { id: 5, label: "user-service", type: "service", x: 500, y: 260, platform: "OpenShift" },
  { id: 6, label: "notification-svc", type: "service", x: 380, y: 380, platform: "OpenShift" },
  { id: 7, label: "kafka-payments", type: "queue", x: 260, y: 160, platform: "Confluent" },
  { id: 8, label: "redis-cache", type: "cache", x: 80, y: 280, platform: "AWS" },
  { id: 9, label: "payments-repo", type: "repo", x: 460, y: 400, platform: "GitHub" },
  { id: 10, label: "fraud-detector", type: "service", x: 160, y: 160, platform: "OpenShift" },
  { id: 11, label: "ledger-api", type: "api", x: 560, y: 180, platform: "API Connect" },
  { id: 12, label: "compliance-chk", type: "service", x: 300, y: 440, platform: "OpenShift" },
  { id: 13, label: "vault-secrets", type: "secret", x: 60, y: 380, platform: "Vault" },
  { id: 14, label: "monitoring", type: "monitor", x: 540, y: 340, platform: "Datadog" },
  { id: 15, label: "argocd-deploy", type: "deploy", x: 420, y: 280, platform: "ArgoCD" },
];

const GRAPH_EDGES = [
  [1, 2], [2, 3], [1, 4], [4, 5], [2, 6], [7, 2], [2, 8],
  [9, 2], [10, 2], [5, 11], [6, 12], [2, 13], [14, 2], [15, 2],
  [5, 6], [10, 7], [12, 3], [1, 11],
];

const TYPE_COLORS = {
  api: "#378ADD", service: "#1D9E75", database: "#7F77DD",
  queue: "#EF9F27", cache: "#D85A30", repo: "#888780",
  secret: "#D4537E", monitor: "#534AB7", deploy: "#639922",
};

const CHAT_MESSAGES = [
  { role: "system", text: "Prism AI copilot ready. Ask me about your infrastructure." },
  { role: "user", text: "What services depend on payments-api?" },
  { role: "assistant", text: "payments-api has 6 direct dependencies:\n\n→ payments-svc (OpenShift)\n→ auth-gateway (API Connect)\n→ kafka-payments (Confluent)\n→ fraud-detector (OpenShift)\n→ ledger-api (API Connect)\n→ user-service (OpenShift)\n\nBlast radius: 12 services affected across 4 platforms if payments-api goes down." },
  { role: "user", text: "Show me compliance gaps for PCI-DSS" },
  { role: "assistant", text: "Found 3 PCI-DSS compliance gaps:\n\n⚠ payments-db: Encryption at rest not verified (Critical)\n⚠ redis-cache: No TLS configured for in-transit data (High)\n⚠ payments-repo: Branch protection rules incomplete (Medium)\n\nRemediation guidance available for each. Want details?" },
];

const HEALTH_METRICS = [
  { label: "Total entities", value: "4,842", trend: "+127", trendDir: "up" },
  { label: "Platforms connected", value: "13", trend: "All synced", trendDir: "neutral" },
  { label: "Compliance score", value: "87%", trend: "+4%", trendDir: "up" },
  { label: "Critical vulns", value: "27", trend: "-8", trendDir: "down" },
  { label: "Avg blast radius", value: "6.3", trend: "services", trendDir: "neutral" },
  { label: "Graph freshness", value: "< 2 min", trend: "Real-time", trendDir: "neutral" },
];

function MetricCard({ label, value, trend, trendDir }) {
  const trendColor = trendDir === "up" ? "#1D9E75" : trendDir === "down" ? "#1D9E75" : "#888780";
  return (
    <div style={{
      background: "var(--color-background-secondary)",
      borderRadius: "var(--border-radius-md)",
      padding: "14px 16px",
    }}>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)" }}>{value}</div>
      <div style={{ fontSize: 11, color: trendColor, marginTop: 4 }}>{trend}</div>
    </div>
  );
}

function TopologyGraph({ selectedNode, onSelectNode }) {
  return (
    <svg viewBox="0 0 640 500" style={{ width: "100%", height: "100%" }}>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--color-border-secondary)" />
        </marker>
      </defs>
      {GRAPH_EDGES.map(([from, to], i) => {
        const a = GRAPH_NODES.find(n => n.id === from);
        const b = GRAPH_NODES.find(n => n.id === to);
        const isHighlighted = selectedNode && (from === selectedNode || to === selectedNode);
        return (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={isHighlighted ? "#378ADD" : "var(--color-border-tertiary)"}
            strokeWidth={isHighlighted ? 1.5 : 0.5}
            markerEnd={isHighlighted ? "url(#arrowhead)" : ""}
            opacity={selectedNode && !isHighlighted ? 0.15 : 1}
          />
        );
      })}
      {GRAPH_NODES.map(node => {
        const isSelected = selectedNode === node.id;
        const isConnected = selectedNode && GRAPH_EDGES.some(
          ([a, b]) => (a === selectedNode && b === node.id) || (b === selectedNode && a === node.id)
        );
        const dimmed = selectedNode && !isSelected && !isConnected;
        const r = isSelected ? 22 : 16;
        return (
          <g key={node.id} onClick={() => onSelectNode(isSelected ? null : node.id)}
            style={{ cursor: "pointer" }} opacity={dimmed ? 0.15 : 1}>
            <circle cx={node.x} cy={node.y} r={r}
              fill={TYPE_COLORS[node.type]}
              stroke={isSelected ? "var(--color-text-primary)" : "none"}
              strokeWidth={isSelected ? 2 : 0}
              opacity={0.9}
            />
            <text x={node.x} y={node.y + r + 14} textAnchor="middle"
              fontSize="10" fontFamily="var(--font-mono)"
              fill="var(--color-text-secondary)"
              fontWeight={isSelected ? 500 : 400}>
              {node.label}
            </text>
            {isSelected && (
              <text x={node.x} y={node.y - r - 6} textAnchor="middle"
                fontSize="9" fill={TYPE_COLORS[node.type]} fontWeight="500">
                {node.platform}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState(CHAT_MESSAGES);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages(prev => [
      ...prev,
      { role: "user", text: input },
      { role: "assistant", text: `Analyzing "${input}" across 13 connected platforms and 4,842 entities...\n\nResults will appear here in the production build with live graph queries powered by the LLM router.` }
    ]);
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        padding: "12px 14px",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", background: "#1D9E75"
        }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Prism AI copilot</span>
        <span style={{
          fontSize: 10, color: "var(--color-text-secondary)",
          marginLeft: "auto", background: "var(--color-background-secondary)",
          padding: "2px 8px", borderRadius: "var(--border-radius-md)",
        }}>Claude Sonnet</span>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "90%",
          }}>
            {msg.role === "system" ? (
              <div style={{
                fontSize: 11, color: "var(--color-text-secondary)",
                textAlign: "center", padding: "8px 0",
                fontStyle: "italic",
              }}>{msg.text}</div>
            ) : (
              <div style={{
                background: msg.role === "user"
                  ? "var(--color-background-info)"
                  : "var(--color-background-secondary)",
                color: "var(--color-text-primary)",
                padding: "10px 14px",
                borderRadius: "var(--border-radius-md)",
                fontSize: 12,
                lineHeight: 1.6,
                whiteSpace: "pre-line",
              }}>
                {msg.text}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{
        padding: "10px 14px",
        borderTop: "0.5px solid var(--color-border-tertiary)",
        display: "flex", gap: 8,
      }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask about your infrastructure..."
          style={{ flex: 1, fontSize: 12 }}
        />
        <button onClick={send} style={{ fontSize: 12, padding: "6px 14px" }}>Send</button>
      </div>
    </div>
  );
}

function PlatformStatus() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {PLATFORMS.map(p => (
        <div key={p.name} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 0",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: p.status === "synced" ? "#1D9E75" : p.status === "syncing" ? "#EF9F27" : "#E24B4A",
          }} />
          <span style={{ fontSize: 12, color: "var(--color-text-primary)", flex: 1 }}>{p.name}</span>
          <span style={{
            fontSize: 11, color: "var(--color-text-secondary)",
            fontFamily: "var(--font-mono)",
          }}>{p.count.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function AppLensView() {
  const app = {
    name: "payments-api",
    domain: "Payments",
    owner: "Platform Team Alpha",
    health: 94,
    compliance: 87,
    vulns: 3,
    platforms: ["API Connect", "OpenShift", "GitHub", "Datadog", "ArgoCD", "Confluent"],
  };

  return (
    <div style={{ padding: "0" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "var(--border-radius-md)",
          background: "#378ADD", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 500, fontSize: 14,
        }}>PA</div>
        <div>
          <div style={{ fontWeight: 500, fontSize: 15, color: "var(--color-text-primary)" }}>{app.name}</div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{app.domain} · {app.owner}</div>
        </div>
        <div style={{
          marginLeft: "auto", display: "flex", gap: 8,
        }}>
          {[
            { label: "Health", value: `${app.health}%`, color: "#1D9E75" },
            { label: "Compliance", value: `${app.compliance}%`, color: "#EF9F27" },
            { label: "Vulns", value: app.vulns, color: "#E24B4A" },
          ].map(s => (
            <div key={s.label} style={{
              textAlign: "center", padding: "6px 14px",
              background: "var(--color-background-secondary)",
              borderRadius: "var(--border-radius-md)",
            }}>
              <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 8 }}>
        Platform footprint
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {app.platforms.map(p => (
          <span key={p} style={{
            fontSize: 11, padding: "4px 10px",
            background: "var(--color-background-secondary)",
            borderRadius: "var(--border-radius-md)",
            color: "var(--color-text-primary)",
            border: "0.5px solid var(--color-border-tertiary)",
          }}>{p}</span>
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 8 }}>
        Dependency chain
      </div>
      <div style={{
        background: "var(--color-background-secondary)",
        borderRadius: "var(--border-radius-md)",
        padding: 14, fontSize: 12, fontFamily: "var(--font-mono)",
        lineHeight: 2, color: "var(--color-text-primary)",
      }}>
        <span style={{ color: "#378ADD" }}>auth-gateway</span> → <span style={{ color: "#1D9E75" }}>payments-api</span> → <span style={{ color: "#1D9E75" }}>payments-svc</span> → <span style={{ color: "#7F77DD" }}>payments-db</span><br/>
        <span style={{ color: "#378ADD" }}>auth-gateway</span> → <span style={{ color: "#1D9E75" }}>payments-api</span> → <span style={{ color: "#EF9F27" }}>kafka-payments</span> → <span style={{ color: "#1D9E75" }}>fraud-detector</span><br/>
        <span style={{ color: "#378ADD" }}>auth-gateway</span> → <span style={{ color: "#1D9E75" }}>payments-api</span> → <span style={{ color: "#1D9E75" }}>payments-svc</span> → <span style={{ color: "#D85A30" }}>redis-cache</span>
      </div>

      <div style={{
        marginTop: 20, fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 8
      }}>
        Recent events
      </div>
      {[
        { time: "2 min ago", event: "ArgoCD sync completed", status: "success" },
        { time: "18 min ago", event: "Datadog alert: p99 latency spike (420ms)", status: "warning" },
        { time: "1 hr ago", event: "GHAS: 1 new critical SAST finding", status: "danger" },
        { time: "3 hr ago", event: "Compliance scan passed (PCI-DSS)", status: "success" },
      ].map((e, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 0",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
          fontSize: 12,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: e.status === "success" ? "#1D9E75" : e.status === "warning" ? "#EF9F27" : "#E24B4A",
          }} />
          <span style={{ color: "var(--color-text-secondary)", minWidth: 70, fontSize: 11 }}>{e.time}</span>
          <span style={{ color: "var(--color-text-primary)" }}>{e.event}</span>
        </div>
      ))}
    </div>
  );
}

function TypeLegend() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {Object.entries(TYPE_COLORS).map(([type, color]) => (
        <div key={type} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
          <span style={{ fontSize: 10, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{type}</span>
        </div>
      ))}
    </div>
  );
}

export default function PrismDashboard() {
  const [activeModule, setActiveModule] = useState("topology");
  const [selectedNode, setSelectedNode] = useState(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [tenant, setTenant] = useState(TENANTS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const selectedNodeData = GRAPH_NODES.find(n => n.id === selectedNode);

  return (
    <div style={{
      display: "flex", height: "100vh", fontFamily: "var(--font-sans)",
      background: "var(--color-background-tertiary)",
      overflow: "hidden",
      borderRadius: "var(--border-radius-lg)",
      border: "0.5px solid var(--color-border-tertiary)",
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarCollapsed ? 48 : 200,
        background: "var(--color-background-primary)",
        borderRight: "0.5px solid var(--color-border-tertiary)",
        display: "flex", flexDirection: "column",
        transition: "width 0.2s ease",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            padding: sidebarCollapsed ? "16px 12px" : "16px 14px",
            borderBottom: "0.5px solid var(--color-border-tertiary)",
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10,
          }}>
          <div style={{
            width: 24, height: 24,
            background: "linear-gradient(135deg, #378ADD, #1D9E75)",
            borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 11, fontWeight: 500, flexShrink: 0,
          }}>P</div>
          {!sidebarCollapsed && (
            <span style={{ fontWeight: 500, fontSize: 15, color: "var(--color-text-primary)", letterSpacing: 2 }}>
              PRISM
            </span>
          )}
        </div>

        {/* Tenant */}
        {!sidebarCollapsed && (
          <div style={{ padding: "10px 14px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            <select
              value={tenant} onChange={e => setTenant(e.target.value)}
              style={{ width: "100%", fontSize: 11, padding: "6px 8px" }}>
              {TENANTS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        )}

        {/* Nav */}
        <div style={{ flex: 1, overflow: "auto", padding: "8px 6px" }}>
          {MODULES.map(m => (
            <div
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: sidebarCollapsed ? "8px 10px" : "7px 10px",
                borderRadius: "var(--border-radius-md)",
                cursor: "pointer",
                fontSize: 12,
                color: activeModule === m.id ? "var(--color-text-info)" : "var(--color-text-secondary)",
                background: activeModule === m.id ? "var(--color-background-info)" : "transparent",
                marginBottom: 2,
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
              }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{m.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span style={{ flex: 1 }}>{m.label}</span>
                  {m.badge && (
                    <span style={{
                      fontSize: 10, padding: "1px 6px",
                      borderRadius: "var(--border-radius-md)",
                      background: "var(--color-background-secondary)",
                      color: "var(--color-text-secondary)",
                    }}>{m.badge}</span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Settings */}
        {!sidebarCollapsed && (
          <div style={{
            padding: "12px 14px",
            borderTop: "0.5px solid var(--color-border-tertiary)",
            fontSize: 11, color: "var(--color-text-secondary)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D9E75" }} />
              13 platforms connected
            </div>
            <div>4,842 entities in graph</div>
          </div>
        )}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 20px",
          background: "var(--color-background-primary)",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
        }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search entities, services, APIs, repos..."
            style={{ flex: 1, fontSize: 13, maxWidth: 420 }}
          />
          <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
            {["All", "APIs", "Services", "Repos", "Infra"].map(f => (
              <button key={f} style={{
                fontSize: 11, padding: "4px 10px",
                background: f === "All" ? "var(--color-background-info)" : "transparent",
                color: f === "All" ? "var(--color-text-info)" : "var(--color-text-secondary)",
                borderColor: f === "All" ? "var(--color-border-info)" : undefined,
              }}>{f}</button>
            ))}
          </div>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            style={{
              fontSize: 11, padding: "4px 12px",
              background: chatOpen ? "var(--color-background-info)" : "transparent",
              color: chatOpen ? "var(--color-text-info)" : "var(--color-text-secondary)",
            }}>
            {chatOpen ? "◈ Copilot" : "◈ Open copilot"}
          </button>
        </div>

        {/* Content + Chat */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Main content */}
          <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
            {activeModule === "topology" && (
              <>
                {/* Metrics row */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: 10, marginBottom: 20,
                }}>
                  {HEALTH_METRICS.map(m => <MetricCard key={m.label} {...m} />)}
                </div>

                {/* Graph + sidebar */}
                <div style={{ display: "flex", gap: 16 }}>
                  {/* Graph */}
                  <div style={{
                    flex: 1,
                    background: "var(--color-background-primary)",
                    borderRadius: "var(--border-radius-lg)",
                    border: "0.5px solid var(--color-border-tertiary)",
                    padding: 16,
                    minHeight: 400,
                  }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: 12,
                    }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
                          Platform topology
                        </span>
                        <span style={{ fontSize: 11, color: "var(--color-text-secondary)", marginLeft: 8 }}>
                          {GRAPH_NODES.length} nodes · {GRAPH_EDGES.length} edges
                        </span>
                      </div>
                      <TypeLegend />
                    </div>
                    <TopologyGraph selectedNode={selectedNode} onSelectNode={setSelectedNode} />
                  </div>

                  {/* Right detail panel */}
                  <div style={{ width: 220, flexShrink: 0 }}>
                    {selectedNodeData ? (
                      <div style={{
                        background: "var(--color-background-primary)",
                        borderRadius: "var(--border-radius-lg)",
                        border: "0.5px solid var(--color-border-tertiary)",
                        padding: 14,
                      }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
                        }}>
                          <div style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: TYPE_COLORS[selectedNodeData.type],
                          }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
                            {selectedNodeData.label}
                          </span>
                        </div>
                        {[
                          ["Type", selectedNodeData.type],
                          ["Platform", selectedNodeData.platform],
                          ["Status", "Healthy"],
                          ["Last synced", "2 min ago"],
                          ["Compliance", "Passed"],
                          ["Connections", GRAPH_EDGES.filter(([a, b]) => a === selectedNode || b === selectedNode).length],
                        ].map(([k, v]) => (
                          <div key={k} style={{
                            display: "flex", justifyContent: "space-between",
                            padding: "5px 0", fontSize: 11,
                            borderBottom: "0.5px solid var(--color-border-tertiary)",
                          }}>
                            <span style={{ color: "var(--color-text-secondary)" }}>{k}</span>
                            <span style={{ color: "var(--color-text-primary)", textTransform: "capitalize" }}>{v}</span>
                          </div>
                        ))}
                        <button style={{ width: "100%", marginTop: 12, fontSize: 11 }}
                          onClick={() => setActiveModule("applens")}>
                          Open in application lens
                        </button>
                        <button style={{ width: "100%", marginTop: 6, fontSize: 11 }}
                          onClick={() => setActiveModule("blast")}>
                          Calculate blast radius
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        background: "var(--color-background-primary)",
                        borderRadius: "var(--border-radius-lg)",
                        border: "0.5px solid var(--color-border-tertiary)",
                        padding: 14,
                      }}>
                        <div style={{
                          fontSize: 12, fontWeight: 500,
                          color: "var(--color-text-primary)", marginBottom: 10,
                        }}>Connected platforms</div>
                        <PlatformStatus />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeModule === "applens" && <AppLensView />}

            {activeModule !== "topology" && activeModule !== "applens" && (
              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                height: 300, color: "var(--color-text-secondary)", fontSize: 13,
              }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>
                  {MODULES.find(m => m.id === activeModule)?.icon}
                </div>
                <div style={{ fontWeight: 500, marginBottom: 4, color: "var(--color-text-primary)" }}>
                  {MODULES.find(m => m.id === activeModule)?.label}
                </div>
                <div>Module view — production build</div>
              </div>
            )}
          </div>

          {/* Chat panel */}
          {chatOpen && (
            <div style={{
              width: 300, flexShrink: 0,
              borderLeft: "0.5px solid var(--color-border-tertiary)",
              background: "var(--color-background-primary)",
              display: "flex", flexDirection: "column",
            }}>
              <ChatPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
