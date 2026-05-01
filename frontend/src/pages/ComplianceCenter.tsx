import { AlertTriangle, CheckCircle, Download, FileText, Search, Shield, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
import PageHead from "../components/common/PageHead";
import { ChipSelect, FilterChip } from "../components/common/FilterBar";
import Section, { Eyebrow, Mono, StatusDot } from "../components/common/Section";
import IrisQuickAsk from "../components/common/IrisQuickAsk";
import MetricCard from "../components/dashboard/MetricCard";

type Severity = "critical" | "high" | "medium" | "low";

const SEV_STYLE: Record<Severity, { bg: string; text: string; border: string }> = {
  critical: { bg: "var(--p-red-subtle)",    text: "var(--p-red)",    border: "var(--p-red)"    },
  high:     { bg: "var(--p-amber-subtle)",  text: "var(--p-amber)",  border: "var(--p-amber)"  },
  medium:   { bg: "var(--p-accent-subtle)", text: "var(--p-accent)", border: "var(--p-accent-border)" },
  low:      { bg: "var(--p-green-subtle)",  text: "var(--p-green)",  border: "var(--p-green)"  },
};

const FRAMEWORK_DEFAULTS: Record<string, { color: string; version: string }> = {
  "PCI-DSS":     { color: "#F59E0B", version: "v4.0" },
  "PCI DSS":     { color: "#F59E0B", version: "v4.0" },
  "PCI DSS 4.0": { color: "#F59E0B", version: "v4.0" },
  "SOC2":        { color: "#5E6AD2", version: "Type II" },
  "SOC 2":       { color: "#5E6AD2", version: "Type II" },
  "SOC 2 Type II": { color: "#5E6AD2", version: "Type II" },
  "HIPAA":       { color: "#EC4899", version: "Privacy" },
  "NIST":        { color: "#0EA5E9", version: "800-53" },
  "ISO":         { color: "#22D3EE", version: "27001" },
  "ISO 27001":   { color: "#22D3EE", version: "27001" },
  "GDPR":        { color: "#10B981", version: "EU" },
  "SOX":         { color: "#A855F7", version: "404" },
  "FedRAMP":     { color: "#8B5CF6", version: "Moderate" },
  "FedRAMP Mod.": { color: "#8B5CF6", version: "Moderate" },
};

function fwMeta(name: string) {
  return FRAMEWORK_DEFAULTS[name] || { color: "var(--p-accent)", version: "" };
}

const FALLBACK_FRAMEWORKS: Policy[] = [
  { name: "PCI-DSS", version: "v4.0",     score: 94.7, total_controls: 76,  passing: 71,  failing: 5   },
  { name: "SOC2",    version: "Type II",  score: 96.9, total_controls: 147, passing: 142, failing: 5   },
  { name: "HIPAA",   version: "Privacy",  score: 88.6, total_controls: 70,  passing: 62,  failing: 8   },
  { name: "NIST",    version: "800-53",   score: 79.4, total_controls: 218, passing: 173, failing: 45  },
  { name: "ISO",     version: "27001",    score: 91.2, total_controls: 113, passing: 103, failing: 10  },
  { name: "GDPR",    version: "EU",       score: 98.0, total_controls: 49,  passing: 48,  failing: 1   },
  { name: "SOX",     version: "404",      score: 87.5, total_controls: 48,  passing: 42,  failing: 6   },
  { name: "FedRAMP", version: "Moderate", score: 62.0, total_controls: 320, passing: 198, failing: 122 },
];

interface Policy {
  name: string;
  version?: string;
  score: number;
  total_controls: number;
  passing: number;
  failing: number;
}

interface Gap {
  id: string;
  entity: string;
  entity_type: string;
  policy: string;
  control: string;
  description: string;
  severity: Severity;
  remediation: string;
  evidence: string;
  since: string;
}

function FrameworkCard({ p, active, onClick }: { p: Policy; active: boolean; onClick: () => void }) {
  const score = p.score ?? 0;
  const scoreColor = score >= 80 ? "var(--p-green)" : score >= 70 ? "var(--p-amber)" : "var(--p-red)";
  const meta = fwMeta(p.name);
  const tileColor = meta.color;
  const version = p.version || meta.version;
  const tileLabel = (p.name.replace(/[^A-Za-z]/g, "").slice(0, 3) || "FW").toUpperCase();
  return (
    <button
      onClick={onClick}
      className="text-left p-4 rounded-xl transition-all"
      style={{
        background: active ? "var(--p-bg-elevated)" : "var(--p-bg-card)",
        boxShadow: active ? `0 0 0 1px var(--p-accent-border), var(--p-surface)` : "var(--p-surface)",
      }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
          style={{ background: tileColor, color: "#fff", fontFamily: '"Geist", system-ui, sans-serif' }}
        >
          {tileLabel}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold truncate" style={{ color: "var(--p-text-1)" }}>{p.name}</div>
          <Mono className="text-[10px]" style={{ color: "var(--p-text-3)" }}>{version}</Mono>
        </div>
      </div>
      <div className="flex items-baseline gap-1 mb-1.5">
        <Mono className="text-[26px] font-bold leading-none" style={{ color: scoreColor }}>{score.toFixed(1)}</Mono>
        <span className="text-[12px]" style={{ color: "var(--p-text-3)" }}>%</span>
      </div>
      <div className="w-full h-[5px] rounded-full mb-2.5" style={{ background: "var(--p-bg-elevated)" }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: tileColor }} />
      </div>
      <div className="flex items-center gap-3 text-[10px] font-mono">
        <span className="inline-flex items-center gap-1" style={{ color: "var(--p-green)" }}>
          <CheckCircle size={9} /> {p.passing}
        </span>
        <span className="inline-flex items-center gap-1" style={{ color: "var(--p-red)" }}>
          <XCircle size={9} /> {p.failing}
        </span>
        <span style={{ color: "var(--p-text-3)" }} className="ml-auto">{p.total_controls} controls</span>
      </div>
    </button>
  );
}

export default function ComplianceCenter() {
  const [severityFilter, setSeverityFilter] = useState<"all" | Severity>("all");
  const [policyFilter, setPolicyFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedGap, setSelectedGap] = useState<Gap | null>(null);

  const { data: dashboard } = useQuery({
    queryKey: ["compliance-dashboard"],
    queryFn: () => apiClient.get("/api/v1/compliance/dashboard").then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: gapsData } = useQuery({
    queryKey: ["compliance-gaps"],
    queryFn: () => apiClient.get(`/api/v1/compliance/gaps`).then((r) => r.data),
    staleTime: 30_000,
  });

  const policies: Policy[] = dashboard?.policies?.length ? dashboard.policies : FALLBACK_FRAMEWORKS;
  const allGaps: Gap[] = gapsData?.gaps || [];
  const overallScore = dashboard?.overall_score ?? 73.0;
  const overallColor = overallScore >= 80 ? "var(--p-green)" : overallScore >= 60 ? "var(--p-amber)" : "var(--p-red)";

  const visibleGaps = useMemo(() => {
    return allGaps.filter((g) => {
      if (severityFilter !== "all" && g.severity !== severityFilter) return false;
      if (policyFilter !== "all" && g.policy !== policyFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !g.entity.toLowerCase().includes(q) &&
          !g.description.toLowerCase().includes(q) &&
          !g.control.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [allGaps, severityFilter, policyFilter, search]);

  const sevCounts = {
    critical: allGaps.filter((g) => g.severity === "critical").length,
    high: allGaps.filter((g) => g.severity === "high").length,
    medium: allGaps.filter((g) => g.severity === "medium").length,
    low: allGaps.filter((g) => g.severity === "low").length,
  };

  return (
    <div className="flex flex-col w-full min-h-full">
      <PageHead
        eyebrow="Governance"
        title="Compliance Center"
        subtitle={`${policies.length || 8} frameworks · ${allGaps.length} open gaps · automated control mapping`}
        actions={
          <>
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "transparent", color: "var(--p-text-2)", boxShadow: "var(--p-surface)", fontFamily: '"Geist", system-ui, sans-serif' }}
            >
              <FileText size={12} /> Audit log
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "var(--p-accent)", color: "var(--p-text-inv)", fontFamily: '"Geist", system-ui, sans-serif' }}
            >
              <Download size={12} /> Export evidence
            </button>
          </>
        }
      />

      {/* Metric strip */}
      <div className="grid grid-cols-6 gap-3 px-6 pb-4">
        <div className="p-4 rounded-xl flex flex-col gap-1" style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface)" }}>
          <Eyebrow>Overall posture</Eyebrow>
          <div className="flex items-baseline gap-1">
            <Mono className="text-[24px] font-bold leading-none" style={{ color: overallColor }}>
              {overallScore.toFixed(1)}
            </Mono>
            <span className="text-xs" style={{ color: "var(--p-text-3)" }}>%</span>
          </div>
        </div>
        <MetricCard label="Frameworks"  value={policies.length || 8} />
        <MetricCard label="Open Gaps"   value={allGaps.length} trendDirection={allGaps.length > 5 ? "down" : "neutral"} />
        <MetricCard label="Critical"    value={sevCounts.critical} trendDirection={sevCounts.critical > 0 ? "down" : "neutral"} />
        <MetricCard label="High"        value={sevCounts.high} />
        <MetricCard label="Mean fix"    value="11d" trendDirection="up" trend={4} />
      </div>

      {/* Framework cards */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-4 gap-3">
          {policies.map((p) => (
            <FrameworkCard
              key={p.name}
              p={p}
              active={policyFilter === p.name}
              onClick={() => setPolicyFilter(policyFilter === p.name ? "all" : p.name)}
            />
          ))}
        </div>
      </div>

      {/* Filter row */}
      <div className="px-6 pb-3 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1" style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface)" }}>
          <Search size={12} style={{ color: "var(--p-text-3)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search controls, entities, descriptions…"
            className="flex-1 bg-transparent outline-none text-xs font-mono"
            style={{ color: "var(--p-text-1)" }}
          />
        </div>
        <FilterChip active={severityFilter === "all"} onClick={() => setSeverityFilter("all")}>All severities</FilterChip>
        <FilterChip active={severityFilter === "critical"} onClick={() => setSeverityFilter("critical")} count={sevCounts.critical}>Critical</FilterChip>
        <FilterChip active={severityFilter === "high"} onClick={() => setSeverityFilter("high")} count={sevCounts.high}>High</FilterChip>
        <FilterChip active={severityFilter === "medium"} onClick={() => setSeverityFilter("medium")} count={sevCounts.medium}>Medium</FilterChip>
        <FilterChip active={severityFilter === "low"} onClick={() => setSeverityFilter("low")} count={sevCounts.low}>Low</FilterChip>
        <ChipSelect
          label="framework"
          value={policyFilter}
          onChange={setPolicyFilter}
          options={[{ value: "all", label: "all" }, ...policies.map((p) => ({ value: p.name, label: p.name }))]}
        />
      </div>

      {/* Main grid: gaps table | evidence sidebar */}
      <div className="grid grid-cols-12 gap-4 px-6 pb-6 flex-1">
        <div className="col-span-9 min-w-0">
          <Section
            eyebrow={`${visibleGaps.length} of ${allGaps.length}`}
            title="Compliance gaps"
            actions={
              <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>
                <AlertTriangle size={10} /> sorted by severity
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--p-border-subtle)" }}>
                    {["Severity", "Entity", "Framework / Control", "Description", "Aged", ""].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2 px-4 text-[10px] font-mono uppercase tracking-wider"
                        style={{ color: "var(--p-text-3)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleGaps.map((g) => {
                    const sev = SEV_STYLE[g.severity];
                    const days = Math.round((Date.now() - new Date(g.since).getTime()) / 86400000);
                    const active = selectedGap?.id === g.id;
                    return (
                      <tr
                        key={g.id}
                        onClick={() => setSelectedGap(g)}
                        className="cursor-pointer transition-colors"
                        style={{
                          borderBottom: "1px solid var(--p-border-subtle)",
                          background: active ? "var(--p-bg-elevated)" : "transparent",
                        }}
                        onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                        onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 rounded font-mono"
                            style={{ background: sev.bg, color: sev.text, border: `1px solid ${sev.border}` }}>
                            <StatusDot status={g.severity === "critical" || g.severity === "high" ? "crit" : g.severity === "medium" ? "warn" : "ok"} size={6} />
                            {g.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Mono className="text-[12px] font-semibold" style={{ color: "var(--p-text-1)" }}>{g.entity}</Mono>
                          <div className="text-[10px]" style={{ color: "var(--p-text-3)" }}>{g.entity_type}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Mono className="text-[11px]" style={{ color: "var(--p-text-2)" }}>{g.policy}</Mono>
                          <Mono className="text-[10px]" style={{ color: "var(--p-text-3)" }}>{g.control}</Mono>
                        </td>
                        <td className="py-3 px-4 max-w-md">
                          <div className="text-[12px] truncate" style={{ color: "var(--p-text-1)" }}>{g.description}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Mono className="text-[11px]" style={{ color: days > 60 ? "var(--p-red)" : days > 30 ? "var(--p-amber)" : "var(--p-text-3)" }}>
                            {days}d
                          </Mono>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>view →</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {visibleGaps.length === 0 && (
                <div className="px-4 py-12 text-center text-xs" style={{ color: "var(--p-text-3)" }}>
                  No gaps for the current filters.
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* Evidence sidebar */}
        <div className="col-span-3 flex flex-col gap-4 min-w-0">
          {selectedGap ? (
            <Section eyebrow="Evidence" title={selectedGap.id}>
              <div className="px-4 py-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                    style={{ background: SEV_STYLE[selectedGap.severity].bg, color: SEV_STYLE[selectedGap.severity].text, border: `1px solid ${SEV_STYLE[selectedGap.severity].border}` }}
                  >
                    {selectedGap.severity}
                  </span>
                  <Mono className="text-[10px]" style={{ color: "var(--p-text-3)" }}>{selectedGap.policy} · {selectedGap.control}</Mono>
                </div>
                <div>
                  <Eyebrow>Entity</Eyebrow>
                  <Mono className="text-[12px] font-semibold" style={{ color: "var(--p-text-1)" }}>{selectedGap.entity}</Mono>
                  <Mono className="text-[10px] block" style={{ color: "var(--p-text-3)" }}>{selectedGap.entity_type}</Mono>
                </div>
                <div>
                  <Eyebrow>Finding</Eyebrow>
                  <p className="text-[12px]" style={{ color: "var(--p-text-1)" }}>{selectedGap.description}</p>
                </div>
                <div>
                  <Eyebrow>Evidence</Eyebrow>
                  <div className="rounded-lg p-2.5 text-[11px] font-mono"
                       style={{ background: "var(--p-bg-elevated)", color: "var(--p-text-2)" }}>
                    {selectedGap.evidence}
                  </div>
                </div>
                <div>
                  <Eyebrow>Remediation</Eyebrow>
                  <div className="rounded-lg p-2.5 text-[12px]"
                       style={{ background: "var(--p-accent-subtle)", color: "var(--p-text-1)", border: "1px solid var(--p-accent-border)" }}>
                    {selectedGap.remediation}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono pt-1" style={{ color: "var(--p-text-3)" }}>
                  <span>since {selectedGap.since}</span>
                  <span>{Math.round((Date.now() - new Date(selectedGap.since).getTime()) / 86400000)} days open</span>
                </div>
                <button
                  className="w-full text-[11px] py-1.5 rounded-md"
                  style={{ background: "var(--p-accent)", color: "var(--p-text-inv)", fontFamily: '"Geist", system-ui, sans-serif' }}
                >
                  Create remediation ticket
                </button>
              </div>
            </Section>
          ) : (
            <Section eyebrow="Evidence" title="No selection">
              <div className="px-4 py-6 text-center">
                <Shield size={24} className="mx-auto mb-2" style={{ color: "var(--p-text-3)" }} />
                <p className="text-xs" style={{ color: "var(--p-text-2)" }}>
                  Click any compliance gap to view evidence, control mapping, and remediation steps.
                </p>
              </div>
            </Section>
          )}

          <Section eyebrow="Top risk" title="Critical entities">
            <div className="px-4 py-3 space-y-2">
              {(dashboard?.top_risks || []).slice(0, 5).map((r: any) => (
                <div key={`${r.entity}-${r.control}`} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <Mono className="text-[11px] truncate block" style={{ color: "var(--p-text-1)" }}>{r.entity}</Mono>
                    <Mono className="text-[10px]" style={{ color: "var(--p-text-3)" }}>{r.policy} · {r.control}</Mono>
                  </div>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-mono flex-shrink-0"
                    style={{ background: SEV_STYLE[r.severity as Severity].bg, color: SEV_STYLE[r.severity as Severity].text }}
                  >
                    {r.severity}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <IrisQuickAsk
            context="compliance"
            prompts={[
              "Which services are non-compliant with PCI-DSS?",
              "Show me the oldest unresolved gaps",
              "What controls are GDPR Art. 17 mapped to?",
              "Generate evidence report for SOC2 audit",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
