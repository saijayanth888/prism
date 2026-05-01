import { useEffect, useRef, useState } from "react";

// ── Apple-inspired design tokens ──────────────────────────────────────────────
// Light: parchment canvas, warm near-black ink, single Action Blue
// Dark: inverted correctly via CSS vars
const A = {
  blue:     "#0066cc",
  blueDark: "#2997ff",   // on-dark variant
  ink:      "#1d1d1f",
  muted:    "#6e6e73",
  faint:    "#aeaeb2",
  hairline: "#d2d2d7",
  mono:     '"Geist Mono", "JetBrains Mono", monospace',
  display:  '-apple-system, "SF Pro Display", BlinkMacSystemFont, "Syne", system-ui, sans-serif',
};

// ── CPT Engine 5-Pass Animation (dark terminal — product hero) ────────────────
const PASSES = [
  { id: 1, label: "Exact match",      confidence: 1.0,  desc: "Same normalized_name + namespace" },
  { id: 2, label: "Normalized match", confidence: 0.9,  desc: "Strip -v1, prod- prefixes" },
  { id: 3, label: "Label-based",      confidence: 0.8,  desc: "3+ shared labels (app, team, domain)" },
  { id: 4, label: "Fuzzy match",      confidence: 0.6,  desc: "Levenshtein < 3 within namespace" },
  { id: 5, label: "ML similarity",    confidence: 0.85, desc: "Sentence-transformer + cosine" },
];

const SOURCES = [
  { platform: "Kubernetes", name: "payments-svc",    color: "#3B82F6" },
  { platform: "GitHub",     name: "payments-api-v2", color: "#8B5CF6" },
  { platform: "Datadog",    name: "prod-payments",   color: "#EC4899" },
];

function CptAnimation() {
  const [phase, setPhase]     = useState(0);
  const [passIdx, setPassIdx] = useState(0);
  const [resolved, setResolved] = useState(false);
  const [running, setRunning]   = useState(false);

  const run = () => {
    if (running) return;
    setRunning(true);
    setPhase(0); setPassIdx(0); setResolved(false);
    setTimeout(() => setPhase(1), 300);
    setTimeout(() => setPhase(2), 900);
    let d = 1600;
    PASSES.forEach((_, i) => { setTimeout(() => setPassIdx(i), d); d += 700; });
    setTimeout(() => { setPhase(3); setResolved(true); }, d + 200);
    setTimeout(() => setRunning(false), d + 600);
  };

  const reset = () => { setPhase(0); setPassIdx(0); setResolved(false); setRunning(false); };

  useEffect(() => { const t = setTimeout(run, 600); return () => clearTimeout(t); }, []);

  // Always dark — it's a product demo terminal
  return (
    <div style={{
      background: "#0a0a0f",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)",
    }}>
      {/* Window chrome */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
          <span style={{ marginLeft: 10, fontFamily: A.mono, fontSize: 11, color: "#555580" }}>
            cpt_engine.resolve()
          </span>
        </div>
        <button
          onClick={() => { reset(); setTimeout(run, 100); }}
          style={{ fontFamily: A.mono, fontSize: 10, color: "#444468", background: "none", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = A.blueDark; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#444468"; }}
        >
          ↺ replay
        </button>
      </div>

      <div style={{ padding: "20px 20px 24px" }}>
        {/* Source platforms */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {SOURCES.map((src, i) => (
            <div key={src.platform} style={{
              borderRadius: 10, padding: "10px 12px", textAlign: "center",
              background: phase >= 1 ? `${src.color}18` : "#0f0f1a",
              border: `1px solid ${phase >= 1 ? src.color + "40" : "rgba(255,255,255,0.05)"}`,
              transform: phase >= 1 ? "translateY(-2px)" : "none",
              transition: `all 0.5s ease ${i * 120}ms`,
            }}>
              <div style={{
                display: "inline-block", fontSize: 9, fontWeight: 700, fontFamily: A.mono,
                padding: "2px 7px", borderRadius: 4, marginBottom: 6,
                background: `${src.color}22`, color: src.color,
              }}>{src.platform}</div>
              <div style={{ fontSize: 10, fontFamily: A.mono, color: "#aaaacc", fontWeight: 600 }}>{src.name}</div>
            </div>
          ))}
        </div>

        {/* Converging arrows */}
        <div style={{ position: "relative", display: "flex", justifyContent: "center", height: 44, marginBottom: 12 }}>
          <svg width="100%" height="44" viewBox="0 0 400 44">
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill={A.blue} opacity="0.7" />
              </marker>
            </defs>
            {phase >= 2 && SOURCES.map((src, i) => (
              <line key={i}
                x1={67 + i * 133} y1={4} x2={200} y2={40}
                stroke={src.color} strokeWidth="1.2" strokeDasharray="120"
                markerEnd="url(#arrowhead)" opacity="0.6"
                style={{ animation: `cpt-flow 0.6s ease-out forwards`, animationDelay: `${i * 100}ms` }}
              />
            ))}
          </svg>
        </div>

        {/* CPT Engine box */}
        <div style={{
          borderRadius: 10, padding: "14px 16px", marginBottom: 16,
          background: phase >= 2 ? "rgba(0,102,204,0.1)" : "#0f0f1a",
          border: `1px solid ${phase >= 2 ? "rgba(0,102,204,0.35)" : "rgba(255,255,255,0.05)"}`,
          transition: "all 0.5s ease",
        }}>
          <div style={{ textAlign: "center", marginBottom: 12, fontFamily: A.mono, fontSize: 10, fontWeight: 700, color: A.blueDark, letterSpacing: "0.06em" }}>
            ⚡ CPT ENGINE — 5-Pass Resolution
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {PASSES.map((pass, i) => {
              const active = phase >= 2 && passIdx === i;
              const done   = phase >= 2 && passIdx > i;
              const show   = phase >= 2 && passIdx >= i;
              return (
                <div key={pass.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "7px 10px", borderRadius: 6,
                  background: active ? "rgba(0,102,204,0.15)" : done ? "rgba(40,200,64,0.07)" : "transparent",
                  border: `1px solid ${active ? "rgba(0,102,204,0.35)" : done ? "rgba(40,200,64,0.2)" : "transparent"}`,
                  opacity: show ? 1 : 0,
                  transform: show ? "none" : "translateX(-6px)",
                  transition: "all 0.3s ease",
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, fontFamily: A.mono,
                    background: done ? "#28c840" : active ? A.blue : "rgba(255,255,255,0.06)",
                    color: done || active ? "#fff" : "#444468",
                  }}>
                    {done ? "✓" : pass.id}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontFamily: A.mono, color: active ? A.blueDark : done ? "#86efac" : "#6868a0" }}>
                      Pass {pass.id}: {pass.label}
                    </div>
                    <div style={{ fontSize: 9, fontFamily: A.mono, color: "#333355" }}>{pass.desc}</div>
                  </div>
                  <div style={{ fontSize: 10, fontFamily: A.mono, flexShrink: 0, color: done ? "#28c840" : active ? A.blueDark : "#333355" }}>
                    {(pass.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Truth node */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{
            padding: "14px 28px", borderRadius: 10, textAlign: "center",
            background: resolved ? "rgba(0,102,204,0.1)" : "#0f0f1a",
            border: `1px solid ${resolved ? "rgba(0,102,204,0.4)" : "rgba(255,255,255,0.05)"}`,
            opacity: resolved ? 1 : 0.3,
            transform: resolved ? "scale(1.02)" : "scale(0.98)",
            transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)",
            boxShadow: resolved ? "0 0 40px rgba(0,102,204,0.12)" : "none",
          }}>
            <div style={{ fontSize: 9, fontFamily: A.mono, letterSpacing: "0.18em", color: resolved ? A.blueDark : "#333355", marginBottom: 4 }}>
              TRUTH NODE · CONFIDENCE 0.97
            </div>
            <div style={{ fontSize: 15, fontFamily: A.mono, fontWeight: 700, color: resolved ? "#e4e4f0" : "#333355" }}>
              payments-svc
            </div>
            <div style={{ fontSize: 9, fontFamily: A.mono, color: resolved ? A.blueDark : "#333355", marginTop: 3 }}>
              3 platform sources → 1 unified entity
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cpt-flow {
          from { stroke-dashoffset: 120; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: "cpt",        label: "CPT Engine"    },
  { id: "api",        label: "API Reference" },
  { id: "entities",   label: "Entity Types"  },
  { id: "compliance", label: "Compliance"    },
];

const API_ENDPOINTS = [
  { method: "GET",  path: "/api/v1/topology",                  desc: "Full topology graph, nodes + edges" },
  { method: "GET",  path: "/api/v1/entities/:id",              desc: "Entity 360° — deps, health, compliance" },
  { method: "GET",  path: "/api/v1/entities/:id/blast-radius", desc: "BFS cascading failure analysis" },
  { method: "POST", path: "/api/v1/copilot/chat",              desc: "Iris AI — graph-grounded response" },
  { method: "WS",   path: "/api/v1/copilot/stream",            desc: "Streaming WebSocket for Iris" },
  { method: "GET",  path: "/api/v1/compliance/dashboard",      desc: "PCI-DSS, SOC2, HIPAA posture" },
  { method: "GET",  path: "/api/v1/health/dashboard",          desc: "Composite health scores" },
  { method: "GET",  path: "/api/v1/connectors",                desc: "Platform sync status + entity counts" },
];

const METHOD_COLOR: Record<string, string> = {
  GET:    "#28a745",
  POST:   "#0066cc",
  WS:     "#7c3aed",
  DELETE: "#dc3545",
};

const ENTITY_TYPES = [
  "Application", "Service", "API", "Deployment", "Container", "Repository",
  "Pipeline", "Image", "Namespace", "Topic", "Database", "Secret",
  "Policy", "Vulnerability", "Environment", "Domain", "Team",
];

// ── Docs Page ──────────────────────────────────────────────────────────────────
export default function Docs() {
  const [active, setActive] = useState("cpt");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollTo = (id: string) => {
    setActive(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex h-full" style={{ background: "var(--p-bg-main)" }}>

      {/* ── Left nav ──────────────────────────────────────────────── */}
      <nav style={{
        width: 192,
        flexShrink: 0,
        padding: "28px 0 20px",
        background: "var(--p-bg-deep)",
        borderRight: "1px solid var(--p-border)",
        display: "flex",
        flexDirection: "column",
      }}>
        <div style={{ padding: "0 16px 20px", borderBottom: "1px solid var(--p-border)" }}>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: "var(--p-text-3)",
            fontFamily: A.display,
            textTransform: "uppercase",
          }}>
            Prism Docs
          </span>
        </div>

        <div style={{ padding: "12px 8px", flex: 1 }}>
          {SECTIONS.map((s) => {
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  padding: "7px 10px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: A.display,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--p-accent)" : "var(--p-text-2)",
                  background: isActive ? "var(--p-accent-subtle)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                  transition: "all 0.12s ease",
                  marginBottom: 1,
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--p-text-1)"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--p-text-2)"; }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: "12px 18px 0", borderTop: "1px solid var(--p-border)" }}>
          <span style={{ fontSize: 10, fontFamily: A.mono, color: "var(--p-text-3)" }}>
            v1.0 · patent-pending
          </span>
        </div>
      </nav>

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        <div style={{ maxWidth: 780, padding: "48px 56px 80px", margin: "0 auto" }}>

          {/* ── CPT Engine ─────────────────────────────────────────── */}
          <section ref={(el) => { sectionRefs.current["cpt"] = el; }} style={{ marginBottom: 80 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <h2 style={{
                  fontFamily: A.display,
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  color: "var(--p-text-1)",
                  margin: 0,
                }}>
                  CPT Engine
                </h2>
                <span style={{
                  fontSize: 10,
                  fontFamily: A.mono,
                  padding: "3px 8px",
                  borderRadius: 100,
                  background: "var(--p-accent-subtle)",
                  color: "var(--p-accent)",
                  border: "1px solid var(--p-accent-border)",
                  letterSpacing: "0.04em",
                }}>
                  patent-pending
                </span>
              </div>
              <p style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--p-text-2)",
                fontFamily: A.display,
                maxWidth: 580,
                margin: 0,
              }}>
                Convergent Perspective Topology — a 5-pass entity resolution algorithm
                that unifies the same logical service across 13 platforms without fragile
                name matching. A Kubernetes pod named{" "}
                <code style={{ fontFamily: A.mono, fontSize: 12, padding: "1px 5px", borderRadius: 4, background: "var(--p-bg-card)", border: "1px solid var(--p-border)", color: "var(--p-accent)" }}>payments-svc</code>,
                {" "}a GitHub repo named{" "}
                <code style={{ fontFamily: A.mono, fontSize: 12, padding: "1px 5px", borderRadius: 4, background: "var(--p-bg-card)", border: "1px solid var(--p-border)", color: "var(--p-text-2)" }}>payments-api-v2</code>,
                {" "}and a Datadog monitor named{" "}
                <code style={{ fontFamily: A.mono, fontSize: 12, padding: "1px 5px", borderRadius: 4, background: "var(--p-bg-card)", border: "1px solid var(--p-border)", color: "var(--p-text-2)" }}>prod-payments</code>
                {" "}all resolve to one truth node.
              </p>
            </div>

            {/* CPT Animation — dark product hero on light canvas */}
            <div style={{ marginBottom: 32 }}>
              <CptAnimation />
            </div>

            {/* Resolution passes table */}
            <div style={{ border: "1px solid var(--p-border)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{
                padding: "10px 16px",
                background: "var(--p-bg-card)",
                borderBottom: "1px solid var(--p-border)",
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--p-text-3)", fontFamily: A.display }}>
                  Resolution Passes
                </span>
              </div>
              {PASSES.map((p, i) => (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "10px 16px",
                  borderBottom: i < PASSES.length - 1 ? "1px solid var(--p-border)" : "none",
                  background: "var(--p-bg-main)",
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, fontFamily: A.mono,
                    background: "var(--p-accent-subtle)", color: "var(--p-accent)",
                  }}>
                    {p.id}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, fontFamily: A.display, color: "var(--p-text-1)" }}>
                      {p.label}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: A.mono, color: "var(--p-text-3)", marginLeft: 10 }}>
                      {p.desc}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: A.mono, color: "var(--p-accent)", flexShrink: 0 }}>
                    {(p.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── API Reference ──────────────────────────────────────── */}
          <section ref={(el) => { sectionRefs.current["api"] = el; }} style={{ marginBottom: 80 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{
                fontFamily: A.display, fontSize: 28, fontWeight: 700,
                letterSpacing: "-0.03em", lineHeight: 1.1, color: "var(--p-text-1)",
                margin: "0 0 8px",
              }}>
                API Reference
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--p-text-2)", fontFamily: A.display, margin: 0 }}>
                REST API at{" "}
                <code style={{ fontFamily: A.mono, fontSize: 12, padding: "1px 5px", borderRadius: 4, background: "var(--p-bg-card)", border: "1px solid var(--p-border)", color: "var(--p-accent)" }}>
                  localhost:8000
                </code>
                {" "}· WebSocket for real-time streaming
              </p>
            </div>

            <div style={{ border: "1px solid var(--p-border)", borderRadius: 12, overflow: "hidden" }}>
              {API_ENDPOINTS.map((ep, i) => (
                <div
                  key={ep.path}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
                    borderBottom: i < API_ENDPOINTS.length - 1 ? "1px solid var(--p-border)" : "none",
                    background: "var(--p-bg-main)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--p-bg-elevated)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--p-bg-main)"; }}
                >
                  <span style={{
                    fontSize: 9, fontFamily: A.mono, fontWeight: 700, flexShrink: 0,
                    padding: "3px 7px", borderRadius: 4, minWidth: 40, textAlign: "center",
                    background: `${METHOD_COLOR[ep.method]}14`, color: METHOD_COLOR[ep.method],
                    border: `1px solid ${METHOD_COLOR[ep.method]}30`,
                  }}>
                    {ep.method}
                  </span>
                  <code style={{ fontSize: 12, fontFamily: A.mono, color: "var(--p-text-1)", flex: 1 }}>
                    {ep.path}
                  </code>
                  <span style={{ fontSize: 11, color: "var(--p-text-3)", flexShrink: 0, maxWidth: 200, textAlign: "right", fontFamily: A.display }}>
                    {ep.desc}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Entity Types ────────────────────────────────────────── */}
          <section ref={(el) => { sectionRefs.current["entities"] = el; }} style={{ marginBottom: 80 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{
                fontFamily: A.display, fontSize: 28, fontWeight: 700,
                letterSpacing: "-0.03em", lineHeight: 1.1, color: "var(--p-text-1)",
                margin: "0 0 8px",
              }}>
                Entity Types
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--p-text-2)", fontFamily: A.display, margin: 0 }}>
                17 entity types tracked across the unified knowledge graph.
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ENTITY_TYPES.map((et) => (
                <div key={et} style={{
                  padding: "6px 13px", borderRadius: 100,
                  fontSize: 12, fontFamily: A.display, fontWeight: 500,
                  color: "var(--p-text-2)",
                  background: "var(--p-bg-card)",
                  border: "1px solid var(--p-border)",
                  letterSpacing: "-0.01em",
                }}>
                  {et}
                </div>
              ))}
            </div>
          </section>

          {/* ── Compliance ──────────────────────────────────────────── */}
          <section ref={(el) => { sectionRefs.current["compliance"] = el; }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{
                fontFamily: A.display, fontSize: 28, fontWeight: 700,
                letterSpacing: "-0.03em", lineHeight: 1.1, color: "var(--p-text-1)",
                margin: "0 0 8px",
              }}>
                Compliance Frameworks
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--p-text-2)", fontFamily: A.display, margin: 0 }}>
                Automated policy evaluation against 3 major frameworks.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 1, border: "1px solid var(--p-border)", borderRadius: 12, overflow: "hidden" }}>
              {[
                { name: "PCI-DSS 3.2",  controls: 12, color: "#e3342f", desc: "Payment card data protection" },
                { name: "SOC 2 Type II", controls:  8, color: "#38a169", desc: "Trust service criteria — CC6 through CC9" },
                { name: "HIPAA",         controls:  6, color: "#0066cc", desc: "Health data safeguards — technical controls" },
              ].map((fw, i, arr) => (
                <div key={fw.name} style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                  background: "var(--p-bg-main)",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--p-border)" : "none",
                  transition: "background 0.1s",
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--p-bg-elevated)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--p-bg-main)"; }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: fw.color,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: A.display, letterSpacing: "-0.01em", color: "var(--p-text-1)", marginBottom: 2 }}>
                      {fw.name}
                    </div>
                    <div style={{ fontSize: 12, fontFamily: A.display, color: "var(--p-text-3)" }}>
                      {fw.desc}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11, fontFamily: A.mono, color: fw.color,
                    padding: "3px 10px", borderRadius: 100,
                    background: `${fw.color}12`, border: `1px solid ${fw.color}28`,
                  }}>
                    {fw.controls} controls
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
