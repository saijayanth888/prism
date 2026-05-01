import * as d3 from "d3";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Bot, CheckCircle2, GitMerge, Network, Shield, Sparkles, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Animated counter ──────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: 2000, bounce: 0 });
  const inView = useInView(ref, { once: true, margin: "-60px" });
  useEffect(() => { if (inView) motionVal.set(to); }, [inView, motionVal, to]);
  useEffect(
    () => spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = `${Math.round(v).toLocaleString()}${suffix}`;
    }),
    [spring, suffix]
  );
  return <span ref={ref}>0{suffix}</span>;
}

// ── Hero topology simulation ──────────────────────────────────────────────
const NODE_TYPES = [
  { color: "#5E6AD2", r: 6 }, { color: "#7170FF", r: 5 },
  { color: "#34D399", r: 5 }, { color: "#FBBF24", r: 4 },
  { color: "#F87171", r: 4 }, { color: "#22D3EE", r: 5 },
  { color: "#A78BFA", r: 4 }, { color: "#FB923C", r: 4 },
];

function HeroGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!svg || !container) return;

    const W = container.clientWidth || 800;
    const H = container.clientHeight || 600;

    const nodes = Array.from({ length: 32 }, (_, i) => ({
      id: i,
      ...NODE_TYPES[i % NODE_TYPES.length],
      opacity: 0,
    })) as any[];

    const links = Array.from({ length: 42 }, () => ({
      source: Math.floor(Math.random() * 32),
      target: Math.floor(Math.random() * 32),
    })).filter((l) => l.source !== l.target);

    const sel = d3.select(svg)
      .attr("width", W)
      .attr("height", H)
      .attr("viewBox", `0 0 ${W} ${H}`);

    sel.selectAll("*").remove();

    const defs = sel.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(80).strength(0.4))
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(14));

    const linkSel = sel.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "rgba(255,255,255,0.06)")
      .attr("stroke-width", 1);

    const nodeSel = sel.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d: any) => d.r)
      .attr("fill", (d: any) => d.color)
      .attr("opacity", 0)
      .attr("filter", "url(#glow)");

    // Staggered fade-in
    nodeSel.transition()
      .delay((_, i) => i * 60)
      .duration(500)
      .attr("opacity", (d: any) => d.r > 4.5 ? 0.7 : 0.45);

    sim.on("tick", () => {
      linkSel
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      nodeSel
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
    });

    return () => { sim.stop(); sel.selectAll("*").remove(); };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" style={{ opacity: 0.55 }} />
    </div>
  );
}

// ── CPT resolution animation ──────────────────────────────────────────────
const RESOLUTION_STEPS = [
  { platform: "Kubernetes", name: "payments-svc",    color: "#326CE5" },
  { platform: "GitHub",     name: "payments-api-v2", color: "#E9ECEF" },
  { platform: "Datadog",    name: "prod-payments",   color: "#632CA6" },
  { platform: "ArgoCD",     name: "payments@prod",   color: "#F16727" },
  { platform: "SharePoint", name: "Payments Service", color: "#0078D4" },
];

function CptAnimation() {
  const [step, setStep] = useState(0);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => {
        if (s < RESOLUTION_STEPS.length - 1) return s + 1;
        clearInterval(t);
        setTimeout(() => setResolved(true), 400);
        return s;
      });
    }, 700);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      <div className="space-y-2">
        {RESOLUTION_STEPS.map((item, i) => (
          <motion.div
            key={item.platform}
            initial={{ opacity: 0, x: -16 }}
            animate={i <= step ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
              {item.platform}
            </span>
            <span className="text-[11px] font-mono ml-auto" style={{ color: "rgba(255,255,255,0.7)" }}>
              {item.name}
            </span>
          </motion.div>
        ))}
      </div>

      {resolved && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 px-4 py-3 rounded-xl flex items-center gap-3"
          style={{
            background: "rgba(94, 106, 210, 0.15)",
            border: "1px solid rgba(94, 106, 210, 0.35)",
          }}
        >
          <CheckCircle2 size={16} style={{ color: "#5E6AD2", flexShrink: 0 }} />
          <div>
            <div className="text-xs font-semibold" style={{ color: "#A5AEFF" }}>Resolved → payments-svc</div>
            <div className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(165,174,255,0.6)" }}>
              confidence 0.97 · 5 sources merged
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Platform badges ───────────────────────────────────────────────────────
const PLATFORMS = [
  "Kubernetes", "GitHub", "Datadog", "AWS", "ArgoCD",
  "Kafka", "Terraform", "ServiceNow", "Vault", "SharePoint",
  "SonarQube", "Nexus", "Jira",
];

// ── Feature cards ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <GitMerge size={20} />,
    accent: "#5E6AD2",
    title: "CPT Engine",
    tag: "Patent Pending",
    desc: "5-pass entity resolution converges fragmented identities across 13+ platforms — Kubernetes, GitHub, SharePoint, Datadog — into one authoritative record. Zero brittle name-matching rules.",
    stats: [{ label: "resolution passes", value: "5" }, { label: "confidence", value: "97%" }],
  },
  {
    icon: <Bot size={20} />,
    accent: "#22D3EE",
    title: "Iris AI Copilot",
    tag: "Powered by Claude",
    desc: "Ask any question about your infrastructure in plain English. 10 graph-grounded tools, 7 anti-hallucination safeguards, 5 personas. Every answer cites its source entity.",
    stats: [{ label: "graph tools", value: "10" }, { label: "safeguards", value: "7" }],
  },
  {
    icon: <Shield size={20} />,
    accent: "#34D399",
    title: "Compliance Center",
    tag: "PCI-DSS · SOC2 · HIPAA",
    desc: "Automated gap detection across all three major compliance frameworks. Evidence collection, remediation paths, and audit-ready exports. Always current, never stale.",
    stats: [{ label: "frameworks", value: "3" }, { label: "policy checks", value: "240+" }],
  },
];

// ── Main Landing ──────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLDivElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-80px" });

  const statsRef = useRef<HTMLDivElement>(null);

  return (
    <div
      style={{
        background: "#05050A",
        color: "#EDEDF8",
        fontFamily: '"Geist", system-ui, sans-serif',
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10"
        style={{
          height: 60,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(5, 5, 10, 0.85)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #5E6AD2, #7170FF)",
              boxShadow: "0 0 20px rgba(94,106,210,0.4)",
            }}
          >
            <Network size={13} style={{ color: "#fff" }} />
          </div>
          <span
            className="text-[15px] font-semibold tracking-tight"
            style={{ fontFamily: '"Syne", sans-serif', color: "#EDEDF8" }}
          >
            prism
          </span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(94,106,210,0.12)",
              color: "#7C8AFF",
              border: "1px solid rgba(94,106,210,0.25)",
            }}
          >
            CPT Engine
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/topology")}
            className="text-xs font-medium px-4 py-2 rounded-lg transition-all"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#EDEDF8"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
          >
            Documentation
          </button>
          <button
            onClick={() => navigate("/topology")}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            style={{
              background: "#5E6AD2",
              color: "#fff",
              boxShadow: "0 0 20px rgba(94,106,210,0.35)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#6C78DF";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 28px rgba(94,106,210,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#5E6AD2";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(94,106,210,0.35)";
            }}
          >
            Launch App
            <ArrowRight size={12} />
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section
        className="relative flex items-center justify-center"
        style={{ minHeight: "100vh", paddingTop: 60 }}
      >
        {/* Topology graph background */}
        <HeroGraph />

        {/* Radial gradient fade from center */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(5,5,10,0) 30%, rgba(5,5,10,0.8) 70%, #05050A 100%)",
          }}
        />

        {/* Grid dots */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            opacity: 0.4,
          }}
        />

        {/* Accent glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(94,106,210,0.12) 0%, transparent 70%)",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-[11px] font-mono"
            style={{
              background: "rgba(94,106,210,0.1)",
              border: "1px solid rgba(94,106,210,0.28)",
              color: "#9AA5FF",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2] animate-pulse" />
            Convergent Perspective Topology · Patent Pending
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{
              fontFamily: '"Syne", sans-serif',
              fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#EDEDF8",
              marginBottom: "1.5rem",
            }}
          >
            One truth for your
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #5E6AD2 0%, #7170FF 50%, #22D3EE 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              entire infrastructure.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            style={{
              fontSize: "1.125rem",
              lineHeight: 1.65,
              color: "rgba(237,237,248,0.5)",
              maxWidth: 560,
              margin: "0 auto 2.5rem",
            }}
          >
            Prism builds a unified knowledge graph over your entire technology estate — 13+ platforms,
            17 entity types, zero brittle configuration. Ask Iris anything. Get graph-grounded answers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <button
              onClick={() => navigate("/topology")}
              className="flex items-center gap-2 font-semibold text-sm px-7 py-3.5 rounded-xl transition-all"
              style={{
                background: "#5E6AD2",
                color: "#fff",
                boxShadow: "0 0 32px rgba(94,106,210,0.45), 0 4px 16px rgba(0,0,0,0.4)",
                fontFamily: '"Geist", sans-serif',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#6C78DF";
                el.style.transform = "translateY(-1px)";
                el.style.boxShadow = "0 0 44px rgba(94,106,210,0.6), 0 8px 24px rgba(0,0,0,0.5)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#5E6AD2";
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "0 0 32px rgba(94,106,210,0.45), 0 4px 16px rgba(0,0,0,0.4)";
              }}
            >
              <Network size={15} />
              Explore the Graph
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => navigate("/iris")}
              className="flex items-center gap-2 text-sm font-medium px-6 py-3.5 rounded-xl transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(237,237,248,0.7)",
                fontFamily: '"Geist", sans-serif',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(255,255,255,0.07)";
                el.style.color = "#EDEDF8";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(255,255,255,0.04)";
                el.style.color = "rgba(237,237,248,0.7)";
              }}
            >
              <Bot size={15} />
              Ask Iris
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className="w-px h-8 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <motion.div
              className="w-full rounded-full"
              style={{ background: "#5E6AD2", height: "40%" }}
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>scroll</span>
        </motion.div>
      </section>

      {/* ── Platform strip ─────────────────────────────────────────────── */}
      <section
        className="py-10 px-6"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[11px] font-mono mb-6" style={{ color: "rgba(255,255,255,0.28)" }}>
            UNIFIED GRAPH ACROSS 13 PLATFORMS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {PLATFORMS.map((name, i) => (
              <motion.span
                key={name}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="px-3 py-1.5 rounded-lg text-[11px] font-mono"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {name}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature cards ──────────────────────────────────────────────── */}
      <section ref={featuresRef} className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2
              style={{
                fontFamily: '"Syne", sans-serif',
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                color: "#EDEDF8",
                marginBottom: "0.75rem",
              }}
            >
              Every capability you need.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.0625rem" }}>
              No duct tape. No brittle integrations. One platform, one graph.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 24 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl p-6 flex flex-col gap-4 group cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255,255,255,0.05)";
                  el.style.borderColor = `${feat.accent}40`;
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = `0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px ${feat.accent}25`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255,255,255,0.03)";
                  el.style.borderColor = "rgba(255,255,255,0.07)";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${feat.accent}18`, color: feat.accent }}
                  >
                    {feat.icon}
                  </div>
                  <span
                    className="text-[10px] font-mono px-2 py-1 rounded-md"
                    style={{
                      background: `${feat.accent}12`,
                      color: feat.accent,
                      border: `1px solid ${feat.accent}28`,
                    }}
                  >
                    {feat.tag}
                  </span>
                </div>

                <div>
                  <h3
                    className="text-base font-semibold mb-2"
                    style={{ fontFamily: '"Syne", sans-serif', color: "#EDEDF8" }}
                  >
                    {feat.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
                    {feat.desc}
                  </p>
                </div>

                <div className="flex gap-4 mt-auto pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  {feat.stats.map((s) => (
                    <div key={s.label}>
                      <div
                        className="text-lg font-bold font-mono"
                        style={{ color: feat.accent }}
                      >
                        {s.value}
                      </div>
                      <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CPT Resolution demo ────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="text-[11px] font-mono mb-3 px-2 py-1 rounded inline-block"
              style={{
                background: "rgba(94,106,210,0.1)",
                color: "#9AA5FF",
                border: "1px solid rgba(94,106,210,0.25)",
              }}
            >
              CPT ENGINE · ENTITY RESOLUTION
            </div>
            <h2
              style={{
                fontFamily: '"Syne", sans-serif',
                fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                color: "#EDEDF8",
                lineHeight: 1.15,
                marginBottom: "1rem",
              }}
            >
              Same service, five names.
              <br />
              <span style={{ color: "#7C8AFF" }}>One truth.</span>
            </h2>
            <p className="text-[14px] leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
              The CPT Engine runs a 5-pass resolution pipeline — exact match, normalized match,
              label correlation, fuzzy similarity, and ML embeddings — to converge every fragmented
              identity into a single authoritative entity. No rules to write. No maintenance.
            </p>

            <div className="space-y-3">
              {[
                "Reads SharePoint docs, Confluence, business logs",
                "Strips env prefixes (prod-, stg-) and version suffixes",
                "Correlates labels across Kubernetes, Datadog, GitHub",
                "97%+ accuracy on synthetic cross-platform datasets",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle2
                    size={15}
                    style={{ color: "#5E6AD2", flexShrink: 0, marginTop: 1 }}
                  />
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="rounded-2xl p-6"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
                RESOLUTION IN PROGRESS
              </span>
              <span
                className="flex items-center gap-1.5 text-[10px] font-mono"
                style={{ color: "#5E6AD2" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2] animate-pulse" />
                live
              </span>
            </div>
            <CptAnimation />
          </motion.div>
        </div>
      </section>

      {/* ── Metrics bar ────────────────────────────────────────────────── */}
      <section
        ref={statsRef}
        className="py-16 px-6"
        style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 1675, suffix: "+", label: "Entities resolved" },
            { value: 13, suffix: "", label: "Platform connectors" },
            { value: 97, suffix: "%", label: "Resolution accuracy" },
            { value: 0, suffix: "", label: "Hallucinations (Iris)" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div
                className="text-4xl font-bold font-mono mb-1"
                style={{ fontFamily: '"Syne", sans-serif', color: "#EDEDF8" }}
              >
                <Counter to={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Blast radius highlight ─────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl p-6"
            style={{
              background: "rgba(248, 113, 113, 0.04)",
              border: "1px solid rgba(248, 113, 113, 0.15)",
            }}
          >
            <div className="text-[11px] font-mono mb-4" style={{ color: "rgba(248,113,113,0.6)" }}>
              BLAST RADIUS ANALYSIS
            </div>
            {["payments-svc", "orders-svc", "checkout-api", "notification-svc", "analytics-pipeline"].map(
              (name, i) => (
                <div
                  key={name}
                  className="flex items-center gap-3 py-2"
                  style={{ borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background:
                        i === 0 ? "#F87171" : i < 2 ? "#FBBF24" : "rgba(255,255,255,0.2)",
                    }}
                  />
                  <span className="text-[12px] font-mono flex-1" style={{ color: i === 0 ? "#F87171" : "rgba(255,255,255,0.45)" }}>
                    {name}
                  </span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{
                      background:
                        i === 0
                          ? "rgba(248,113,113,0.12)"
                          : i < 2
                          ? "rgba(251,191,36,0.08)"
                          : "rgba(255,255,255,0.04)",
                      color:
                        i === 0 ? "#F87171" : i < 2 ? "#FBBF24" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {i === 0 ? "origin" : i === 1 ? "direct" : "transitive"}
                  </span>
                </div>
              )
            )}
            <div className="mt-4 text-xs font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
              4 services affected · calculated in 23ms
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div
              className="text-[11px] font-mono mb-3 px-2 py-1 rounded inline-block"
              style={{
                background: "rgba(248,113,113,0.08)",
                color: "#FDA4A4",
                border: "1px solid rgba(248,113,113,0.2)",
              }}
            >
              BLAST RADIUS · IMPACT ANALYSIS
            </div>
            <h2
              style={{
                fontFamily: '"Syne", sans-serif',
                fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                color: "#EDEDF8",
                lineHeight: 1.15,
                marginBottom: "1rem",
              }}
            >
              Know what breaks
              <br />
              <span style={{ color: "#FCA5A5" }}>before it does.</span>
            </h2>
            <p className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              Graph-traversal BFS analysis surfaces every downstream service, team, and customer
              facing endpoint in under 30ms. Run blast radius before every deploy, every patch,
              every configuration change.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="py-32 px-6 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <Sparkles size={28} style={{ color: "#5E6AD2", margin: "0 auto 1.5rem" }} />
          <h2
            style={{
              fontFamily: '"Syne", sans-serif',
              fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#EDEDF8",
              lineHeight: 1.1,
              marginBottom: "1.25rem",
            }}
          >
            See your infrastructure
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #5E6AD2, #7170FF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              clearly, finally.
            </span>
          </h2>
          <p className="text-base mb-10" style={{ color: "rgba(255,255,255,0.38)" }}>
            Explore the demo. No signup required.
          </p>
          <button
            onClick={() => navigate("/topology")}
            className="inline-flex items-center gap-2.5 font-semibold text-sm px-8 py-4 rounded-xl transition-all"
            style={{
              background: "#5E6AD2",
              color: "#fff",
              boxShadow: "0 0 40px rgba(94,106,210,0.5), 0 4px 20px rgba(0,0,0,0.4)",
              fontFamily: '"Geist", sans-serif',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "#6C78DF";
              el.style.transform = "translateY(-2px) scale(1.01)";
              el.style.boxShadow = "0 0 56px rgba(94,106,210,0.65), 0 8px 28px rgba(0,0,0,0.5)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "#5E6AD2";
              el.style.transform = "translateY(0) scale(1)";
              el.style.boxShadow = "0 0 40px rgba(94,106,210,0.5), 0 4px 20px rgba(0,0,0,0.4)";
            }}
          >
            <Network size={16} />
            Open Prism
            <ArrowRight size={14} />
          </button>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer
        className="px-6 py-8 flex items-center justify-between flex-wrap gap-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #5E6AD2, #7170FF)" }}
          >
            <Network size={10} style={{ color: "#fff" }} />
          </div>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)", fontFamily: '"Syne", sans-serif', fontWeight: 600 }}>
            prism
          </span>
        </div>
        <div className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
          CPT Engine · Patent Pending · Built with Claude Code
        </div>
        <div className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
          © 2026 Prism Platform Intelligence
        </div>
      </footer>
    </div>
  );
}
