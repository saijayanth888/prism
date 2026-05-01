import { ChevronDown, Maximize2, Minimize2, Minus, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../../stores/chat";
import { useThemeStore } from "../../stores/theme";
import { useIris } from "../../hooks/useIris";
import type { Persona } from "../../types";

// ── Theme-aware palette — adapts to dark/light app theme ────────────────────
const PALETTE_DARK = {
  bg:           "#050508",
  surface:      "#0C0C15",
  surfaceHover: "#111120",
  border:       "rgba(255,255,255,0.06)",
  borderStrong: "rgba(255,255,255,0.12)",
  accent:       "#7C6AFC",
  accentDim:    "rgba(124,106,252,0.12)",
  accentBorder: "rgba(124,106,252,0.22)",
  text1:        "#E4E4F0",
  text2:        "#6868A0",
  text3:        "#30304A",
  green:        "#00D97E",
  greenDim:     "rgba(0,217,126,0.10)",
  amber:        "#F5A623",
  red:          "#F06060",
};

const PALETTE_LIGHT = {
  bg:           "#FFFFFF",
  surface:      "#F8F8FC",
  surfaceHover: "#EAEAF4",
  border:       "rgba(12,12,24,0.08)",
  borderStrong: "rgba(12,12,24,0.18)",
  accent:       "#5E6AD2",
  accentDim:    "rgba(94,106,210,0.10)",
  accentBorder: "rgba(94,106,210,0.30)",
  text1:        "#0C0C18",
  text2:        "#3E3E6A",
  text3:        "#8888A8",
  green:        "#10B981",
  greenDim:     "rgba(16,185,129,0.10)",
  amber:        "#D97706",
  red:          "#EF4444",
};

function paletteFor(isDark: boolean) {
  return isDark ? PALETTE_DARK : PALETTE_LIGHT;
}

const MODEL_OPTIONS = [
  { name: "Iris-default",       subtitle: "routed" },
  { name: "Claude Sonnet 4.5",  subtitle: "200k"   },
  { name: "GPT-4o",             subtitle: "128k"   },
  { name: "Gemini 1.5 Pro",     subtitle: "1M"     },
];

function ModelPicker() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Iris-default");
  const ref = useRef<HTMLDivElement>(null);
  const isDark = useThemeStore((s) => s.isDark); const C = paletteFor(isDark);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref} onMouseDown={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono transition-colors"
        style={{
          background: "rgba(255,255,255,0.04)",
          color: C.text1,
          border: `1px solid ${C.border}`,
        }}
      >
        <span className="w-1 h-1 rounded-full" style={{ background: C.accent }} />
        {selected}
        <ChevronDown size={9} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-7 rounded overflow-hidden z-50"
          style={{
            minWidth: 180,
            background: C.surface,
            border: `1px solid ${C.borderStrong}`,
            boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
          }}
        >
          <div className="px-3 py-2 text-[8px] font-mono uppercase" style={{ color: C.text3, letterSpacing: "0.14em", borderBottom: `1px solid ${C.border}` }}>
            MODEL BACKEND
          </div>
          {MODEL_OPTIONS.map((m) => (
            <button
              key={m.name}
              onClick={() => { setSelected(m.name); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-mono transition-colors"
              style={{
                background: selected === m.name ? C.accentDim : "transparent",
                color: selected === m.name ? C.accent : C.text1,
              }}
              onMouseEnter={(e) => { if (selected !== m.name) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
              onMouseLeave={(e) => { if (selected !== m.name) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span>{m.name}</span>
              <span className="text-[9px]" style={{ color: C.text2 }}>{m.subtitle}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const PERSONAS: { value: Persona; label: string }[] = [
  { value: "developer",     label: "DEV"  },
  { value: "sre",           label: "SRE"  },
  { value: "product_owner", label: "PM"   },
  { value: "auditor",       label: "AUD"  },
  { value: "executive",     label: "EXEC" },
];

const DEMO_PROMPTS = [
  "What breaks if payments-api fails?",
  "Show me critical CVEs",
  "Which services have compliance gaps?",
  "Blast radius of inventory-svc?",
];

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function EntityTag({ name }: { name: string }) {
  const navigate = useNavigate();
  const isDark = useThemeStore((s) => s.isDark); const C = paletteFor(isDark);
  return (
    <button
      onClick={() => navigate(`/app/${name}`)}
      className="inline-flex items-center mx-0.5 px-1.5 py-px font-mono text-[10px] transition-all"
      style={{
        color: C.accent,
        background: C.accentDim,
        border: `1px solid ${C.accentBorder}`,
        borderRadius: 2,
        fontFamily: '"Geist Mono", "JetBrains Mono", monospace',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(124,106,252,0.22)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = C.accentDim; }}
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

function TerminalMessage({ message }: { message: { id: string; role: string; text: string; timestamp: number; toolsUsed?: string[]; confidence?: number } }) {
  const isUser = message.role === "user";
  const parts = parseCitations(message.text);
  const isDark = useThemeStore((s) => s.isDark); const C = paletteFor(isDark);
  return (
    <div
      className="px-3 py-2.5 group"
      style={{
        borderBottom: `1px solid ${C.border}`,
        fontFamily: '"Geist Mono", "JetBrains Mono", monospace',
      }}
    >
      {/* Row header */}
      <div className="flex items-center gap-2 mb-1">
        <span
          className="text-[9px] font-mono select-none"
          style={{ color: isUser ? C.text3 : C.accentBorder, letterSpacing: "0.06em" }}
        >
          {fmt(message.timestamp)}
        </span>
        <span
          className="text-[9px] font-mono font-bold select-none"
          style={{ color: isUser ? C.text2 : C.accent }}
        >
          {isUser ? "YOU" : "IRIS"}
        </span>
        {!isUser && message.toolsUsed && message.toolsUsed.length > 0 && (
          <span className="text-[8px] font-mono" style={{ color: C.text3 }}>
            {"// " + message.toolsUsed.join(" · ")}
          </span>
        )}
        {!isUser && message.confidence !== undefined && (
          <span
            className="ml-auto text-[8px] font-mono"
            style={{ color: message.confidence >= 0.85 ? C.green : C.amber }}
          >
            {Math.round(message.confidence * 100)}%
          </span>
        )}
      </div>
      {/* Content */}
      <div
        className="text-[11px] leading-relaxed pl-px"
        style={{ color: isUser ? C.text2 : C.text1 }}
      >
        {parts.map((part, i) =>
          part.type === "entity" ? (
            <EntityTag key={i} name={part.value} />
          ) : (
            <span key={i}>{part.value}</span>
          )
        )}
      </div>
    </div>
  );
}

export default function IrisPanel() {
  const [input, setInput] = useState("");
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth - 420, y: window.innerHeight - 540 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = useThemeStore((s) => s.isDark); const C = paletteFor(isDark);
  const [focused, setFocused] = useState(false);

  const { toggleChat, isStreaming, persona, setPersona, clearMessages, pendingQuery, setPendingQuery } = useChatStore();
  const { sendMessage, connected, messages } = useIris();

  useEffect(() => {
    if (pendingQuery) {
      setInput(pendingQuery);
      setPendingQuery(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [pendingQuery, setPendingQuery]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.dragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 400, dragRef.current.origX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 120, dragRef.current.origY + dy)),
      });
    };
    const onUp = () => { dragRef.current.dragging = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    e.preventDefault();
  };

  const handleSend = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isStreaming) return;
    setInput("");
    sendMessage(msg);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div
      className="flex flex-col fixed z-50 select-none"
      style={{
        width: expanded ? 640 : 400,
        height: minimized ? 48 : expanded ? 620 : 520,
        left: pos.x,
        top: pos.y,
        background: C.bg,
        border: `1px solid ${C.borderStrong}`,
        borderRadius: 6,
        boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(124,106,252,0.08)",
        fontFamily: '"Geist Mono", "JetBrains Mono", monospace',
        overflow: "hidden",
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 inset-x-0"
        style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.accent} 40%, ${C.accent} 60%, transparent)` }}
      />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        onMouseDown={startDrag}
        className="flex items-center justify-between flex-shrink-0"
        style={{
          padding: "10px 14px 10px 16px",
          borderBottom: `1px solid ${C.border}`,
          cursor: "grab",
          userSelect: "none",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: '"Syne", sans-serif',
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.18em",
                color: C.text1,
                textTransform: "uppercase",
              }}
            >
              IRIS
            </span>
            <div
              className="flex items-center gap-1.5 px-2 py-0.5"
              style={{
                background: connected ? C.greenDim : "rgba(255,255,255,0.04)",
                border: `1px solid ${connected ? "rgba(0,217,126,0.2)" : C.border}`,
                borderRadius: 2,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  background: connected ? C.green : C.text3,
                  boxShadow: connected ? `0 0 6px ${C.green}` : "none",
                }}
              />
              <span className="text-[9px] font-mono" style={{ color: connected ? C.green : C.text2, letterSpacing: "0.05em" }}>
                {connected ? "LIVE" : "DEMO"}
              </span>
            </div>
          </div>
          <ModelPicker />
        </div>

        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={clearMessages}
            className="text-[9px] font-mono px-2 py-1 transition-all"
            style={{
              color: C.text2,
              border: `1px solid ${C.border}`,
              borderRadius: 2,
              background: "transparent",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.text1; (e.currentTarget as HTMLElement).style.borderColor = C.borderStrong; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.text2; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
          >
            CLR
          </button>
          <button
            onClick={() => setMinimized((v) => !v)}
            title={minimized ? "Restore" : "Minimize"}
            className="w-6 h-6 flex items-center justify-center transition-all"
            style={{ color: C.text3, borderRadius: 2 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.text1; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.text3; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Minus size={12} />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Collapse" : "Expand"}
            className="w-6 h-6 flex items-center justify-center transition-all"
            style={{ color: C.text3, borderRadius: 2 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.text1; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.text3; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            {expanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          </button>
          <button
            onClick={toggleChat}
            title="Close"
            className="w-6 h-6 flex items-center justify-center transition-all"
            style={{ color: C.text3, borderRadius: 2 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.red; (e.currentTarget as HTMLElement).style.background = "rgba(240,96,96,0.10)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.text3; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {!minimized && (
      <>
      {/* ── Persona strip ───────────────────────────────────────────── */}
      <div
        className="flex items-center flex-shrink-0"
        style={{ borderBottom: `1px solid ${C.border}`, padding: "0 2px" }}
      >
        {PERSONAS.map((p) => {
          const active = persona === p.value;
          return (
            <button
              key={p.value}
              onClick={() => setPersona(p.value)}
              className="flex-1 py-2 text-[9px] font-mono transition-all relative"
              style={{
                color: active ? C.accent : C.text2,
                letterSpacing: "0.08em",
                background: active ? C.accentDim : "transparent",
                borderBottom: `2px solid ${active ? C.accent : "transparent"}`,
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = C.text1; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = C.text2; }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* ── Messages ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: `${C.border} transparent` }}>
        {messages.length === 0 ? (
          <div style={{ padding: "20px 0" }}>
            {/* Empty state */}
            <div className="px-5 pb-4" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="text-[10px] font-mono mb-3" style={{ color: C.text3, letterSpacing: "0.12em" }}>
                SUGGESTED QUERIES
              </div>
              {DEMO_PROMPTS.map((q, i) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="w-full text-left flex items-start gap-2.5 py-2 transition-all group"
                  style={{ borderBottom: i < DEMO_PROMPTS.length - 1 ? `1px solid ${C.border}` : "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span className="text-[9px] font-mono flex-shrink-0 mt-0.5" style={{ color: C.text2 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] font-mono leading-snug" style={{ color: C.text2 }}>{q}</span>
                </button>
              ))}
            </div>
            <div className="px-5 pt-4">
              <div className="text-[9px] font-mono mb-2" style={{ color: C.text3, letterSpacing: "0.12em" }}>
                CAPABILITIES
              </div>
              {[
                "Blast radius · dependency traversal",
                "CVE tracking · compliance gaps",
                "Health scores · trend analysis",
                "Cross-platform entity resolution",
              ].map((line) => (
                <div key={line} className="flex items-center gap-2 py-1">
                  <span style={{ color: C.accentBorder, fontSize: 8 }}>◆</span>
                  <span className="text-[10px] font-mono" style={{ color: C.text2 }}>{line}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <TerminalMessage key={msg.id} message={msg} />)
        )}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="px-3 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.border}` }}>
            <span className="text-[9px] font-mono" style={{ color: C.accentBorder }}>IRIS</span>
            <span
              className="text-[11px] font-mono"
              style={{
                color: C.accent,
                animation: "iris-blink 0.9s step-end infinite",
              }}
            >
              █
            </span>
            <span className="text-[9px] font-mono" style={{ color: C.text3 }}>querying graph…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0"
        style={{ borderTop: `1px solid ${focused ? C.accentBorder : C.border}`, transition: "border-color 0.15s" }}
      >
        <div className="flex items-center gap-2 px-4 py-3">
          <span className="text-[11px] font-mono flex-shrink-0" style={{ color: C.text2 }}>{">"}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="query your infrastructure…"
            disabled={isStreaming}
            className="flex-1 bg-transparent outline-none text-[11px] font-mono disabled:opacity-40"
            style={{
              color: C.text1,
              caretColor: C.accent,
              fontFamily: '"Geist Mono", "JetBrains Mono", monospace',
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center transition-all disabled:opacity-20"
            style={{
              color: input.trim() && !isStreaming ? C.accent : C.text3,
              background: input.trim() && !isStreaming ? C.accentDim : "transparent",
              border: `1px solid ${input.trim() && !isStreaming ? C.accentBorder : C.border}`,
              borderRadius: 3,
            }}
          >
            <Send size={10} />
          </button>
        </div>
        <div
          className="flex items-center justify-between px-4 pb-2.5"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <span className="text-[8px] font-mono" style={{ color: C.text3, letterSpacing: "0.08em" }}>
            {"// GROUNDED IN GRAPH"}
          </span>
          <span className="text-[8px] font-mono" style={{ color: C.text3, letterSpacing: "0.08em" }}>
            7 SAFEGUARDS
          </span>
        </div>
      </div>

      </>
      )}

      {/* Blink keyframe */}
      <style>{`
        @keyframes iris-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
