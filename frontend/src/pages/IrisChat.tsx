import { Trash2, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ChatMessage from "../components/copilot/ChatMessage";
import SuggestedQueries from "../components/copilot/SuggestedQueries";
import { useIris } from "../hooks/useIris";
import { useChatStore } from "../stores/chat";
import type { Persona } from "../types";

const PERSONAS: { value: Persona; label: string; desc: string }[] = [
  { value: "developer",     label: "Developer",  desc: "Dependencies · APIs · services" },
  { value: "sre",           label: "SRE",        desc: "Blast radius · health · incidents" },
  { value: "product_owner", label: "Product",    desc: "Capabilities · ownership · roadmap" },
  { value: "auditor",       label: "Auditor",    desc: "Compliance · evidence · policies" },
  { value: "executive",     label: "Executive",  desc: "Risk posture · KPIs · posture" },
];

const CAPABILITY_CARDS = [
  {
    icon: "⚡",
    title: "Blast Radius",
    desc: "Find cascading failures before they cascade",
    query: "What would break if payments-api went down?",
    gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
    glow: "rgba(249,115,22,0.20)",
  },
  {
    icon: "✓",
    title: "Compliance",
    desc: "Check policy gaps across PCI-DSS and SOC2",
    query: "Show me PCI-DSS compliance gaps",
    gradient: "linear-gradient(135deg, #1456f0 0%, #3daeff 100%)",
    glow: "rgba(20,86,240,0.20)",
  },
  {
    icon: "🌐",
    title: "Dependencies",
    desc: "Map upstream and downstream service connections",
    query: "Show all dependencies of orders-svc",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
    glow: "rgba(124,58,237,0.20)",
  },
  {
    icon: "♥",
    title: "Health Score",
    desc: "Composite health across all monitored services",
    query: "Which services have health scores below 80%?",
    gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    glow: "rgba(5,150,105,0.20)",
  },
];

const DEMO_MESSAGES = [
  {
    id: "d1", role: "user" as const,
    text: "What would break if payments-api went down?",
    timestamp: Date.now() - 120000,
  },
  {
    id: "d2", role: "assistant" as const,
    text: `Based on live graph traversal, a failure of [entity:payments-api] would cascade to **5 services** across **2 teams**.\n\nDirect impact (4 nodes):\n- [entity:orders-svc] — DEPENDS_ON payments-api\n- [entity:notification-svc] — SUBSCRIBES_TO payments.events\n- [entity:analytics-svc] — SUBSCRIBES_TO payments.events\n- [entity:gateway-prod] — GATEWAY_FOR payments-api\n\nIndirect impact (1 node):\n- [entity:reporting-svc] — via analytics-svc\n\nTeams affected: payments-team, orders-team\n\nHealth of [entity:payments-api] is currently 88% with a −1% trend. Recommend circuit breaker for [entity:orders-svc].`,
    timestamp: Date.now() - 119000,
    toolsUsed: ["calculate_blast_radius", "get_health_score"],
    confidence: 0.97,
  },
];

const ui   = '"DM Sans", "Helvetica Neue", sans-serif';
const disp = '"Outfit", "Helvetica Neue", sans-serif';

export default function IrisChat() {
  const [input, setInput]     = useState("");
  const [showDemo, setShowDemo] = useState(true);
  const [focused, setFocused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const { isStreaming, persona, setPersona, clearMessages } = useChatStore();
  const { sendMessage, connected, messages } = useIris();

  const displayMessages = showDemo && messages.length === 0 ? DEMO_MESSAGES : messages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, isStreaming]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setShowDemo(false);
    setInput("");
    sendMessage(text);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--p-bg)", fontFamily: ui }}>

      {/* ── Page title ──────────────────────────────────── */}
      <div style={{ padding: "20px 28px 0" }}>
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] mb-1" style={{ color: "var(--p-text-3)" }}>
          AI COPILOT · GRAPH-GROUNDED
        </div>
        <h1 style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontSize: 24, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--p-text-1)", margin: 0 }}>
          Iris
        </h1>
        <p className="text-xs mt-1 font-mono" style={{ color: "var(--p-text-3)" }}>
          Ask anything about your infrastructure — Iris reads the live graph and cites every answer. No hallucinations.
        </p>
      </div>

      {/* ── Header ─────────────────────────────────────── */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{
          background: "var(--p-bg)",
          borderBottom: "1px solid var(--p-border)",
          padding: "12px 28px 0",
          height: 56,
        }}
      >
        <div className="flex items-center gap-5">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #1456f0 0%, #3daeff 100%)" }}
            >
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: disp }}>I</span>
            </div>
            <span style={{ fontFamily: disp, fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--p-text-1)" }}>
              Iris
            </span>
            <div
              className="flex items-center gap-1.5 px-2.5 py-0.5"
              style={{
                background: connected ? "rgba(5,150,105,0.08)" : "var(--p-bg-card)",
                border: `1px solid ${connected ? "rgba(5,150,105,0.25)" : "var(--p-border)"}`,
                borderRadius: 9999,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: connected ? "#059669" : "var(--p-text-3)",
                  boxShadow: connected ? "0 0 5px rgba(5,150,105,0.6)" : "none",
                }}
              />
              <span style={{ fontSize: 10, fontWeight: 600, color: connected ? "#059669" : "var(--p-text-3)", fontFamily: ui }}>
                {connected ? "Live" : "Demo"}
              </span>
            </div>
          </div>

          {/* Persona Pills */}
          <div
            className="flex items-center gap-1"
            style={{ borderLeft: "1px solid var(--p-border)", paddingLeft: 20 }}
          >
            {PERSONAS.map((p) => {
              const active = persona === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => setPersona(p.value)}
                  title={p.desc}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 9999,
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    background: active ? "var(--p-text-1)" : "transparent",
                    color: active ? "var(--p-bg)" : "var(--p-text-2)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontFamily: ui,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "var(--p-bg-card)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => { clearMessages(); setShowDemo(false); }}
          className="flex items-center gap-1.5"
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            background: "var(--p-bg-card)",
            border: "1px solid var(--p-border)",
            color: "var(--p-text-2)",
            cursor: "pointer",
            fontFamily: ui,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-red, #ef4444)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-2)"; }}
        >
          <Trash2 size={12} />
          Clear
        </button>
      </div>

      {/* ── Messages ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {displayMessages.length === 0 ? (
          <div className="max-w-2xl mx-auto px-8 py-12">
            <div className="mb-8">
              <div style={{ fontSize: 11, color: "var(--p-text-3)", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: ui }}>
                Infrastructure Copilot
              </div>
              <div style={{ fontFamily: disp, fontSize: 32, fontWeight: 600, color: "var(--p-text-1)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
                Query your entire<br />infrastructure
              </div>
              <div style={{ fontSize: 15, color: "var(--p-text-2)", marginTop: 10, fontFamily: ui, lineHeight: 1.5 }}>
                Graph-grounded answers across{" "}
                <span style={{ color: "var(--p-text-1)", fontWeight: 500 }}>1,675 entities</span>{" "}
                · 13 platforms
              </div>
            </div>

            {/* Capability cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 32 }}>
              {CAPABILITY_CARDS.map((card) => (
                <button
                  key={card.title}
                  onClick={() => { setInput(card.query); setShowDemo(false); inputRef.current?.focus(); }}
                  style={{
                    background: card.gradient,
                    borderRadius: 20,
                    padding: "20px 20px 18px",
                    textAlign: "left",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: `${card.glow} 0px 8px 24px`,
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = `${card.glow} 0px 16px 32px`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = `${card.glow} 0px 8px 24px`;
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 10 }}>{card.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", fontFamily: disp, marginBottom: 5, letterSpacing: "-0.01em" }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.82)", fontFamily: ui, lineHeight: 1.5 }}>
                    {card.desc}
                  </div>
                </button>
              ))}
            </div>

            <SuggestedQueries onSelect={(q) => { setInput(q); setShowDemo(false); inputRef.current?.focus(); }} />
          </div>
        ) : (
          <div>
            {showDemo && messages.length === 0 && (
              <div
                className="flex items-center gap-2 px-8 py-2"
                style={{ background: "rgba(20,86,240,0.06)", borderBottom: "1px solid rgba(20,86,240,0.12)" }}
              >
                <Zap size={10} style={{ color: "#1456f0" }} />
                <span style={{ fontSize: 11, color: "#1456f0", fontFamily: ui, fontWeight: 500 }}>
                  Demo conversation — type to start a live session
                </span>
              </div>
            )}
            {displayMessages.map((msg) => (
              <ChatMessage key={msg.id} message={msg as any} />
            ))}
          </div>
        )}

        {isStreaming && (
          <div className="flex items-start gap-3 px-8 py-5" style={{ borderBottom: "1px solid var(--p-border)" }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #1456f0 0%, #3daeff 100%)", marginTop: 1 }}
            >
              <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: disp }}>I</span>
            </div>
            <div
              className="flex items-center gap-1.5 px-4 py-3"
              style={{
                background: "var(--p-bg-card)",
                borderRadius: "4px 16px 16px 16px",
                border: "1px solid var(--p-border)",
              }}
            >
              {[0, 0.18, 0.36].map((delay) => (
                <div
                  key={delay}
                  style={{
                    width: 7, height: 7, borderRadius: 9999,
                    background: "#1456f0",
                    animation: `dot-bounce 1.2s ease-in-out infinite`,
                    animationDelay: `${delay}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ──────────────────────────────────────── */}
      <div
        className="flex-shrink-0"
        style={{ background: "var(--p-bg)", borderTop: "1px solid var(--p-border)", padding: "16px 28px 20px" }}
      >
        <div
          className="flex items-center gap-3"
          style={{
            background: "var(--p-bg-card)",
            border: `1.5px solid ${focused ? "#1456f0" : "var(--p-border)"}`,
            borderRadius: 12,
            padding: "10px 10px 10px 16px",
            transition: "border-color 0.15s, box-shadow 0.15s",
            boxShadow: focused ? "rgba(20,86,240,0.10) 0px 0px 0px 3px" : "none",
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={`Ask as ${persona.replace("_", " ")} about your infrastructure…`}
            disabled={isStreaming}
            className="flex-1 bg-transparent outline-none disabled:opacity-40"
            style={{ fontSize: 14, color: "var(--p-text-1)", fontFamily: ui }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: input.trim() && !isStreaming ? "var(--p-text-1)" : "transparent",
              color: input.trim() && !isStreaming ? "var(--p-bg)" : "var(--p-text-3)",
              border: "none",
              cursor: input.trim() && !isStreaming ? "pointer" : "default",
              transition: "all 0.15s",
              fontFamily: ui,
              opacity: isStreaming ? 0.4 : 1,
              flexShrink: 0,
            }}
          >
            Send
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span style={{ fontSize: 11, color: "var(--p-text-3)", fontFamily: ui }}>
            Graph-grounded · never hallucinated
          </span>
          <span style={{ fontSize: 11, color: "var(--p-text-3)", fontFamily: ui }}>
            {connected ? "Live data" : "Demo mode"} · Enter to send
          </span>
        </div>
      </div>

      <style>{`
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
