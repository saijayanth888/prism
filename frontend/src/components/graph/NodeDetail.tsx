import { X, Zap, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGraphStore } from "../../stores/graph";
import { ENTITY_TYPE_COLORS } from "../../types";
import type { EntityType } from "../../types";

export default function NodeDetail() {
  const { selectedNode, clearSelection } = useGraphStore();
  const navigate = useNavigate();

  if (!selectedNode) return null;

  const typeColor = ENTITY_TYPE_COLORS[selectedNode.entityType as EntityType] || "var(--p-text-3)";
  const healthColor =
    selectedNode.healthScore == null ? "var(--p-text-3)"
    : selectedNode.healthScore >= 85 ? "var(--p-green)"
    : selectedNode.healthScore >= 70 ? "var(--p-amber)"
    : "var(--p-red)";

  return (
    <div
      className="w-56 flex-shrink-0 flex flex-col text-sm overflow-y-auto"
      style={{ borderLeft: "1px solid var(--p-border)", background: "var(--p-bg-card)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--p-border)" }}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: typeColor }} />
          <span className="text-xs font-medium truncate" style={{ color: "var(--p-text-1)" }}>{selectedNode.label}</span>
        </div>
        <button onClick={clearSelection} style={{ color: "var(--p-text-3)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-3)"; }}>
          <X size={13} />
        </button>
      </div>

      {/* Badges */}
      <div className="px-3 py-2 flex flex-wrap gap-1">
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: typeColor + "20", color: typeColor }}>
          {selectedNode.entityType}
        </span>
        {selectedNode.platform && (
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: "var(--p-bg-border)", color: "var(--p-text-3)", border: "1px solid var(--p-border)" }}>
            {selectedNode.platform}
          </span>
        )}
      </div>

      {/* Scores */}
      <div className="px-3 pb-2 grid grid-cols-2 gap-2">
        {selectedNode.healthScore != null && (
          <div className="rounded p-2" style={{ background: "var(--p-bg-main)" }}>
            <div className="text-[10px]" style={{ color: "var(--p-text-3)" }}>Health</div>
            <div className="text-sm font-mono font-semibold" style={{ color: healthColor }}>{selectedNode.healthScore}</div>
          </div>
        )}
        {selectedNode.environment && (
          <div className="rounded p-2" style={{ background: "var(--p-bg-main)" }}>
            <div className="text-[10px]" style={{ color: "var(--p-text-3)" }}>Env</div>
            <div className="text-xs font-mono" style={{ color: "var(--p-text-2)" }}>{selectedNode.environment}</div>
          </div>
        )}
      </div>

      {/* Properties */}
      {selectedNode.namespace && (
        <div className="px-3 pb-2">
          <div className="text-[10px] mb-1" style={{ color: "var(--p-text-3)" }}>Namespace</div>
          <div className="text-xs font-mono" style={{ color: "var(--p-text-2)" }}>{selectedNode.namespace}</div>
        </div>
      )}

      {/* Actions */}
      <div className="px-3 pt-2 flex flex-col gap-1.5 mt-auto pb-3" style={{ borderTop: "1px solid var(--p-border)" }}>
        <button
          onClick={() => navigate(`/app/${selectedNode.id}`)}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: "var(--p-iris)" }}
        >
          <Layers size={11} />
          Open in App Lens
        </button>
        <button
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: "var(--p-text-3)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-3)"; }}
        >
          <Zap size={11} />
          Blast Radius
        </button>
      </div>
    </div>
  );
}
