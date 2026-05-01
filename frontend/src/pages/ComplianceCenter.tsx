import { AlertTriangle, CheckCircle, Filter, XCircle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";

type Severity = "critical" | "high" | "medium" | "low";

const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; border: string }> = {
  critical: { bg: "rgba(239,68,68,0.12)", text: "#EF4444", border: "rgba(239,68,68,0.3)" },
  high: { bg: "rgba(234,88,12,0.12)", text: "#EA580C", border: "rgba(234,88,12,0.3)" },
  medium: { bg: "rgba(217,119,6,0.12)", text: "#D97706", border: "rgba(217,119,6,0.3)" },
  low: { bg: "rgba(34,197,94,0.12)", text: "#22C55E", border: "rgba(34,197,94,0.3)" },
};

const CARD_STYLE = { background: "var(--p-bg-card)", border: "1px solid var(--p-border)" };

function PolicyCard({ name, score, totalControls, passing, failing }: {
  name: string; score: number; totalControls: number; passing: number; failing: number;
}) {
  const color = score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div className="p-5 rounded-xl" style={CARD_STYLE}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold " style={{ color: "var(--p-text-1)" }}>{name}</span>
        <span className="text-2xl font-mono font-bold" style={{ color }}>{score}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full mb-4" style={{ background: "var(--p-bg-border)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <div className="flex items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1" style={{ color: "#22C55E" }}>
          <CheckCircle size={11} />
          <span>{passing} passing</span>
        </div>
        <div className="flex items-center gap-1" style={{ color: "#EF4444" }}>
          <XCircle size={11} />
          <span>{failing} failing</span>
        </div>
        <span className="text-slate-600 ml-auto">{totalControls} controls</span>
      </div>
    </div>
  );
}

export default function ComplianceCenter() {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [policyFilter, setPolicyFilter] = useState("all");

  const { data: dashboard } = useQuery({
    queryKey: ["compliance-dashboard"],
    queryFn: () => apiClient.get("/api/v1/compliance/dashboard").then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: gapsData } = useQuery({
    queryKey: ["compliance-gaps", severityFilter, policyFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (severityFilter !== "all") params.set("severity", severityFilter);
      if (policyFilter !== "all") params.set("policy", policyFilter);
      return apiClient.get(`/api/v1/compliance/gaps?${params}`).then((r) => r.data);
    },
    staleTime: 30_000,
  });

  const policies = dashboard?.policies || [];
  const gaps = gapsData?.gaps || [];
  const overallScore = dashboard?.overall_score || 74.2;
  const overallColor = overallScore >= 80 ? "#22C55E" : overallScore >= 60 ? "#F59E0B" : "#EF4444";
  const defaultPolicies = [
    { name: "PCI-DSS", score: 68, total_controls: 12, passing: 8, failing: 4 },
    { name: "SOC2", score: 81, total_controls: 15, passing: 12, failing: 3 },
    { name: "HIPAA", score: 73, total_controls: 10, passing: 7, failing: 3 },
  ];
  const displayPolicies = policies.length ? policies : defaultPolicies;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Compliance Center</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">PCI-DSS · SOC2 · HIPAA — automated gap analysis</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-3xl font-mono font-bold" style={{ color: overallColor }}>
            {overallScore.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-600">Overall compliance</div>
        </div>
      </div>

      {/* Policy cards */}
      <div className="grid grid-cols-3 gap-4">
        {displayPolicies.map((p: any) => (
          <PolicyCard key={p.name} name={p.name} score={p.score}
            totalControls={p.total_controls} passing={p.passing} failing={p.failing} />
        ))}
      </div>

      {/* Gaps table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--p-border)" }}>
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: "var(--p-bg-card)", borderBottom: "1px solid var(--p-border)" }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={13} className="text-amber-500" />
            <span className="text-sm font-semibold " style={{ color: "var(--p-text-1)" }}>Compliance Gaps</span>
            <span className="text-xs text-slate-600 font-mono">({gaps.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={12} className="text-slate-600" />
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs rounded px-2 py-1 outline-none font-mono"
              style={{ background: "var(--p-bg-border)", color: "var(--p-text-2)", border: "1px solid var(--p-border)" }}>
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select value={policyFilter} onChange={(e) => setPolicyFilter(e.target.value)}
              className="text-xs rounded px-2 py-1 outline-none font-mono"
              style={{ background: "var(--p-bg-border)", color: "var(--p-text-2)", border: "1px solid var(--p-border)" }}>
              <option value="all">All policies</option>
              <option value="PCI-DSS">PCI-DSS</option>
              <option value="SOC2">SOC2</option>
              <option value="HIPAA">HIPAA</option>
            </select>
          </div>
        </div>

        <div style={{ background: "var(--p-bg-main)" }}>
          {gaps.map((gap: {
            id: string; entity: string; entity_type: string; policy: string; control: string;
            description: string; severity: Severity; remediation: string; evidence: string; since: string;
          }) => {
            const sev = SEVERITY_COLORS[gap.severity] || SEVERITY_COLORS.low;
            return (
              <div key={gap.id} className="px-4 py-4 transition-colors cursor-default"
                style={{ borderBottom: "1px solid var(--p-border)" }}
                onMouseEnter={(e) => ((e).currentTarget.style.background = "var(--p-bg-elevated)")}
                onMouseLeave={(e) => ((e).currentTarget.style.background = "transparent")}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: sev.bg, color: sev.text, border: `1px solid ${sev.border}` }}>
                      {gap.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{gap.policy} · {gap.control}</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono flex-shrink-0">{gap.since}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-mono font-semibold " style={{ color: "var(--p-text-1)" }}>{gap.entity}</span>
                  <span className="text-[10px] text-slate-600">{gap.entity_type}</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{gap.description}</p>
                <div className="p-2.5 rounded-lg text-xs text-slate-500" style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)" }}>
                  <span className="font-semibold text-slate-400">Fix: </span>
                  {gap.remediation}
                </div>
                <div className="mt-1.5 text-[10px] text-slate-600 italic">{gap.evidence}</div>
              </div>
            );
          })}
          {!gaps.length && (
            <div className="px-4 py-10 text-center text-sm text-slate-600">
              No compliance gaps for the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
