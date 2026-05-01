import { useGraphStore } from "../../stores/graph";

const DEFAULT_SUGGESTIONS = [
  "Which services have critical vulnerabilities?",
  "What would break if payments-api went down?",
  "Show me all PCI-DSS compliance gaps",
  "Which teams own the most services?",
  "What are the top 5 most connected services?",
];

const NODE_SUGGESTIONS: Record<string, string[]> = {
  Service: [
    "What depends on this service?",
    "Show this service's blast radius",
    "What compliance gaps does this service have?",
    "Which team owns this service?",
  ],
  API: [
    "What services does this API expose?",
    "Is this API rate-limited?",
    "Show the blast radius for this API",
  ],
  Database: [
    "Which services use this database?",
    "What compliance controls apply to this database?",
    "Show all entities that depend on this database",
  ],
  Vulnerability: [
    "Which services are affected by this vulnerability?",
    "What is the CVSS score?",
    "How do I remediate this?",
  ],
};

interface Props {
  onSelect: (query: string) => void;
}

export default function SuggestedQueries({ onSelect }: Props) {
  const selectedNode = useGraphStore((s) => s.selectedNode);

  const suggestions = selectedNode
    ? (NODE_SUGGESTIONS[selectedNode.entityType] || DEFAULT_SUGGESTIONS).map(
        (q) => q.replace("this service", selectedNode.label).replace("this API", selectedNode.label).replace("this database", selectedNode.label)
      )
    : DEFAULT_SUGGESTIONS;

  return (
    <div className="px-2 py-2 flex flex-col gap-1.5">
      <div className="text-[9px] uppercase tracking-[0.15em] font-semibold mb-1" style={{ color: "var(--p-text-3)" }}>
        {selectedNode ? `Suggestions for ${selectedNode.label}` : "Suggested queries"}
      </div>
      {suggestions.slice(0, 5).map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="text-left text-xs px-3 py-2 rounded-lg leading-tight transition-all"
          style={{ background: "var(--p-bg-card)", color: "var(--p-text-2)", border: "1px solid var(--p-border)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#94A3B8";
            (e.currentTarget as HTMLElement).style.borderColor = "#334155";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#64748B";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--p-border)";
          }}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
