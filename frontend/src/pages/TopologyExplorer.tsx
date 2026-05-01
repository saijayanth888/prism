import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
import MetricCard from "../components/dashboard/MetricCard";
import PlatformStatus from "../components/dashboard/PlatformStatus";
import NodeDetail from "../components/graph/NodeDetail";
import TopologyGraph from "../components/graph/TopologyGraph";
import { useGraphStore } from "../stores/graph";

export default function TopologyExplorer() {
  const selectedNode = useGraphStore((s) => s.selectedNode);

  const { data: metrics } = useQuery({
    queryKey: ["health-dashboard"],
    queryFn: () => apiClient.get("/api/v1/health/dashboard").then((r) => r.data),
    staleTime: 60_000,
  });

  const m = metrics || {};

  return (
    <div className="flex flex-col h-full">
      {/* Metric strip */}
      <div className="flex-shrink-0 px-4 py-3 grid grid-cols-6 gap-3" style={{ borderBottom: "1px solid var(--p-border)", background: "var(--p-bg-main)" }}>
        <MetricCard
          label="Entities"
          value={m.total_entities ?? "—"}
          trend={4}
          trendDirection="up"
        />
        <MetricCard
          label="Connections"
          value={m.total_edges ?? "—"}
          trend={2}
          trendDirection="up"
        />
        <MetricCard
          label="Avg Health"
          value={m.avg_health_score ? `${m.avg_health_score}` : "—"}
          unit="%"
          trend={1}
          trendDirection="up"
        />
        <MetricCard
          label="Critical"
          value={m.critical_entities ?? "—"}
          trendDirection={m.critical_entities > 0 ? "down" : "neutral"}
        />
        <MetricCard
          label="Platforms"
          value={m.platform_count ?? "—"}
        />
        <MetricCard
          label="Compliance"
          value={m.compliance_score ? `${m.compliance_score}` : "—"}
          unit="%"
          trendDirection={m.compliance_score >= 80 ? "up" : "down"}
        />
      </div>

      {/* Graph area */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          <TopologyGraph />
        </div>
        <div className="w-56 flex-shrink-0">
          {selectedNode ? <NodeDetail /> : <PlatformStatus />}
        </div>
      </div>
    </div>
  );
}
