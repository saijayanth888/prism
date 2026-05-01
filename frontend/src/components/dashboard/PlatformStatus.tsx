import { useQuery } from "@tanstack/react-query";
import apiClient from "../../api/client";

interface Platform {
  id: string;
  name: string;
  entityCount: number;
  status: "synced" | "syncing" | "error" | "unknown";
  lastSynced?: string;
}

function StatusDot({ status }: { status: Platform["status"] }) {
  const colors = {
    synced:  "var(--p-green)",
    syncing: "var(--p-amber)",
    error:   "var(--p-red)",
    unknown: "var(--p-text-3)",
  };
  return (
    <div
      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{ background: colors[status] }}
    />
  );
}

export default function PlatformStatus() {
  const { data } = useQuery({
    queryKey: ["connectors"],
    queryFn: () => apiClient.get("/api/v1/connectors").then((r) => r.data),
    staleTime: 30_000,
  });

  const platforms: Platform[] = data?.platforms || [];

  return (
    <div
      className="flex flex-col text-xs overflow-y-auto"
      style={{ borderLeft: "1px solid var(--p-border)", background: "var(--p-bg-deep)" }}
    >
      <div className="px-3 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid var(--p-border)" }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--p-text-3)" }}>
          Platforms
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {platforms.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between px-3 py-2 transition-colors"
            style={{ borderBottom: "1px solid var(--p-border-subtle)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--p-bg-elevated)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <StatusDot status={p.status} />
              <span className="truncate font-mono text-[10px]" style={{ color: "var(--p-text-2)" }}>{p.name}</span>
            </div>
            <span className="text-[10px] font-mono flex-shrink-0 ml-2" style={{ color: "var(--p-text-3)" }}>
              {p.entityCount}
            </span>
          </div>
        ))}
        {!platforms.length && (
          <div className="px-3 py-4 text-[10px] text-center" style={{ color: "var(--p-text-3)" }}>
            No platforms connected
          </div>
        )}
      </div>
      <div className="px-3 py-2 flex-shrink-0" style={{ borderTop: "1px solid var(--p-border)" }}>
        <div className="text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>
          {platforms.filter((p) => p.status === "synced").length}/{platforms.length} synced
        </div>
      </div>
    </div>
  );
}
