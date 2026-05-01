import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import type { ChatMessage as ChatMessageType } from "../../types";

const ui   = '"DM Sans", "Helvetica Neue", sans-serif';
const disp = '"Outfit", "Helvetica Neue", sans-serif';
const mono = '"Geist Mono", "JetBrains Mono", monospace';

function EntityTag({ name }: { name: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/app/${name}`)}
      className="inline-flex items-center mx-0.5 px-2 py-0.5 font-medium transition-all"
      style={{
        color: "#1456f0",
        background: "rgba(20,86,240,0.08)",
        border: "1px solid rgba(20,86,240,0.2)",
        borderRadius: 6,
        fontSize: 11,
        fontFamily: mono,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(20,86,240,0.14)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(20,86,240,0.08)"; }}
    >
      {name}
    </button>
  );
}

function parseCitations(text: string) {
  const parts: Array<{ type: "text" | "entity"; value: string }> = [];
  const regex = /\[entity:([^\]]+)\]/g;
  let last = 0, match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: "text", value: text.slice(last, match.index) });
    parts.push({ type: "entity", value: match[1] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

interface Props {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: Props) {
  const isUser   = message.role === "user";
  const isSystem = message.role === "system";
  const ts = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isSystem) {
    return (
      <div className="flex items-center gap-3 px-8 py-2">
        <span className="flex-1 border-t" style={{ borderColor: "var(--p-border)" }} />
        <span style={{ fontSize: 11, color: "var(--p-text-3)", fontFamily: ui, flexShrink: 0 }}>
          {message.text}
        </span>
        <span className="flex-1 border-t" style={{ borderColor: "var(--p-border)" }} />
      </div>
    );
  }

  const parts = parseCitations(message.text);

  if (isUser) {
    return (
      <div className="flex justify-end px-8 py-3 gap-2">
        <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <div
            style={{
              background: "var(--p-text-1)",
              color: "var(--p-bg)",
              borderRadius: "16px 16px 4px 16px",
              padding: "10px 16px",
              fontSize: 14,
              lineHeight: 1.55,
              fontFamily: ui,
            }}
          >
            {parts.map((p, i) => <span key={i}>{p.value}</span>)}
          </div>
          <span style={{ fontSize: 10, color: "var(--p-text-3)", fontFamily: ui }}>{ts}</span>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex items-start gap-3 px-8 py-4">
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #1456f0 0%, #3daeff 100%)", marginTop: 2 }}
      >
        <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: disp }}>I</span>
      </div>

      {/* Bubble */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            background: "var(--p-bg-card)",
            border: "1px solid var(--p-border)",
            borderLeft: "3px solid #1456f0",
            borderRadius: "4px 16px 16px 16px",
            padding: "12px 16px",
            boxShadow: "rgba(0,0,0,0.05) 0px 4px 12px",
          }}
        >
          <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--p-text-1)", fontFamily: ui }}>
            {parts.map((part, i) =>
              part.type === "entity" ? (
                <EntityTag key={i} name={part.value} />
              ) : (
                <span key={i}>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <span style={{ display: "block", marginBottom: "0.4em" }}>{children}</span>,
                      strong: ({ children }) => <strong style={{ color: "var(--p-text-1)", fontWeight: 600 }}>{children}</strong>,
                      em: ({ children }) => <em style={{ color: "var(--p-text-2)" }}>{children}</em>,
                      code: ({ children }) => (
                        <code style={{
                          color: "#1456f0",
                          background: "rgba(20,86,240,0.08)",
                          padding: "1px 5px",
                          borderRadius: 4,
                          fontFamily: mono,
                          fontSize: "12px",
                        }}>
                          {children}
                        </code>
                      ),
                      ul: ({ children }) => <ul style={{ paddingLeft: "1.2em", margin: "0.3em 0", listStyleType: "disc" }}>{children}</ul>,
                      li: ({ children }) => <li style={{ marginBottom: "0.2em" }}>{children}</li>,
                    }}
                  >
                    {part.value}
                  </ReactMarkdown>
                </span>
              )
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-1.5 px-1">
          <span style={{ fontSize: 10, color: "var(--p-text-3)", fontFamily: ui }}>{ts}</span>
          {message.toolsUsed && message.toolsUsed.length > 0 && (
            <span style={{ fontSize: 10, color: "var(--p-text-3)", fontFamily: mono }}>
              {message.toolsUsed.join(" · ")}
            </span>
          )}
          {message.confidence !== undefined && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: 10,
                fontFamily: mono,
                color: message.confidence >= 0.85 ? "#059669" : "#f59e0b",
                fontWeight: 500,
              }}
            >
              {Math.round(message.confidence * 100)}% conf
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
