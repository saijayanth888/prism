import { useState, useEffect, useRef } from "react";

const CPT_IDENTITIES = [
  { system: "iChannel", color: "#00BCD4", id: "#IC-1247", name: "ABC Manufacturing Corp", tag: "client_file" },
  { system: "CCH Axcess", color: "#2563EB", id: "T2024-089", name: "ABC Mfg. Corp — Tax 2024", tag: "engagement" },
  { system: "Rillet ERP", color: "#7C3AED", id: "NYABC-001", name: "ABC Corp (NY) — Revenue", tag: "gl_center" },
  { system: "Microsoft 365", color: "#0078D4", id: "abc-corp@wiss.com", name: "ABC Corp Project", tag: "teams_channel" },
];

const IRIS_QA = [
  {
    q: "Which clients have open reconciliation exceptions?",
    a: "I found 23 open reconciliation exceptions across your client portfolio. The highest-priority items are:\n\n→ ABC Corp (Rillet ↔ CCH variance: $47K, aging 8 days)\n→ Meridian Partners (iChannel document missing for Q3 engagement)\n→ TechVentures LLC (Basis AI flagged 3 unmatched journal entries)\n\nAll 23 exceptions are cross-referenced against your iChannel workflow status and Rillet GL data. [View full exception report →]",
  },
  {
    q: "What's the Q1 2025 month-end close status?",
    a: "Q1 close is 91% complete across 156 active engagements. 14 engagements have open items blocking finalization:\n\n→ 9 awaiting client document delivery (tracked in iChannel)\n→ 3 have CCH tax form dependencies pending\n→ 2 are pending partner review sign-off\n\nEstimated full close: April 18. No engagements are at risk of deadline breach. [View close checklist →]",
  },
  {
    q: "Which partners have the most overdue client items?",
    a: "Top 3 partners by overdue item count:\n\n→ J. Rodriguez — 14 items, avg 12 days overdue (primarily tax extension requests)\n→ M. Chen — 9 items, avg 6 days (document requests pending in iChannel)\n→ S. Patel — 7 items, avg 4 days (Rillet reconciliation approvals)\n\nAll items are linked to their source system for one-click resolution. [View partner dashboard →]",
  },
];

const TOOLS = [
  { name: "Microsoft 365", color: "#0078D4", icon: "☁️", pos: { top: "8%", left: "4%" } },
  { name: "iChannel", color: "#00BCD4", icon: "📁", pos: { top: "2%", left: "29%" } },
  { name: "CCH Axcess", color: "#2563EB", icon: "📊", pos: { top: "2%", right: "29%" } },
  { name: "Rillet ERP", color: "#7C3AED", icon: "💰", pos: { top: "8%", right: "4%" } },
  { name: "Basis AI", color: "#059669", icon: "🤖", pos: { bottom: "8%", left: "44%" } },
];

export default function WissDemo() {
  const [activeQ, setActiveQ] = useState<number | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [cptVisible, setCptVisible] = useState(false);
  const cptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setCptVisible(true); },
      { threshold: 0.2 }
    );
    if (cptRef.current) observer.observe(cptRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (activeQ === null || !isTyping) return;
    const fullText = IRIS_QA[activeQ].a;
    if (displayedText.length >= fullText.length) { setIsTyping(false); return; }
    const timer = setTimeout(() => {
      setDisplayedText(fullText.slice(0, displayedText.length + 4));
    }, 14);
    return () => clearTimeout(timer);
  }, [activeQ, displayedText, isTyping]);

  const ask = (index: number) => {
    setActiveQ(index);
    setDisplayedText("");
    setIsTyping(true);
  };

  return (
    <div style={{ background: "#07090E", minHeight: "100vh", color: "#F1F5F9", fontFamily: '"Geist", system-ui, sans-serif' }}>
      <style>{`
        @keyframes wiss-fadeup { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes wiss-conv-l { from { opacity: 0; transform: translateX(-24px) translateY(-8px); } to { opacity: 1; transform: none; } }
        @keyframes wiss-conv-r { from { opacity: 0; transform: translateX(24px) translateY(-8px); } to { opacity: 1; transform: none; } }
        @keyframes wiss-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); } 60% { box-shadow: 0 0 28px 6px rgba(245,158,11,0.18); } }
        @keyframes wiss-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        .wiss-fu { animation: wiss-fadeup 0.6s ease forwards; }
        .wiss-cl { animation: wiss-conv-l 0.7s ease forwards; }
        .wiss-cr { animation: wiss-conv-r 0.7s ease forwards; }
        .wiss-pulse { animation: wiss-pulse 3s ease-in-out infinite; }
        .wiss-cursor { animation: wiss-blink 0.8s step-end infinite; }
        .iris-btn:hover { background: rgba(245,158,11,0.07) !important; border-color: rgba(245,158,11,0.28) !important; color: #FEF3C7 !important; }
      `}</style>

      {/* Nav */}
      <nav style={{ padding: "14px 48px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(7,9,14,0.92)", backdropFilter: "blur(12px)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "26px", height: "26px", background: "linear-gradient(135deg, #F59E0B, #B45309)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#000", fontWeight: 900, fontSize: "13px", fontFamily: '"Instrument Sans", system-ui' }}>P</span>
          </div>
          <span style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontWeight: 800, fontSize: "15px", letterSpacing: "-0.02em" }}>PRISM</span>
          <span style={{ fontSize: "9px", fontFamily: '"Geist Mono", monospace', color: "#F59E0B", background: "rgba(245,158,11,0.09)", border: "1px solid rgba(245,158,11,0.25)", padding: "2px 8px", borderRadius: "4px", letterSpacing: "0.1em" }}>FOR PROFESSIONAL SERVICES</span>
        </div>
        <div style={{ fontSize: "9px", fontFamily: '"Geist Mono", monospace', color: "#334155", letterSpacing: "0.1em" }}>
          PREPARED FOR WISS &amp; COMPANY · MAY 2026 · CONFIDENTIAL
        </div>
      </nav>

      <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 48px 96px" }}>

        {/* Hero */}
        <div style={{ padding: "80px 0 56px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", fontFamily: '"Geist Mono", monospace', color: "#F59E0B", letterSpacing: "0.18em", marginBottom: "18px" }}>
            CPT ENGINE · ENTITY RESOLUTION FOR PROFESSIONAL SERVICES
          </div>
          <h1 style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontSize: "54px", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.04, margin: "0 0 22px", color: "#F8FAFC" }}>
            Every client. Every system.<br />
            <span style={{ color: "#F59E0B" }}>One unified truth.</span>
          </h1>
          <p style={{ fontSize: "17px", color: "#64748B", maxWidth: "560px", margin: "0 auto", lineHeight: 1.65 }}>
            Prism's patent-pending CPT Engine automatically resolves client identities across your entire tool stack — without replacing or migrating a single system.
          </p>
        </div>

        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "72px" }}>
          {[
            { label: "Client Identities Unified", value: "847", sub: "across 5 systems", color: "#F59E0B" },
            { label: "Tools Connected", value: "5", sub: "M365, CCH, iChannel, Rillet, Basis", color: "#22D3EE" },
            { label: "Open Reconciliation Gaps", value: "23", sub: "auto-detected", color: "#EF4444" },
            { label: "Q1 Close Progress", value: "91%", sub: "156 engagements tracked", color: "#22C55E" },
          ].map((k) => (
            <div key={k.label} style={{ padding: "18px 20px", background: "#0D1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px" }}>
              <div style={{ fontSize: "9px", fontFamily: '"Geist Mono", monospace', color: "#334155", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: "10px" }}>{k.label}</div>
              <div style={{ fontSize: "30px", fontFamily: '"Geist Mono", monospace', fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: "9px", color: "#334155", marginTop: "6px", fontFamily: '"Geist Mono", monospace', lineHeight: 1.4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* CPT Resolution */}
        <div ref={cptRef} style={{ marginBottom: "72px" }}>
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: "10px", fontFamily: '"Geist Mono", monospace', color: "#F59E0B", letterSpacing: "0.16em", marginBottom: "10px" }}>THE PROBLEM WE SOLVE</div>
            <h2 style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontSize: "30px", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 8px" }}>One client. Four identities. Zero visibility.</h2>
            <p style={{ color: "#475569", fontSize: "14px", margin: 0 }}>Your client "ABC Corp" exists in 4 systems with 4 different IDs. CPT resolves them automatically.</p>
          </div>

          {/* Source identity cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginBottom: "14px" }}>
            {CPT_IDENTITIES.map((id, i) => (
              <div key={id.system}
                className={cptVisible ? (i < 2 ? "wiss-cl" : "wiss-cr") : ""}
                style={{ opacity: cptVisible ? undefined : 0, animationDelay: `${i * 0.1}s`, padding: "14px 16px", background: "#0D1117", border: `1px solid ${id.color}28`, borderRadius: "10px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${id.color}80, ${id.color}20)` }} />
                <div style={{ fontSize: "9px", fontFamily: '"Geist Mono", monospace', color: id.color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>{id.system}</div>
                <div style={{ fontSize: "9px", fontFamily: '"Geist Mono", monospace', color: "#1E293B", marginBottom: "3px" }}>{id.tag}</div>
                <div style={{ fontSize: "10px", fontFamily: '"Geist Mono", monospace', color: "#475569", marginBottom: "8px", wordBreak: "break-all" }}>{id.id}</div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#CBD5E1", lineHeight: 1.35 }}>{id.name}</div>
              </div>
            ))}
          </div>

          {/* Arrow / engine */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0", marginBottom: "12px", opacity: cptVisible ? 1 : 0, transition: "opacity 0.7s ease 0.45s" }}>
            <div style={{ display: "flex", gap: "188px" }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width: "1px", height: "20px", background: `linear-gradient(to bottom, rgba(245,158,11,0.2), rgba(245,158,11,0.7))` }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 20px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "6px" }}>
              <div style={{ width: "5px", height: "5px", background: "#F59E0B", borderRadius: "50%", boxShadow: "0 0 8px #F59E0B" }} />
              <span style={{ fontSize: "9px", fontFamily: '"Geist Mono", monospace', color: "#F59E0B", letterSpacing: "0.14em" }}>CPT ENGINE · 5-PASS ENTITY RESOLUTION · PATENT PENDING</span>
              <div style={{ width: "5px", height: "5px", background: "#F59E0B", borderRadius: "50%", boxShadow: "0 0 8px #F59E0B" }} />
            </div>
            <div style={{ width: "1px", height: "20px", background: "linear-gradient(to bottom, rgba(245,158,11,0.7), rgba(245,158,11,0.2))" }} />
          </div>

          {/* Resolved card */}
          <div
            className={cptVisible ? "wiss-pulse" : ""}
            style={{ opacity: cptVisible ? 1 : 0, transition: "opacity 0.6s ease 0.85s, transform 0.6s ease 0.85s", transform: cptVisible ? "translateY(0)" : "translateY(14px)", maxWidth: "380px", margin: "0 auto", padding: "20px 24px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "9px", fontFamily: '"Geist Mono", monospace', color: "#92400E", letterSpacing: "0.12em", marginBottom: "10px" }}>✓ CPT RESOLVED · CONFIDENCE: HIGH</div>
            <div style={{ fontSize: "24px", fontWeight: 800, fontFamily: '"Instrument Sans", system-ui', letterSpacing: "-0.03em", color: "#FEF3C7" }}>ABC Corp</div>
            <div style={{ fontSize: "10px", color: "#78350F", fontFamily: '"Geist Mono", monospace', marginTop: "6px" }}>4 identities · 4 systems · 1 unified entity</div>
          </div>
          <p style={{ textAlign: "center", fontSize: "11px", color: "#1E293B", marginTop: "14px", fontFamily: '"Geist Mono", monospace' }}>
            847 client entities resolved automatically. Zero manual mapping.
          </p>
        </div>

        {/* Topology */}
        <div style={{ marginBottom: "72px" }}>
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "10px", fontFamily: '"Geist Mono", monospace', color: "#F59E0B", letterSpacing: "0.16em", marginBottom: "10px" }}>UNIFIED TOPOLOGY</div>
            <h2 style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontSize: "30px", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 8px" }}>Your entire stack. One intelligence layer.</h2>
            <p style={{ color: "#475569", fontSize: "14px", margin: 0 }}>Keep every tool you have. Get cross-system visibility you've never had.</p>
          </div>

          <div style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "40px 48px" }}>
            <div style={{ position: "relative", height: "240px" }}>
              <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} aria-hidden="true">
                {[
                  { x1: "50%", y1: "50%", x2: "11%", y2: "22%" },
                  { x1: "50%", y1: "50%", x2: "32%", y2: "10%" },
                  { x1: "50%", y1: "50%", x2: "68%", y2: "10%" },
                  { x1: "50%", y1: "50%", x2: "89%", y2: "22%" },
                  { x1: "50%", y1: "50%", x2: "50%", y2: "86%" },
                ].map((l, i) => (
                  <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="rgba(245,158,11,0.18)" strokeWidth="1.5" strokeDasharray="5 5" />
                ))}
              </svg>

              {TOOLS.map((t) => (
                <div key={t.name} style={{ position: "absolute", ...t.pos, padding: "10px 14px", background: "#080B10", border: `1px solid ${t.color}35`, borderRadius: "8px", textAlign: "center", minWidth: "108px" }}>
                  <div style={{ fontSize: "18px", marginBottom: "5px" }}>{t.icon}</div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: t.color, fontFamily: '"Geist Mono", monospace', lineHeight: 1.3 }}>{t.name}</div>
                </div>
              ))}

              {/* Center node */}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "88px", height: "88px", background: "rgba(245,158,11,0.09)", border: "2px solid rgba(245,158,11,0.45)", borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(245,158,11,0.12)" }}>
                <div style={{ width: "22px", height: "22px", background: "#F59E0B", borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "5px" }}>
                  <span style={{ color: "#000", fontWeight: 900, fontSize: "12px", fontFamily: '"Instrument Sans", system-ui' }}>P</span>
                </div>
                <div style={{ fontSize: "9px", fontFamily: '"Geist Mono", monospace', color: "#F59E0B", letterSpacing: "0.1em" }}>PRISM</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "40px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: "8px" }}>
              {[
                { label: "Unified entity graph", value: "847 clients" },
                { label: "Cross-system queries", value: "Real-time" },
                { label: "Manual reconciliation", value: "Eliminated" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#F59E0B", fontFamily: '"Geist Mono", monospace' }}>{s.value}</div>
                  <div style={{ fontSize: "10px", color: "#334155", marginTop: "3px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Iris Demo */}
        <div style={{ marginBottom: "72px" }}>
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "10px", fontFamily: '"Geist Mono", monospace', color: "#F59E0B", letterSpacing: "0.16em", marginBottom: "10px" }}>ASK IRIS · ACCOUNTING INTELLIGENCE</div>
            <h2 style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontSize: "30px", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 8px" }}>One question. Every system.</h2>
            <p style={{ color: "#475569", fontSize: "14px", margin: 0 }}>Iris queries across iChannel, CCH, Rillet, Basis AI, and M365 simultaneously — in plain English.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.65fr", background: "#0D1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", overflow: "hidden", minHeight: "280px" }}>
            {/* Questions panel */}
            <div style={{ borderRight: "1px solid rgba(255,255,255,0.05)", padding: "24px 20px" }}>
              <div style={{ fontSize: "9px", fontFamily: '"Geist Mono", monospace', color: "#334155", letterSpacing: "0.1em", marginBottom: "14px" }}>SUGGESTED QUESTIONS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {IRIS_QA.map((qa, i) => (
                  <button key={i}
                    className="iris-btn"
                    onClick={() => ask(i)}
                    style={{
                      textAlign: "left", padding: "11px 13px",
                      background: activeQ === i ? "rgba(245,158,11,0.07)" : "transparent",
                      border: `1px solid ${activeQ === i ? "rgba(245,158,11,0.28)" : "rgba(255,255,255,0.05)"}`,
                      borderRadius: "8px",
                      color: activeQ === i ? "#FEF3C7" : "#475569",
                      cursor: "pointer", fontSize: "12px", lineHeight: 1.45,
                      transition: "all 0.15s ease",
                      display: "flex", gap: "10px", alignItems: "flex-start",
                    }}>
                    <span style={{ color: activeQ === i ? "#F59E0B" : "#1E293B", fontSize: "9px", marginTop: "3px", flexShrink: 0 }}>▶</span>
                    {qa.q}
                  </button>
                ))}
              </div>
            </div>

            {/* Answer panel */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <div style={{ width: "20px", height: "20px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "10px", color: "#F59E0B" }}>✦</span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#F59E0B", fontFamily: '"Geist Mono", monospace' }}>Iris</span>
                {isTyping && <span style={{ fontSize: "9px", color: "#334155", fontFamily: '"Geist Mono", monospace' }}>generating…</span>}
              </div>

              {activeQ === null ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#1E293B", fontSize: "12px", fontFamily: '"Geist Mono", monospace', textAlign: "center" }}>
                  ← Select a question to see Iris in action
                </div>
              ) : (
                <div style={{ fontSize: "13px", lineHeight: 1.75, color: "#94A3B8", whiteSpace: "pre-line", flex: 1 }}>
                  {displayedText}
                  {isTyping && <span className="wiss-cursor" style={{ display: "inline-block", width: "2px", height: "14px", background: "#F59E0B", marginLeft: "1px", verticalAlign: "text-bottom" }} />}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Design Partner CTA */}
        <div style={{ background: "rgba(245,158,11,0.03)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: "20px", padding: "56px 48px", textAlign: "center" }}>
          <div style={{ fontSize: "9px", fontFamily: '"Geist Mono", monospace', color: "#F59E0B", letterSpacing: "0.18em", marginBottom: "18px" }}>DESIGN PARTNER OPPORTUNITY</div>
          <h2 style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', fontSize: "34px", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 18px", color: "#F8FAFC" }}>
            Wiss would be the first accounting firm<br />in the world to have this.
          </h2>
          <p style={{ color: "#475569", fontSize: "15px", maxWidth: "540px", margin: "0 auto 36px", lineHeight: 1.65 }}>
            We're inviting one accounting firm to co-build the operations vertical with us. You get a custom solution built for your exact stack. We get a world-class design partner.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "40px", marginBottom: "36px" }}>
            {[
              { label: "Engagement length", value: "3 months" },
              { label: "Investment range", value: "$75–150K" },
              { label: "Pricing locked", value: "Forever" },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#F59E0B", fontFamily: '"Instrument Sans", system-ui', letterSpacing: "-0.02em" }}>{item.value}</div>
                <div style={{ fontSize: "10px", color: "#334155", fontFamily: '"Geist Mono", monospace', marginTop: "5px" }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginBottom: "32px" }}>
            {[
              "Custom accounting entity model",
              "Connectors for your exact stack",
              "Iris trained on accounting workflows",
              "AICPA + SEC RIA compliance checks",
              "Direct roadmap influence",
            ].map((item) => (
              <span key={item} style={{ fontSize: "10px", color: "#78350F", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", padding: "4px 12px", borderRadius: "100px", fontFamily: '"Geist Mono", monospace' }}>
                ✓ {item}
              </span>
            ))}
          </div>

          <button
            style={{ padding: "14px 40px", background: "#F59E0B", color: "#000", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: '"Instrument Sans", system-ui', letterSpacing: "-0.01em" }}
            onClick={() => window.open("mailto:saijayanth532@gmail.com?subject=Wiss Design Partner Interest", "_blank")}>
            Schedule a Follow-Up →
          </button>
        </div>

      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "20px 48px", display: "flex", justifyContent: "center", gap: "32px" }}>
        <span style={{ fontSize: "9px", fontFamily: '"Geist Mono", monospace', color: "#1E293B" }}>PRISM · FOR PROFESSIONAL SERVICES</span>
        <span style={{ fontSize: "9px", fontFamily: '"Geist Mono", monospace', color: "#1E293B" }}>CPT ENGINE — PATENT PENDING</span>
        <span style={{ fontSize: "9px", fontFamily: '"Geist Mono", monospace', color: "#1E293B" }}>© 2026 ALL RIGHTS RESERVED</span>
        <span style={{ fontSize: "9px", fontFamily: '"Geist Mono", monospace', color: "#1E293B" }}>CONFIDENTIAL — NOT FOR DISTRIBUTION</span>
      </div>
    </div>
  );
}
