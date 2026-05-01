import { LineChart, Plus, Sparkles, Mail, FileText, X, Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import PageHead from "../components/common/PageHead";
import MetricCard from "../components/dashboard/MetricCard";
import IrisQuickAsk from "../components/common/IrisQuickAsk";

/* ──────────────────────────────────────────────
   Mock data — mirrors reference design
   ────────────────────────────────────────────── */

interface ReportDef {
  name: string;
  color: string;
  desc: string;
  sched: string;
  last: string;
  status: "ok" | "warn";
  spark: number[];
}

const REPORTS: ReportDef[] = [
  { name: "SOC 2 evidence pack",    color: "var(--p-accent)", desc: "Quarterly bundle of control evidence. Auto-collected from graph.",  sched: "Weekly · Mon 9am", last: "Mon",   status: "ok",   spark: [90, 91, 92, 93, 94, 95, 95, 96, 96, 96, 96, 96] },
  { name: "Open incident summary",  color: "var(--p-red)",    desc: "Cross-team rollup of all incidents with MTTR and ownership.",       sched: "Daily · 9am",      last: "today", status: "ok",   spark: [2, 3, 1, 4, 2, 3, 2, 1, 3, 2, 3, 3] },
  { name: "Vulnerability posture",  color: "var(--p-amber)",  desc: "CVE counts by severity, SBOM diff vs last week.",                   sched: "Weekly",           last: "Fri",   status: "ok",   spark: [24, 28, 22, 30, 18, 16, 12, 12, 12, 12, 12, 12] },
  { name: "Connector health",       color: "var(--p-iris)",   desc: "Sync latency, failed pulls, schema drift across 13 platforms.",     sched: "Daily",            last: "today", status: "warn", spark: [100, 100, 98, 99, 97, 99, 100, 98, 96, 95, 94, 95] },
  { name: "Cost by application",    color: "var(--p-green)",  desc: "AWS + Snowflake + Datadog spend by app and squad.",                sched: "Monthly · 1st",    last: "30d",   status: "ok",   spark: [40, 45, 50, 48, 55, 60, 58, 65, 70, 72, 74, 78] },
  { name: "Top blast radii",        color: "#8B5CF6",         desc: "Services with largest downstream impact. Updated continuously.",   sched: "Real-time",        last: "now",   status: "ok",   spark: [12, 14, 17, 15, 16, 17, 17, 17, 17, 17, 17, 17] },
  { name: "SLO error budget",       color: "var(--p-green)",  desc: "Monthly error budget burn rate by service and team.",              sched: "Weekly",           last: "Mon",   status: "ok",   spark: [100, 99, 98, 99, 98, 97, 96, 97, 98, 97, 96, 96] },
  { name: "Change impact analysis", color: "#3B82F6",         desc: "Every deploy in the last 30d with downstream entity impact.",      sched: "Daily",            last: "today", status: "ok",   spark: [14, 12, 16, 18, 14, 12, 14, 14, 14, 14, 14, 14] },
];

const SCHEDULE = [
  { name: "SOC 2 evidence pack",   next: "Mon 9am",      recipients: 4,  format: "PDF" },
  { name: "Open incident summary", next: "Tomorrow 9am", recipients: 12, format: "Slack + PDF" },
  { name: "Vulnerability posture", next: "Next Fri",     recipients: 6,  format: "PDF" },
  { name: "Connector health",      next: "Tomorrow 9am", recipients: 3,  format: "Email" },
  { name: "Cost by application",   next: "Jun 1st",      recipients: 8,  format: "PDF + CSV" },
];

const SUBSCRIBERS = [
  { name: "jordan@",       count: 7 },
  { name: "sara@",         count: 5 },
  { name: "platform-eng@", count: 4 },
  { name: "security@",     count: 3 },
];

const FORMAT_BARS = [
  { label: "PDF",   count: 28, pct: 70, color: "var(--p-accent)" },
  { label: "Slack", count: 20, pct: 50, color: "#4A154B" },
  { label: "Email", count: 10, pct: 25, color: "var(--p-iris)" },
];

const IRIS_PROMPTS = [
  "Summarize key risk indicators from all reports this week",
  "Generate a board-ready infrastructure health summary",
];

/* ──────────────────────────────────────────────
   SVG sparkline
   ────────────────────────────────────────────── */

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 240;
  const h = 40;
  const p = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = p + ((w - 2 * p) * i) / (values.length - 1);
    const y = h - p - ((v - min) / range) * (h - 2 * p);
    return [x, y] as const;
  });
  const path = pts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(" ");
  const area = `${path} L ${pts[pts.length - 1][0].toFixed(1)} ${h} L ${pts[0][0].toFixed(1)} ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: 40 }}>
      <path d={area} fill={color} opacity={0.12} />
      <path d={path} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ──────────────────────────────────────────────
   UI primitives
   ────────────────────────────────────────────── */

function StatusPill({ status }: { status: "ok" | "warn" }) {
  const isOk = status === "ok";
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-md text-[10px] font-mono font-medium"
      style={{
        background: isOk ? "var(--p-green-subtle)" : "var(--p-amber-subtle)",
        color: isOk ? "var(--p-green)" : "var(--p-amber)",
        border: `1px solid ${isOk ? "var(--p-green)" : "var(--p-amber)"}`,
        borderColor: "transparent",
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: isOk ? "var(--p-green)" : "var(--p-amber)" }}
      />
      {isOk ? "ok" : "drift"}
    </span>
  );
}

function FormatPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-[2px] rounded-md text-[10px] font-mono"
      style={{
        background: "var(--p-bg-elevated)",
        color: "var(--p-text-2)",
        border: "1px solid var(--p-border)",
      }}
    >
      {children}
    </span>
  );
}

function SidePanel({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: accent ? "var(--p-iris-subtle)" : "var(--p-bg-card)",
        boxShadow: accent ? "inset 0 0 0 1px var(--p-iris-border)" : "var(--p-surface)",
      }}
    >
      <h4
        className="text-[10px] font-mono uppercase tracking-[0.12em] mb-2.5 font-medium"
        style={{ color: accent ? "var(--p-iris)" : "var(--p-text-3)" }}
      >
        {title}
      </h4>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function SideRow({
  k, v, vColor, bar,
}: {
  k: string;
  v: string | number;
  vColor?: string;
  bar?: { pct: number; color: string };
}) {
  return (
    <div
      className="flex items-center gap-2.5 py-[7px] text-[11px] font-mono"
      style={{ borderBottom: "1px solid var(--p-border-subtle)" }}
    >
      <span className="flex-1 truncate" style={{ color: "var(--p-text-2)" }}>{k}</span>
      {bar && (
        <div className="flex-1 h-1 rounded-sm overflow-hidden" style={{ background: "var(--p-bg-elevated)" }}>
          <span className="block h-full rounded-sm" style={{ width: `${bar.pct}%`, background: bar.color }} />
        </div>
      )}
      <span className="font-semibold" style={{ color: vColor || "var(--p-text-1)" }}>{v}</span>
    </div>
  );
}

function HeaderButton({
  variant = "ghost", onClick, children, icon,
}: {
  variant?: "ghost" | "primary" | "iris";
  onClick?: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const styles =
    variant === "primary"
      ? { bg: "var(--p-accent)", fg: "var(--p-text-inv)", border: "var(--p-accent)", glow: "0 0 18px var(--p-accent-glow)" }
      : variant === "iris"
      ? { bg: "var(--p-iris)", fg: "var(--p-bg-deep)", border: "var(--p-iris)", glow: "0 0 18px var(--p-iris-glow)" }
      : { bg: "var(--p-bg-card)", fg: "var(--p-text-2)", border: "var(--p-border)", glow: "none" };

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
      style={{
        background: styles.bg,
        color: styles.fg,
        border: `1px solid ${styles.border}`,
        boxShadow: styles.glow,
        fontFamily: '"Geist", system-ui, sans-serif',
      }}
    >
      {icon}
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────
   Main page
   ────────────────────────────────────────────── */

function formatIcon(format: string) {
  if (format.includes("Slack")) return <Mail size={13} style={{ color: "var(--p-text-3)" }} />;
  if (format.includes("Email")) return <Mail size={13} style={{ color: "var(--p-text-3)" }} />;
  return <FileText size={13} style={{ color: "var(--p-text-3)" }} />;
}

/* ──────────────────────────────────────────────
   New Report Modal
   ────────────────────────────────────────────── */
function NewReportModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("compliance");
  const [schedule, setSchedule] = useState("daily");
  const [recipients, setRecipients] = useState("");
  const [format, setFormat] = useState("PDF");
  const [saved, setSaved] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface-float)" }}>
        <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: "1px solid var(--p-border)" }}>
          <LineChart size={16} style={{ color: "var(--p-accent)" }} />
          <span className="text-[15px] font-semibold flex-1" style={{ color: "var(--p-text-1)" }}>New report</span>
          <button onClick={onClose} style={{ color: "var(--p-text-3)" }}><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium" style={{ color: "var(--p-text-2)" }}>Report name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weekly PCI-DSS gap summary"
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
              style={{ background: "var(--p-bg-elevated)", border: "1px solid var(--p-border)", color: "var(--p-text-1)" }}
              onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-accent)"; }}
              onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-border)"; }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium" style={{ color: "var(--p-text-2)" }}>Report type</label>
              <div className="relative">
                <select value={type} onChange={e => setType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[12px] outline-none appearance-none"
                  style={{ background: "var(--p-bg-elevated)", border: "1px solid var(--p-border)", color: "var(--p-text-1)" }}>
                  <option value="compliance">Compliance evidence</option>
                  <option value="health">Health dashboard</option>
                  <option value="vulnerabilities">Vulnerability posture</option>
                  <option value="blast_radius">Blast radius</option>
                  <option value="cost">Cost by application</option>
                  <option value="changes">Change impact</option>
                  <option value="custom">Custom query</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--p-text-3)" }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium" style={{ color: "var(--p-text-2)" }}>Format</label>
              <div className="flex gap-1.5">
                {["PDF", "CSV", "Slack", "Email"].map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                    className="flex-1 py-2 rounded-lg text-[11px] font-mono transition-all"
                    style={{
                      background: format === f ? "var(--p-accent-subtle)" : "var(--p-bg-elevated)",
                      color: format === f ? "var(--p-accent)" : "var(--p-text-3)",
                      border: `1px solid ${format === f ? "var(--p-accent-border)" : "var(--p-border)"}`,
                    }}>{f}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium" style={{ color: "var(--p-text-2)" }}>Schedule</label>
              <div className="relative">
                <select value={schedule} onChange={e => setSchedule(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[12px] outline-none appearance-none"
                  style={{ background: "var(--p-bg-elevated)", border: "1px solid var(--p-border)", color: "var(--p-text-1)" }}>
                  <option value="realtime">Real-time</option>
                  <option value="daily">Daily · 9am</option>
                  <option value="weekly">Weekly · Mon 9am</option>
                  <option value="monthly">Monthly · 1st</option>
                  <option value="manual">Manual only</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--p-text-3)" }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium" style={{ color: "var(--p-text-2)" }}>Recipients (emails)</label>
              <input value={recipients} onChange={e => setRecipients(e.target.value)}
                placeholder="jordan@, sara@"
                className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                style={{ background: "var(--p-bg-elevated)", border: "1px solid var(--p-border)", color: "var(--p-text-1)" }} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid var(--p-border)" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[12px]" style={{ color: "var(--p-text-2)" }}>Cancel</button>
          <button onClick={handleCreate} disabled={!name.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-[12px] font-semibold"
            style={{ background: saved ? "var(--p-green)" : name.trim() ? "var(--p-accent)" : "var(--p-bg-elevated)", color: name.trim() ? "#fff" : "var(--p-text-3)" }}>
            {saved ? <><Check size={12} /> Created!</> : "Create report"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "var(--p-bg-main)" }}>
      <PageHead
        eyebrow="INTELLIGENCE · ANALYTICS"
        title="Reports"
        subtitle={`${REPORTS.length} reports running on schedule. Every report is reproducible — runs against the canonical graph at any point in time. Iris can narrate any report.`}
        actions={
          <>
            <HeaderButton onClick={() => window.open("https://docs.prism.internal/reports/templates", "_blank")}>Templates</HeaderButton>
            <HeaderButton variant="iris" icon={<Sparkles size={12} />} onClick={() => window.location.assign("/iris")}>Iris briefing</HeaderButton>
            <HeaderButton variant="primary" icon={<Plus size={12} />} onClick={() => setShowNew(true)}>
              New report
            </HeaderButton>
          </>
        }
      />

      <div className="px-6 pb-8 space-y-4">
        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Active" value={REPORTS.length} />
          <MetricCard label="Subscribers" value="42" />
          <MetricCard label="Avg run time" value="1.4" unit="s" trend={0.2} trendDirection="up" />
          <MetricCard label="Failed 7d" value="0" />
        </div>

        {/* Two-col layout */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 280px" }}>
          {/* LEFT — main */}
          <div className="flex flex-col gap-4">
            {/* Report cards 2x4 */}
            <div className="grid grid-cols-2 gap-3">
              {REPORTS.map(r => (
                <div
                  key={r.name}
                  className="rounded-xl p-4 transition-all cursor-pointer"
                  style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--p-surface-elevated)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--p-surface)"; }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: `color-mix(in srgb, ${r.color} 14%, transparent)`, color: r.color }}
                      >
                        <LineChart size={14} />
                      </div>
                      <div className="text-[13px] font-semibold truncate" style={{ color: "var(--p-text-1)" }}>
                        {r.name}
                      </div>
                    </div>
                    <StatusPill status={r.status} />
                  </div>
                  <div
                    className="text-[12px] mb-2 leading-snug"
                    style={{ color: "var(--p-text-2)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                  >
                    {r.desc}
                  </div>
                  <Sparkline values={r.spark} color={r.color} />
                  <div
                    className="flex items-center justify-between pt-2.5 mt-2 text-[10.5px] font-mono"
                    style={{ borderTop: "1px solid var(--p-border-subtle)", color: "var(--p-text-3)" }}
                  >
                    <span>{r.sched}</span>
                    <span>last: {r.last}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Scheduled deliveries */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface)" }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid var(--p-border-subtle)" }}
              >
                <h4
                  className="text-[10px] font-mono uppercase tracking-[0.12em] font-medium"
                  style={{ color: "var(--p-text-3)" }}
                >
                  Upcoming scheduled deliveries
                </h4>
              </div>
              <div>
                {SCHEDULE.map((s, i) => (
                  <div
                    key={s.name}
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={{ borderBottom: i < SCHEDULE.length - 1 ? "1px solid var(--p-border-subtle)" : "none" }}
                  >
                    {formatIcon(s.format)}
                    <span className="flex-1 text-[12.5px] font-medium" style={{ color: "var(--p-text-1)" }}>
                      {s.name}
                    </span>
                    <span className="text-[10.5px] font-mono" style={{ color: "var(--p-text-3)" }}>
                      {s.recipients} recipients
                    </span>
                    <FormatPill>{s.format}</FormatPill>
                    <span
                      className="text-[11px] font-mono w-24 text-right"
                      style={{ color: "var(--p-text-2)" }}
                    >
                      {s.next}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — sidebar */}
          <div className="flex flex-col gap-4">
            <SidePanel title="Run history · 7d">
              <SideRow k="Total runs" v="58" />
              <SideRow k="Successful" v="58" vColor="var(--p-green)" />
              <SideRow k="Failed" v="0" />
              <SideRow k="Avg runtime" v="1.4s" />
              <SideRow k="Pages delivered" v="247" />
            </SidePanel>

            <SidePanel title="By format">
              {FORMAT_BARS.map(b => (
                <SideRow key={b.label} k={b.label} v={b.count} bar={{ pct: b.pct, color: b.color }} />
              ))}
            </SidePanel>

            <SidePanel title="Top subscribers">
              {SUBSCRIBERS.map(s => (
                <SideRow key={s.name} k={s.name} v={`${s.count} reports`} />
              ))}
            </SidePanel>

            <IrisQuickAsk prompts={IRIS_PROMPTS} context="reports" />
          </div>
        </div>
      </div>
      {showNew && <NewReportModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
