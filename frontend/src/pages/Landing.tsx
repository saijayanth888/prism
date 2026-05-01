import { motion, useInView, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Bot, Check, ChevronDown, Network, Sparkles, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

/* ──────────────────────────────────────────────
   Counter — animated number on scroll into view
   ────────────────────────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: 1800, bounce: 0 });
  const inView = useInView(ref, { once: true, margin: "-60px" });
  useEffect(() => { if (inView) motionVal.set(to); }, [inView, motionVal, to]);
  useEffect(
    () =>
      spring.on("change", (v) => {
        if (ref.current) ref.current.textContent = `${Math.round(v).toLocaleString()}${suffix}`;
      }),
    [spring, suffix]
  );
  return <span ref={ref}>0{suffix}</span>;
}

/* ──────────────────────────────────────────────
   Wordmark — used in nav and footer
   ────────────────────────────────────────────── */
function Wordmark({ size = "md", showTag = false }: { size?: "sm" | "md" | "lg"; showTag?: boolean }) {
  const tile = size === "lg" ? 32 : size === "sm" ? 22 : 28;
  const txt = size === "lg" ? 18 : size === "sm" ? 13 : 16;
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          width: tile,
          height: tile,
          background: "linear-gradient(135deg, #5E6AD2, #7170FF)",
          boxShadow: "0 0 14px rgba(94,106,210,0.35)",
        }}
      >
        <Network size={Math.round(tile * 0.48)} color="#FFFFFF" />
      </div>
      <div className="flex items-center gap-2">
        <span
          style={{
            fontFamily: '"Instrument Sans", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: txt,
            letterSpacing: "-0.02em",
            color: "#EDEDF8",
          }}
        >
          prism
        </span>
        {showTag && (
          <span
            className="px-1.5 py-0.5 rounded font-mono uppercase"
            style={{
              fontSize: 9,
              letterSpacing: "0.12em",
              color: "#9DA5F5",
              background: "rgba(94,106,210,0.10)",
              border: "1px solid rgba(94,106,210,0.25)",
            }}
          >
            CPT ENGINE
          </span>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Hero convergence visualization
   ────────────────────────────────────────────── */
const HERO_SOURCES = [
  { tag: "K8S", name: "payments-svc",     accent: "#22D3EE" },
  { tag: "GH",  name: "payments-api-v2",  accent: "#A78BFA" },
  { tag: "DD",  name: "prod-payments",    accent: "#7170FF" },
  { tag: "ARG", name: "payments@prod",    accent: "#FB923C" },
  { tag: "SP",  name: "Payments Service", accent: "#34D399" },
];

function HeroConvergence() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const tick = () => {
      setStep(0);
      setTimeout(() => setStep(1), 1400);
      setTimeout(() => setStep(2), 2600);
    };
    tick();
    const id = setInterval(tick, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full" style={{ minHeight: 560 }}>
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-[10px] font-mono uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.32)" }}>
          CPT ENGINE · LIVE CONVERGENCE
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: step < 2 ? "#FBBF24" : "#34D399", animation: "pulse 2s infinite" }}
          />
          <span className="text-[10px] font-mono uppercase tracking-[0.12em]" style={{ color: step < 2 ? "#FCD34D" : "#6EE7B7" }}>
            {step < 2 ? "RESOLVING" : "RESOLVED"}
          </span>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(94,106,210,0.18) 0%, rgba(34,211,238,0.06) 50%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
      </div>

      <div className="absolute inset-0 px-6 py-16">
        {HERO_SOURCES.map((s, i) => {
          const total = HERO_SOURCES.length;
          const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
          const r = 200;
          const cx = 50;
          const cy = 50;
          const x = step >= 1 ? cx : cx + (r * Math.cos(angle)) / 5;
          const y = step >= 1 ? cy : cy + (r * Math.sin(angle)) / 5;
          const opacity = step >= 1 ? 0.25 : 1;

          return (
            <motion.div
              key={s.tag}
              initial={false}
              animate={{
                left: `${x}%`,
                top: `${y}%`,
                opacity,
                scale: step >= 1 ? 0.85 : 1,
              }}
              transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-2.5 py-1.5 rounded-md"
              style={{
                background: "rgba(11, 11, 22, 0.78)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${s.accent}20`,
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                style={{ background: `${s.accent}25`, color: s.accent, letterSpacing: "0.06em" }}
              >
                {s.tag}
              </span>
              <span className="text-[11px]" style={{ color: "rgba(237,237,248,0.85)" }}>{s.name}</span>
            </motion.div>
          );
        })}

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: step >= 1 ? 1 : 0, scale: step >= 1 ? 1 : 0.9 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-4 rounded-xl"
          style={{
            background: "rgba(8, 12, 22, 0.88)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(94,106,210,0.45)",
            boxShadow: "0 24px 80px rgba(94,106,210,0.18), 0 0 0 1px rgba(94,106,210,0.10) inset",
            minWidth: 280,
          }}
        >
          <div className="text-[9px] font-mono uppercase tracking-[0.14em] mb-1.5" style={{ color: "rgba(255,255,255,0.42)" }}>
            CANONICAL ENTITY
          </div>
          <div
            className="text-[20px] font-mono mb-2"
            style={{ color: "#EDEDF8", letterSpacing: "-0.01em" }}
          >
            payments-svc
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.55)" }}>
            <span>5 sources merged</span>
            <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
            <span style={{ color: "#34D399" }}>97% confidence</span>
          </div>
        </motion.div>
      </div>

      <div className="absolute left-5 right-5 bottom-5">
        <div className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
          {step === 0 && "connecting…"}
          {step === 1 && "running 5 passes · exact, normalized, label, fuzzy, ML"}
          {step === 2 && "resolved · payments-svc · 5 sources merged · 23 ms"}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   CPT scroll-driven 5-pass animation
   ────────────────────────────────────────────── */
const CPT_PASSES = [
  { num: 1, name: "Exact match",       desc: "Direct service-name + namespace identity",    pct: "100%" },
  { num: 2, name: "Normalized match",  desc: "Strip prod-/stg- prefixes, -v2/-svc suffixes", pct: "92%"  },
  { num: 3, name: "Label correlation", desc: "Shared k8s · GH · Datadog tags · owners",      pct: "86%"  },
  { num: 4, name: "Fuzzy match",       desc: "Levenshtein + token sort, 4-edit tolerance",   pct: "83%"  },
  { num: 5, name: "ML similarity",     desc: "Doc + label embedding cosine, 1024-dim",       pct: "91%"  },
];

const CPT_PERSPECTIVES = [
  { tag: "K8S", name: "payments-svc",      authority: 0.8,  accent: "#22D3EE" },
  { tag: "GH",  name: "payments-api-v2",   authority: 0.75, accent: "#A78BFA" },
  { tag: "DD",  name: "prod-payments",     authority: 0.50, accent: "#7170FF" },
  { tag: "ARG", name: "payments@prod",     authority: 0.60, accent: "#FB923C" },
  { tag: "SP",  name: '"Payments Service"',authority: 0.50, accent: "#34D399" },
];

function CptEngineSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const stepFloat = useTransform(scrollYProgress, [0.25, 0.85], [0, 6]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    return stepFloat.on("change", (v) => setStep(Math.max(0, Math.min(6, Math.floor(v)))));
  }, [stepFloat]);

  return (
    <section ref={sectionRef} id="cpt" className="px-6 md:px-10 py-24" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] mb-3" style={{ color: "rgba(255,255,255,0.42)" }}>
            CPT ENGINE · 5-PASS ENTITY RESOLUTION
          </div>
          <h2
            style={{
              fontFamily: '"Instrument Sans", system-ui, sans-serif',
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "#EDEDF8",
              maxWidth: 720,
            }}
          >
            Same service, five names.
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #5E6AD2 0%, #7170FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              One truth.
            </span>
          </h2>
          <p className="text-[15px] mt-4 max-w-2xl" style={{ color: "rgba(255,255,255,0.5)" }}>
            The Convergent Perspective Topology engine runs five orthogonal passes — exact match,
            normalized match, label correlation, fuzzy similarity, and ML embeddings — and merges
            every fragmented identity into a single authoritative entity.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* INPUT window */}
          <CodeWindow title="cpt_engine.input" subtitle="5 perspectives · 23 ms">
            <div className="px-4 pt-3 pb-2 text-[10px] font-mono uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.32)" }}>
              PERSPECTIVES · RAW ENTITIES FROM 5 PLATFORMS
            </div>
            <div className="px-3 pb-4 space-y-1.5">
              {CPT_PERSPECTIVES.map((p) => (
                <div
                  key={p.tag}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  <span
                    className="text-[10px] py-0.5 rounded font-bold flex-shrink-0"
                    style={{
                      background: `${p.accent}20`,
                      color: p.accent,
                      letterSpacing: "0.06em",
                      width: 38,
                      textAlign: "center",
                    }}
                  >
                    {p.tag}
                  </span>
                  <span className="text-[12px] flex-1" style={{ color: "rgba(237,237,248,0.85)" }}>{p.name}</span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded"
                    style={{
                      background: "rgba(94,106,210,0.10)",
                      color: "#9DA5F5",
                      border: "1px solid rgba(94,106,210,0.25)",
                    }}
                  >
                    authority {p.authority.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CodeWindow>

          {/* RESOLVE window */}
          <CodeWindow title="cpt_engine.resolve()" subtitle="scroll to step">
            <div className="px-3 py-3 space-y-1.5">
              {CPT_PASSES.map((p, i) => {
                const isCurrent = step === i;
                const isDone = step > i;
                const isPending = step < i;
                return (
                  <motion.div
                    key={p.num}
                    animate={{ opacity: isPending ? 0.5 : 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 px-3 py-3 rounded-md"
                    style={{
                      background: isCurrent
                        ? "rgba(94,106,210,0.10)"
                        : isDone
                        ? "rgba(52,211,153,0.06)"
                        : "rgba(255,255,255,0.02)",
                      border: isCurrent
                        ? "1px solid rgba(94,106,210,0.45)"
                        : isDone
                        ? "1px solid rgba(52,211,153,0.20)"
                        : "1px solid rgba(255,255,255,0.05)",
                      transition: "background 200ms, border-color 200ms",
                    }}
                  >
                    <div
                      className="rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 22,
                        height: 22,
                        background: isDone ? "#34D399" : isCurrent ? "#5E6AD2" : "rgba(255,255,255,0.06)",
                        color: isDone || isCurrent ? "#0A0A14" : "rgba(255,255,255,0.45)",
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {isDone ? <Check size={12} strokeWidth={3} /> : p.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[13px] font-semibold"
                        style={{
                          fontFamily: '"Instrument Sans", system-ui, sans-serif',
                          color: isPending ? "rgba(255,255,255,0.45)" : "#EDEDF8",
                        }}
                      >
                        {p.name}
                      </div>
                      <div className="text-[11px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.42)" }}>
                        {p.desc}
                      </div>
                    </div>
                    <span
                      className="text-[12px] font-mono font-semibold"
                      style={{ color: isDone ? "#34D399" : isCurrent ? "#9DA5F5" : "rgba(255,255,255,0.32)" }}
                    >
                      {p.pct}
                    </span>
                  </motion.div>
                );
              })}

              <motion.div
                initial={false}
                animate={{ opacity: step >= 5 ? 1 : 0, y: step >= 5 ? 0 : 12 }}
                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                className="px-4 py-4 rounded-md mt-3"
                style={{
                  background: "rgba(94,106,210,0.10)",
                  border: "1px solid rgba(94,106,210,0.45)",
                  boxShadow: "0 0 24px rgba(94,106,210,0.18)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-2 text-[10px] font-mono uppercase tracking-[0.14em]">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#9DA5F5" }} />
                  <span style={{ color: "#9DA5F5" }}>RESOLVED · SINGLE SOURCE OF TRUTH</span>
                </div>
                <div
                  className="text-[20px] font-mono mb-2"
                  style={{ color: "#EDEDF8", letterSpacing: "-0.01em" }}
                >
                  payments-svc
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono flex-wrap" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <span>5 sources merged</span>
                  <span style={{ color: "rgba(255,255,255,0.20)" }}>·</span>
                  <span style={{ color: "rgba(255,255,255,0.32)" }}>type</span>
                  <span>service</span>
                  <span style={{ color: "rgba(255,255,255,0.20)" }}>·</span>
                  <span style={{ color: "rgba(255,255,255,0.32)" }}>owner</span>
                  <span>platform-payments</span>
                  <span style={{ color: "rgba(255,255,255,0.20)" }}>·</span>
                  <span style={{ color: "#34D399" }}>97% confidence</span>
                </div>
              </motion.div>
            </div>
          </CodeWindow>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Code window shell — mac traffic lights
   ────────────────────────────────────────────── */
function CodeWindow({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "rgba(8, 10, 18, 0.55)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F57" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28C840" }} />
          </div>
          <span className="text-[12px] font-mono ml-2" style={{ color: "rgba(255,255,255,0.55)" }}>{title}</span>
        </div>
        {subtitle && (
          <span className="text-[10px] font-mono uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.32)" }}>
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Developer Lens — resolve.py + RESOLVED ENTITY
   ────────────────────────────────────────────── */

// Token-based syntax highlighter (no innerHTML).
function PyLine({ children }: { children: ReactNode }) {
  return <div style={{ minHeight: "1.7em" }}>{children}</div>;
}
const C = {
  kw:    "#A78BFA",
  str:   "#34D399",
  num:   "#FB923C",
  cls:   "#9DA5F5",
  com:   "rgba(255,255,255,0.32)",
  punct: "rgba(237,237,248,0.6)",
  base:  "rgba(237,237,248,0.85)",
};
function tk(text: string, color: string, italic = false): ReactNode {
  return <span style={{ color, fontStyle: italic ? "italic" : "normal" }}>{text}</span>;
}

function ResolvePyCode() {
  return (
    <pre
      className="px-5 py-5 text-[12px] leading-[1.7] overflow-x-auto"
      style={{
        fontFamily: "JetBrains Mono, monospace",
        color: C.base,
        margin: 0,
      }}
    >
      <code>
        <PyLine>{tk("# resolve.py", C.com, true)}</PyLine>
        <PyLine>
          {tk("from", C.kw)} prism {tk("import", C.kw)} {tk("CPTEngine", C.cls)}, {tk("Iris", C.cls)}
        </PyLine>
        <PyLine> </PyLine>
        <PyLine>
          cpt = {tk("CPTEngine", C.cls)}(tenant={tk('"acme"', C.str)})
        </PyLine>
        <PyLine> </PyLine>
        <PyLine>
          truth = {tk("await", C.kw)} cpt.resolve(
        </PyLine>
        <PyLine>
          {"  "}name={tk('"payments-svc"', C.str)},
        </PyLine>
        <PyLine>
          {"  "}platforms=[{tk('"k8s"', C.str)}, {tk('"github"', C.str)}, {tk('"datadog"', C.str)}, {tk('"argocd"', C.str)}, {tk('"sharepoint"', C.str)}],
        </PyLine>
        <PyLine>
          {"  "}passes={tk("5", C.num)},           {tk("# exact · normalized · label · fuzzy · ML", C.com, true)}
        </PyLine>
        <PyLine>
          {"  "}threshold={tk("0.70", C.num)},
        </PyLine>
        <PyLine>)</PyLine>
        <PyLine> </PyLine>
        <PyLine>{tk("# every property comes from the most-authoritative platform", C.com, true)}</PyLine>
        <PyLine>
          {tk("print", C.kw)}(truth.replicas, truth.p99_latency, truth.confidence)
        </PyLine>
        <PyLine> </PyLine>
        <PyLine>{tk("# ask Iris — graph-grounded, never hallucinates", C.com, true)}</PyLine>
        <PyLine>
          iris = {tk("Iris", C.cls)}(model={tk('"claude-sonnet-4.5"', C.str)}, persona={tk('"sre"', C.str)})
        </PyLine>
        <PyLine>
          answer = {tk("await", C.kw)} iris.ask({tk('"what breaks if payments-svc fails?"', C.str)})
        </PyLine>
      </code>
    </pre>
  );
}

const RESOLVED_FIELDS: [string, string, string?][] = [
  ["canonical_name",  "payments-svc"],
  ["entity_type",     "service"],
  ["perspectives",    "[k8s, github, datadog, argocd, sharepoint]"],
  ["replicas",        "8 (authority k8s · 1.0)"],
  ["p99_latency",     "142 ms (authority datadog · 1.0)"],
  ["source_code",     "github.com/acme/payments-api (authority gh · 1.0)"],
  ["deploy_strategy", "blue/green (authority argocd · 1.0)"],
  ["owners",          "platform-payments"],
  ["confidence",      "0.97", "#34D399"],
  ["resolved_in",     "23 ms"],
];

function DeveloperLensSection() {
  return (
    <section className="px-6 md:px-10 py-24" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] mb-3" style={{ color: "rgba(255,255,255,0.42)" }}>
            DEVELOPER LENS · ONE API FOR THE WHOLE GRAPH
          </div>
          <h2
            style={{
              fontFamily: '"Instrument Sans", system-ui, sans-serif',
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "#EDEDF8",
              maxWidth: 720,
            }}
          >
            Resolve in one call.
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #5E6AD2 0%, #7170FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Cite from the graph.
            </span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <CodeWindow title="resolve.py" subtitle="main · 23 lines">
            <ResolvePyCode />
          </CodeWindow>

          <CodeWindow title="RESOLVED ENTITY" subtitle="● STREAMING">
            <div className="px-5 py-5 space-y-2">
              {RESOLVED_FIELDS.map(([k, v, color], i) => (
                <motion.div
                  key={k}
                  initial={{ opacity: 0, y: 4 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="grid items-baseline gap-3"
                  style={{ gridTemplateColumns: "180px 1fr", fontFamily: "JetBrains Mono, monospace" }}
                >
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.42)" }}>{k}</span>
                  <span className="text-[12px]" style={{ color: color || "rgba(237,237,248,0.85)" }}>{v}</span>
                </motion.div>
              ))}
            </div>
          </CodeWindow>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Iris terminal demo
   ────────────────────────────────────────────── */
const IRIS_MODELS = [
  { name: "Iris-default", subtitle: "routed", current: true },
  { name: "Claude Sonnet 4.5", subtitle: "200k" },
  { name: "GPT-4o", subtitle: "128k" },
  { name: "Gemini 1.5 Pro", subtitle: "1M" },
];

function IrisSection() {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <section id="iris" className="px-6 md:px-10 py-24" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] mb-3" style={{ color: "rgba(255,255,255,0.42)" }}>
            IRIS · GRAPH-GROUNDED COPILOT
          </div>
          <h2
            style={{
              fontFamily: '"Instrument Sans", system-ui, sans-serif',
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "#EDEDF8",
            }}
          >
            An AI that
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #22D3EE 0%, #5E6AD2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              never hallucinates.
            </span>
          </h2>
          <p className="text-[15px] mt-4 mb-7 max-w-lg" style={{ color: "rgba(255,255,255,0.5)" }}>
            Iris reads from the graph — not the open web, not training data. Every answer cites
            its source entity. Switch between Claude, GPT, Gemini, and Iris-default to fit the task.
          </p>

          <div className="space-y-3 max-w-xl">
            {[
              { bold: "10 graph tools", rest: "· entity lookup, blast radius, dependency chain, vuln impact" },
              { bold: "7 anti-hallucination safeguards", rest: "· cite-or-refuse, confidence floor, scope guard" },
              { bold: "5 personas", rest: "· DEV, SRE, PM, AUDITOR, EXEC — each shapes detail and tone" },
              { bold: "4 model backends", rest: "· Claude · GPT · Gemini · Iris-default — switch per query" },
            ].map((it) => (
              <div key={it.bold} className="flex items-start gap-2.5">
                <Check size={16} style={{ color: "#22D3EE", flexShrink: 0, marginTop: 2 }} />
                <span className="text-[14px]" style={{ color: "rgba(237,237,248,0.85)" }}>
                  <strong style={{ color: "#EDEDF8" }}>{it.bold}</strong>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>{" "}{it.rest}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(8, 12, 22, 0.85)",
            border: "1px solid rgba(34,211,238,0.22)",
            boxShadow: "0 24px 80px rgba(34,211,238,0.10), 0 0 0 1px rgba(34,211,238,0.08) inset",
          }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #22D3EE, #3B82F6)" }}
              >
                <Bot size={14} color="#0A0A14" />
              </div>
              <span className="text-[14px] font-semibold" style={{ color: "#EDEDF8", fontFamily: '"Instrument Sans", system-ui, sans-serif' }}>
                Iris
              </span>
              <span
                className="text-[9px] font-mono uppercase tracking-[0.14em] px-1.5 py-0.5 rounded"
                style={{ background: "rgba(34,211,238,0.10)", color: "#7DD3FC", border: "1px solid rgba(34,211,238,0.25)" }}
              >
                GROUNDED IN GRAPH
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setPickerOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(237,237,248,0.85)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22D3EE" }} />
                Iris-default
                <ChevronDown size={11} />
              </button>
              {pickerOpen && (
                <div
                  className="absolute right-0 mt-1.5 rounded-md overflow-hidden z-10"
                  style={{
                    background: "rgba(15, 17, 28, 0.96)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                    minWidth: 200,
                  }}
                >
                  <div className="px-3 py-2 text-[9px] font-mono uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.32)" }}>
                    MODEL BACKEND
                  </div>
                  {IRIS_MODELS.map((m) => (
                    <button
                      key={m.name}
                      className="w-full flex items-center justify-between px-3 py-2 text-[12px]"
                      style={{
                        background: m.current ? "rgba(34,211,238,0.08)" : "transparent",
                        fontFamily: "JetBrains Mono, monospace",
                        color: m.current ? "#7DD3FC" : "rgba(237,237,248,0.85)",
                      }}
                    >
                      <span>{m.name}</span>
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.42)" }}>{m.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-4 py-4 space-y-3 min-h-[280px]">
            <div className="text-[12px] font-mono" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span style={{ color: "#7170FF" }}>›</span> What breaks if payments-svc goes down?
            </div>

            <div
              className="rounded-lg p-3 space-y-2"
              style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.14)" }}
            >
              <div className="text-[12.5px] leading-relaxed" style={{ color: "rgba(237,237,248,0.92)", fontFamily: "JetBrains Mono, monospace" }}>
                <strong style={{ color: "#EDEDF8" }}>4 services impact</strong>, 2 customer-facing.{" "}
                <span style={{ color: "#5E6AD2" }}>orders-svc</span> and{" "}
                <span style={{ color: "#5E6AD2" }}>checkout-api</span> drop with{" "}
                <strong style={{ color: "#FCD34D" }}>~92% confidence</strong>;{" "}
                <span style={{ color: "#5E6AD2" }}>notification-svc</span> degrades transitively via{" "}
                <span style={{ color: "#5E6AD2" }}>payments-events Kafka topic</span>. Calculated in 23 ms across the resolved CPT graph.
              </div>
              <div className="flex items-center gap-1.5 flex-wrap pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {["payments-svc", "orders-svc", "checkout-api", "notification-svc"].map((c) => (
                  <span
                    key={c}
                    className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{
                      background: "rgba(94,106,210,0.12)",
                      color: "#9DA5F5",
                      border: "1px solid rgba(94,106,210,0.25)",
                    }}
                  >
                    cite · {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-[14px] font-mono" style={{ color: "#22D3EE" }}>›</span>
            <input
              placeholder="Ask anything about your infrastructure…"
              className="flex-1 bg-transparent outline-none text-[12px] font-mono"
              style={{ color: "rgba(237,237,248,0.85)" }}
            />
            <button
              className="rounded-md flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                background: "linear-gradient(135deg, #22D3EE, #3B82F6)",
                color: "#0A0A14",
              }}
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Connectors orbit
   ────────────────────────────────────────────── */
const ORBIT_PLATFORMS = [
  { name: "Kubernetes", dot: "#3B82F6", ring: 0, angle: 0    },
  { name: "GitHub",     dot: "#10B981", ring: 0, angle: 50   },
  { name: "Datadog",    dot: "#A78BFA", ring: 0, angle: 100  },
  { name: "AWS",        dot: "#FBBF24", ring: 0, angle: 150  },
  { name: "ArgoCD",     dot: "#FB923C", ring: 0, angle: 200  },
  { name: "Kafka",      dot: "#EC4899", ring: 0, angle: 250  },
  { name: "Terraform",  dot: "#A78BFA", ring: 0, angle: 300  },
  { name: "ServiceNow", dot: "#34D399", ring: 1, angle: 30   },
  { name: "Vault",      dot: "#FBBF24", ring: 1, angle: 90   },
  { name: "SonarQube",  dot: "#3B82F6", ring: 1, angle: 150  },
  { name: "SharePoint", dot: "#22D3EE", ring: 1, angle: 220  },
  { name: "Nexus",      dot: "#34D399", ring: 1, angle: 280  },
  { name: "Jira",       dot: "#5E6AD2", ring: 2, angle: 60   },
  { name: "JFrog",      dot: "#A78BFA", ring: 2, angle: 180  },
  { name: "OpenShift",  dot: "#EF4444", ring: 2, angle: 240  },
  { name: "API Connect",dot: "#FB923C", ring: 2, angle: 320  },
];

const RINGS = [
  { rx: 380, ry: 180 },
  { rx: 280, ry: 130 },
  { rx: 170, ry: 80  },
];

function ConnectorsOrbit() {
  return (
    <section id="connectors" className="px-6 md:px-10 py-24" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] mb-3" style={{ color: "rgba(255,255,255,0.42)" }}>
            CONNECTORS · 16 PLATFORMS · ZERO CONFIG
          </div>
          <h2
            style={{
              fontFamily: '"Instrument Sans", system-ui, sans-serif',
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "#EDEDF8",
            }}
          >
            Connect once.
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #5E6AD2 0%, #7170FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Resolve everything.
            </span>
          </h2>
          <p className="text-[15px] mt-4 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
            No YAML. No mapping files. Point Prism at your platforms with read-only credentials
            and the graph populates itself.
          </p>
        </div>

        <div className="relative mx-auto" style={{ width: "min(100%, 880px)", height: 460 }}>
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="-450 -250 900 500"
            preserveAspectRatio="xMidYMid meet"
            style={{ pointerEvents: "none" }}
          >
            <defs>
              <radialGradient id="orbitCenterGlow" cx="0" cy="0" r="0.5">
                <stop offset="0%" stopColor="rgba(94,106,210,0.45)" />
                <stop offset="50%" stopColor="rgba(94,106,210,0.10)" />
                <stop offset="100%" stopColor="rgba(94,106,210,0)" />
              </radialGradient>
              <linearGradient id="orbitLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(94,106,210,0.55)" />
                <stop offset="100%" stopColor="rgba(94,106,210,0)" />
              </linearGradient>
            </defs>
            {RINGS.map((r, i) => (
              <ellipse
                key={i}
                cx="0"
                cy="0"
                rx={r.rx}
                ry={r.ry}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
                strokeDasharray="2 6"
              />
            ))}
            <circle cx="0" cy="0" r="100" fill="url(#orbitCenterGlow)" />

            {ORBIT_PLATFORMS.map((p) => {
              const r = RINGS[p.ring];
              const a = (p.angle * Math.PI) / 180;
              const x = r.rx * Math.cos(a);
              const y = r.ry * Math.sin(a);
              return (
                <line
                  key={p.name}
                  x1="0"
                  y1="0"
                  x2={x}
                  y2={y}
                  stroke="url(#orbitLine)"
                  strokeWidth="0.8"
                  opacity="0.45"
                />
              );
            })}
          </svg>

          {ORBIT_PLATFORMS.map((p, i) => {
            const r = RINGS[p.ring];
            const a = (p.angle * Math.PI) / 180;
            const cx = 50 + ((r.rx * Math.cos(a)) / 880) * 100;
            const cy = 50 + ((r.ry * Math.sin(a)) / 460) * 100;
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i, duration: 0.4 }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md cursor-default"
                style={{
                  left: `${cx}%`,
                  top: `${cy}%`,
                  background: "rgba(11, 11, 22, 0.85)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "0 4px 18px rgba(0,0,0,0.45)",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 11,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.dot }} />
                <span style={{ color: "rgba(237,237,248,0.85)" }}>{p.name}</span>
              </motion.div>
            );
          })}

          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl flex items-center justify-center"
            style={{
              width: 80,
              height: 80,
              background: "linear-gradient(135deg, #5E6AD2, #7170FF)",
              boxShadow: "0 0 56px rgba(94,106,210,0.55), 0 0 0 1px rgba(255,255,255,0.10) inset",
            }}
          >
            <Network size={36} color="#FFFFFF" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Blast radius preview
   ────────────────────────────────────────────── */
function BlastRadiusPreview() {
  return (
    <section className="px-6 md:px-10 py-24" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(248, 113, 113, 0.04)",
            border: "1px solid rgba(248, 113, 113, 0.18)",
          }}
        >
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] mb-4" style={{ color: "#FCA5A5" }}>
            BLAST RADIUS · IF payments-svc FAILS
          </div>
          {[
            { name: "payments-svc",        impact: "ORIGIN",      color: "#F87171" },
            { name: "orders-svc",          impact: "DIRECT",      color: "#FBBF24" },
            { name: "checkout-api",        impact: "DIRECT",      color: "#FBBF24" },
            { name: "notification-svc",   impact: "TRANSITIVE",  color: "rgba(255,255,255,0.45)" },
            { name: "analytics-pipeline", impact: "TRANSITIVE",  color: "rgba(255,255,255,0.45)" },
          ].map((row, i, arr) => (
            <div
              key={row.name}
              className="flex items-center gap-3 py-2.5"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.color }} />
              <span className="text-[13px] font-mono flex-1" style={{ color: row.color === "#F87171" ? "#FCA5A5" : "rgba(237,237,248,0.7)" }}>
                {row.name}
              </span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{
                  background: row.impact === "ORIGIN"
                    ? "rgba(248,113,113,0.14)"
                    : row.impact === "DIRECT"
                    ? "rgba(251,191,36,0.10)"
                    : "rgba(255,255,255,0.04)",
                  color: row.impact === "ORIGIN" ? "#FCA5A5" : row.impact === "DIRECT" ? "#FCD34D" : "rgba(255,255,255,0.45)",
                  letterSpacing: "0.08em",
                }}
              >
                {row.impact}
              </span>
            </div>
          ))}
          <div className="mt-4 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.32)" }}>
            4 services impacted · 2 customer surfaces · calc 23 ms
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] mb-3" style={{ color: "rgba(255,255,255,0.42)" }}>
            BLAST RADIUS · IMPACT ANALYSIS
          </div>
          <h2
            style={{
              fontFamily: '"Instrument Sans", system-ui, sans-serif',
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "#EDEDF8",
            }}
          >
            Know what breaks
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #F87171 0%, #FB923C 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              before it does.
            </span>
          </h2>
          <p className="text-[15px] mt-4 max-w-lg" style={{ color: "rgba(255,255,255,0.5)" }}>
            Graph-traversal BFS surfaces every downstream service, team, and customer-facing
            endpoint in under 30ms. Run blast radius before every deploy, every patch, every
            configuration change.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Main page
   ────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: "#05050A",
        color: "#EDEDF8",
        fontFamily: '"Instrument Sans", system-ui, sans-serif',
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10"
        style={{
          height: 60,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(5, 5, 10, 0.78)",
          backdropFilter: "blur(20px)",
        }}
      >
        <Wordmark size="md" showTag />

        <div className="hidden md:flex items-center gap-1">
          {[
            { label: "CPT Engine", href: "#cpt" },
            { label: "Iris", href: "#iris" },
            { label: "Connectors", href: "#connectors" },
            { label: "Docs", href: "/docs" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={(e) => {
                if (l.href.startsWith("/")) {
                  e.preventDefault();
                  navigate(l.href);
                }
              }}
              className="text-[13px] font-medium px-3 py-2 rounded-md transition-colors"
              style={{ color: "rgba(255,255,255,0.55)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#EDEDF8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-md transition-colors"
            style={{ color: "rgba(255,255,255,0.55)" }}
            aria-label="Toggle theme"
          >
            <Sun size={14} />
          </button>
          <a
            href="#"
            className="hidden md:inline-block text-[13px] font-medium px-3 py-2 rounded-md"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Sign in
          </a>
          <button
            onClick={() => navigate("/topology")}
            className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-md transition-all"
            style={{
              background: "#5E6AD2",
              color: "#FFFFFF",
              boxShadow: "0 0 24px rgba(94,106,210,0.45)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#6C78DF";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 32px rgba(94,106,210,0.6)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#5E6AD2";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(94,106,210,0.45)";
            }}
          >
            Open Prism
            <ArrowRight size={13} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 md:px-10 pt-12 pb-24">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: 0.5,
            maskImage: "linear-gradient(180deg, black 0%, black 60%, transparent 100%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-7"
              style={{
                background: "rgba(94,106,210,0.08)",
                border: "1px solid rgba(94,106,210,0.25)",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#34D399", animation: "pulse 2s infinite" }} />
              <strong style={{ color: "#9DA5F5" }}>v0.9</strong>
              <span style={{ color: "rgba(255,255,255,0.45)" }}>—</span>
              <span style={{ color: "rgba(255,255,255,0.55)" }} className="uppercase tracking-[0.08em]">
                PRIVATE BETA · 16 PLATFORMS · PATENT PENDING
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              style={{
                fontFamily: '"Instrument Sans", system-ui, sans-serif',
                fontSize: "clamp(2.6rem, 6vw, 5rem)",
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: "-0.035em",
                color: "#EDEDF8",
                marginBottom: 24,
              }}
            >
              One truth for your
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #5E6AD2 0%, #7170FF 50%, #22D3EE 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                entire infrastructure.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-[16px] max-w-xl"
              style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 28 }}
            >
              Prism builds a unified knowledge graph over your entire technology estate —{" "}
              <strong style={{ color: "#EDEDF8" }}>16+ platforms, 17 entity types, zero brittle configuration.</strong>{" "}
              Ask Iris anything. Get graph-grounded answers.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex items-center gap-4 flex-wrap mb-10"
            >
              <button
                onClick={() => navigate("/topology")}
                className="flex items-center gap-2 font-semibold text-[14px] px-5 py-3 rounded-lg transition-all"
                style={{
                  background: "#5E6AD2",
                  color: "#FFFFFF",
                  boxShadow: "0 0 32px rgba(94,106,210,0.5), 0 4px 16px rgba(0,0,0,0.4)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "#6C78DF";
                  el.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "#5E6AD2";
                  el.style.transform = "translateY(0)";
                }}
              >
                Open Prism
                <ArrowRight size={14} />
              </button>
              <a href="#cpt" className="text-[14px] font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
                See it work →
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="grid grid-cols-3 gap-6 max-w-lg"
            >
              {[
                { value: 1675, suffix: "+", label: "ENTITIES RESOLVED" },
                { value: 97,   suffix: "%", label: "RESOLUTION ACCURACY" },
                { value: 0,    suffix: "",  label: "IRIS HALLUCINATIONS" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[28px] font-mono font-bold" style={{ color: "#EDEDF8", letterSpacing: "-0.02em" }}>
                    <Counter to={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.12em] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(8, 10, 18, 0.55)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
              minHeight: 580,
            }}
          >
            <HeroConvergence />
          </motion.div>
        </div>
      </section>

      <CptEngineSection />
      <DeveloperLensSection />
      <IrisSection />
      <ConnectorsOrbit />
      <BlastRadiusPreview />

      <section className="px-6 md:px-10 py-32 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] mb-3" style={{ color: "rgba(255,255,255,0.42)" }}>
            PRIVATE BETA · ENTERPRISE-ONLY
          </div>
          <h2
            style={{
              fontFamily: '"Instrument Sans", system-ui, sans-serif',
              fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "#EDEDF8",
              marginBottom: 16,
            }}
          >
            See your infrastructure
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #5E6AD2 0%, #7170FF 50%, #22D3EE 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              clearly, finally.
            </span>
          </h2>
          <p className="text-[15px] mb-10" style={{ color: "rgba(255,255,255,0.5)" }}>
            Open the demo. No signup, full sample tenant, real graph traversal in your browser.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate("/topology")}
              className="inline-flex items-center gap-2 font-semibold text-[14px] px-7 py-3.5 rounded-xl transition-all"
              style={{
                background: "#5E6AD2",
                color: "#FFFFFF",
                boxShadow: "0 0 40px rgba(94,106,210,0.5), 0 4px 20px rgba(0,0,0,0.4)",
              }}
            >
              Open Prism
              <ArrowRight size={14} />
            </button>
            <a href="#" className="text-[14px] font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
              Request enterprise access →
            </a>
          </div>
        </motion.div>
      </section>

      <footer
        className="px-6 md:px-10 py-8 flex items-center justify-between flex-wrap gap-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Wordmark size="sm" />
        <div className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
          © 2026 Prism Labs · CPT Engine patent-pending
        </div>
        <div className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
          One truth, every platform.
        </div>
      </footer>
    </div>
  );
}

void Sparkles;
