import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../../stores/chat";

interface Props {
  prompts: string[];
  context?: string;
}

export default function IrisQuickAsk({ prompts, context }: Props) {
  const navigate = useNavigate();
  const toggleChat = useChatStore((s) => s.toggleChat);
  const isOpen = useChatStore((s) => s.isOpen);
  const setPendingQuery = useChatStore((s) => s.setPendingQuery);

  const ask = (q: string) => {
    setPendingQuery(q);
    if (!isOpen) toggleChat();
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(34,211,238,0.06), rgba(34,211,238,0.02))",
        border: "1px solid var(--p-iris-border)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--p-iris-border)" }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={13} style={{ color: "var(--p-iris)" }} />
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--p-iris)", fontFamily: '"Geist", system-ui, sans-serif' }}
          >
            Ask Iris
          </span>
        </div>
        <button
          onClick={() => navigate("/iris")}
          className="text-[10px] font-mono uppercase tracking-wider"
          style={{ color: "var(--p-text-3)" }}
        >
          full chat →
        </button>
      </div>
      <div className="flex flex-col">
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => ask(p)}
            className="flex items-start gap-2.5 px-4 py-3 text-left transition-colors"
            style={{
              borderBottom: i < prompts.length - 1 ? "1px solid var(--p-border-subtle)" : "none",
              color: "var(--p-text-2)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(34,211,238,0.04)";
              el.style.color = "var(--p-text-1)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "transparent";
              el.style.color = "var(--p-text-2)";
            }}
          >
            <ArrowRight size={11} className="mt-1 flex-shrink-0" style={{ color: "var(--p-iris)" }} />
            <span className="text-[12px] leading-relaxed">{p}</span>
          </button>
        ))}
      </div>
      {context && (
        <div
          className="px-4 py-2 text-[10px] font-mono"
          style={{ color: "var(--p-text-3)", borderTop: "1px solid var(--p-border-subtle)" }}
        >
          context: {context}
        </div>
      )}
    </div>
  );
}
