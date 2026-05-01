import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ENTITY_TYPE_COLORS } from "../../types";
import type { EntityType } from "../../types";

interface DepNode {
  id: string;
  name: string;
  entityType: string;
  healthScore?: number;
  depth?: number;
  impact?: string;
}

interface Props {
  title: string;
  nodes: DepNode[];
  direction: "upstream" | "downstream";
}

function HealthDot({ score }: { score?: number }) {
  if (score == null) return null;
  const color = score >= 85 ? "#22C55E" : score >= 70 ? "#F59E0B" : "#EF4444";
  return <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />;
}

export default function DependencyChain({ title, nodes, direction }: Props) {
  const navigate = useNavigate();

  if (!nodes.length) {
    return (
      <div>
        <div className="text-xs font-semibold text-slate-600 mb-2">{title}</div>
        <div className="text-xs text-slate-400 italic">None found</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <ChevronRight size={12} className={`text-slate-400 ${direction === "upstream" ? "rotate-180" : ""}`} />
        <span className="text-xs font-semibold text-slate-600">{title}</span>
        <span className="text-[10px] text-slate-400 ml-auto">{nodes.length}</span>
      </div>
      <div className="flex flex-col gap-1">
        {nodes.map((node) => {
          const color = ENTITY_TYPE_COLORS[node.entityType as EntityType] || "#64748B";
          return (
            <button
              key={node.id}
              onClick={() => navigate(`/app/${node.id}`)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left w-full group"
              style={{ border: "1px solid #F1F5F9" }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-xs font-mono text-slate-700 flex-1 truncate group-hover:text-cyan-600 transition-colors">
                {node.name}
              </span>
              <span className="text-[10px] text-slate-400 flex-shrink-0">{node.entityType}</span>
              <HealthDot score={node.healthScore} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
