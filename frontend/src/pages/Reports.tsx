import { Download, FileText, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";

const REPORTS = [
  {
    id: "r1", name: "Q1 2025 Compliance Summary", type: "Compliance",
    generated: "2025-01-28", status: "ready", size: "2.4 MB",
    desc: "PCI-DSS, SOC2, HIPAA gap analysis across all 1,675 entities",
  },
  {
    id: "r2", name: "Blast Radius Risk Report", type: "Risk",
    generated: "2025-01-27", status: "ready", size: "1.1 MB",
    desc: "Top 10 high-risk nodes with cascading failure analysis",
  },
  {
    id: "r3", name: "Platform Inventory — January 2025", type: "Inventory",
    generated: "2025-01-25", status: "ready", size: "5.8 MB",
    desc: "Full entity manifest across 13 platforms with relationship map",
  },
  {
    id: "r4", name: "Vulnerability Remediation Status", type: "Security",
    generated: "2025-01-22", status: "ready", size: "890 KB",
    desc: "5 CVEs tracked: 1 critical, 2 high, 2 medium — with SLA status",
  },
  {
    id: "r5", name: "Service Health Trend — 30 Days", type: "Health",
    generated: "2025-01-20", status: "ready", size: "3.2 MB",
    desc: "Health score trends across 12 services with degradation alerts",
  },
  {
    id: "r6", name: "Executive Risk Posture — Board Pack", type: "Executive",
    generated: "2025-01-15", status: "ready", size: "1.9 MB",
    desc: "C-suite summary: risk heat map, compliance posture, top threats",
  },
];

const SCHEDULED = [
  { name: "Weekly Compliance Digest", cadence: "Every Monday 08:00", next: "Feb 3, 2025", type: "Compliance" },
  { name: "Monthly Vulnerability Report", cadence: "1st of month", next: "Feb 1, 2025", type: "Security" },
  { name: "Quarterly Board Pack", cadence: "Quarterly", next: "Apr 1, 2025", type: "Executive" },
];

const TYPE_COLORS: Record<string, string> = {
  Compliance: "var(--p-green)", Risk: "var(--p-red)", Inventory: "#3B82F6",
  Security: "var(--p-amber)", Health: "#8B5CF6", Executive: "var(--p-iris)",
};

const STAT_COLORS = ["var(--p-iris)", "var(--p-green)", "var(--p-amber)", "#8B5CF6"];

export default function Reports() {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--p-text-1)", fontFamily: '"Syne", sans-serif' }}>Reports</h1>
          <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--p-text-3)" }}>Compliance exports · risk summaries · board-ready</p>
        </div>
        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: generating ? "var(--p-iris-subtle)" : "var(--p-iris)",
            color: generating ? "var(--p-iris)" : "var(--p-bg-deep)",
            border: generating ? "1px solid var(--p-iris-border)" : "none",
          }}
        >
          {generating ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
          {generating ? "Generating…" : "New Report"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Reports", value: "24" },
          { label: "This Month", value: "6" },
          { label: "Scheduled", value: "3" },
          { label: "Avg Size", value: "2.5 MB" },
        ].map((s, i) => (
          <div key={s.label} className="p-4 rounded-xl" style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)" }}>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--p-text-3)" }}>{s.label}</div>
            <div className="text-2xl font-mono font-bold" style={{ color: STAT_COLORS[i] }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recent reports */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.15em] mb-3 font-semibold" style={{ color: "var(--p-text-3)" }}>Recent Reports</div>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--p-border)" }}>
          {REPORTS.map((r, i) => {
            const tc = TYPE_COLORS[r.type] || "var(--p-text-3)";
            return (
              <div key={r.id}
                className="flex items-center gap-4 px-4 py-3.5 transition-colors"
                style={{ borderBottom: i < REPORTS.length - 1 ? "1px solid var(--p-border)" : "none", background: "var(--p-bg-main)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--p-bg-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--p-bg-main)")}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)" }}>
                  <FileText size={15} style={{ color: tc }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold" style={{ color: "var(--p-text-1)" }}>{r.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                      style={{ background: "var(--p-bg-card)", color: tc, border: "1px solid var(--p-border)" }}>{r.type}</span>
                  </div>
                  <div className="text-[10px] truncate" style={{ color: "var(--p-text-3)" }}>{r.desc}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>{r.generated}</div>
                  <div className="text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>{r.size}</div>
                </div>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium flex-shrink-0 transition-all"
                  style={{ background: "var(--p-bg-border)", color: "var(--p-text-3)", border: "1px solid var(--p-border)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--p-iris)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--p-iris-border)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--p-text-3)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--p-border)";
                  }}>
                  <Download size={10} />
                  Download
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scheduled reports */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.15em] mb-3 font-semibold" style={{ color: "var(--p-text-3)" }}>Scheduled</div>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--p-border)" }}>
          {SCHEDULED.map((s, i) => {
            const tc = TYPE_COLORS[s.type] || "var(--p-text-3)";
            return (
              <div key={s.name}
                className="flex items-center gap-4 px-4 py-3 transition-colors"
                style={{ borderBottom: i < SCHEDULED.length - 1 ? "1px solid var(--p-border)" : "none", background: "var(--p-bg-main)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--p-bg-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--p-bg-main)")}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tc }} />
                <div className="flex-1">
                  <div className="text-xs font-medium" style={{ color: "var(--p-text-1)" }}>{s.name}</div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--p-text-3)" }}>{s.cadence}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px]" style={{ color: "var(--p-text-3)" }}>Next run</div>
                  <div className="text-[10px] font-mono font-medium" style={{ color: "var(--p-iris)" }}>{s.next}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
