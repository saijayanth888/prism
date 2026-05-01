import { Command, MessageSquare, Moon, Search, Sun } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useChatStore } from "../../stores/chat";
import { useThemeStore } from "../../stores/theme";

const ROUTE_LABELS: Record<string, string> = {
  "/topology":       "Topology Explorer",
  "/app":            "Application Lens",
  "/compliance":     "Compliance Center",
  "/vulnerabilities":"Vulnerability Intel",
  "/blast-radius":   "Blast Radius",
  "/health":         "Health Dashboard",
  "/iris":           "Iris AI",
  "/connectors":     "Connectors",
  "/reports":        "Reports",
  "/changes":        "Change Impact",
  "/docs":           "Documentation",
  "/settings":       "Settings",
};

export default function TopBar() {
  const { isOpen, toggleChat } = useChatStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const location = useLocation();
  const [searchFocused, setSearchFocused] = useState(false);

  const routeLabel =
    Object.entries(ROUTE_LABELS).find(([path]) => location.pathname.startsWith(path))?.[1] ?? "Prism";

  return (
    <header
      className="flex items-center gap-3 px-4 flex-shrink-0"
      style={{
        height: 52,
        background: "var(--p-bg-deep)",
        borderBottom: "1px solid var(--p-border)",
        fontFamily: '"Geist", system-ui, sans-serif',
        transition: "background 0.25s ease",
      }}
    >
      {/* Route label */}
      <span
        className="text-xs font-medium flex-shrink-0"
        style={{ color: "var(--p-text-2)" }}
      >
        {routeLabel}
      </span>
      <div className="w-px h-4 flex-shrink-0" style={{ background: "var(--p-border-strong)" }} />

      {/* Search */}
      <div
        className="flex items-center gap-2 flex-1 max-w-sm rounded-lg px-3 h-8 transition-all"
        style={{
          background: searchFocused ? "var(--p-bg-elevated)" : "var(--p-bg-card)",
          boxShadow: searchFocused ? "var(--p-surface-elevated)" : "var(--p-surface)",
        }}
      >
        <Search size={12} className="flex-shrink-0" style={{ color: "var(--p-text-3)" }} />
        <input
          type="text"
          placeholder="Search entities, services, APIs…"
          className="flex-1 bg-transparent text-xs outline-none font-mono"
          style={{ color: "var(--p-text-1)" }}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <kbd
            className="flex items-center justify-center h-4 w-4 rounded text-[9px]"
            style={{
              background: "var(--p-bg-deep)",
              border: "1px solid var(--p-border-strong)",
              color: "var(--p-text-3)",
            }}
          >
            <Command size={8} />
          </kbd>
          <kbd
            className="flex items-center justify-center h-4 w-4 rounded text-[9px] font-mono"
            style={{
              background: "var(--p-bg-deep)",
              border: "1px solid var(--p-border-strong)",
              color: "var(--p-text-3)",
            }}
          >
            K
          </kbd>
        </div>
      </div>

      <div className="flex-1" />

      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--p-green)", animation: "pulse 2s infinite" }}
        />
        <span className="text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>
          live
        </span>
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
        style={{
          background: "var(--p-bg-card)",
          boxShadow: "var(--p-surface)",
          color: "var(--p-text-3)",
        }}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--p-text-1)";
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--p-surface-elevated)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--p-text-3)";
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--p-surface)";
        }}
      >
        {isDark ? <Sun size={12} /> : <Moon size={12} />}
      </button>

      {/* Iris button */}
      <button
        onClick={toggleChat}
        className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-medium transition-all"
        style={{
          background: isOpen ? "var(--p-iris-subtle)" : "var(--p-bg-card)",
          color: isOpen ? "var(--p-iris)" : "var(--p-text-2)",
          boxShadow: isOpen
            ? "0 0 0 1px var(--p-iris-border), 0 0 16px var(--p-iris-glow)"
            : "var(--p-surface)",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          if (!isOpen) {
            el.style.color = "var(--p-text-1)";
            el.style.boxShadow = "var(--p-surface-elevated)";
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          if (!isOpen) {
            el.style.color = "var(--p-text-2)";
            el.style.boxShadow = "var(--p-surface)";
          }
        }}
      >
        <MessageSquare size={12} />
        <span>Iris</span>
        {isOpen && (
          <div
            className="w-1.5 h-1.5 rounded-full ml-0.5"
            style={{ background: "var(--p-green)" }}
          />
        )}
      </button>
    </header>
  );
}
