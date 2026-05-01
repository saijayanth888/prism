import { Bell, ChevronLeft, Command, Moon, Search, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useThemeStore } from "../../stores/theme";

const ROUTE_META: Record<string, { section: string; page: string }> = {
  "/dashboard":      { section: "Overview",     page: "Dashboard" },
  "/topology":       { section: "Explore",      page: "Topology" },
  "/app":            { section: "Explore",      page: "App Lens" },
  "/health":         { section: "Explore",      page: "Health" },
  "/compliance":     { section: "Govern",       page: "Compliance" },
  "/vulnerabilities":{ section: "Govern",       page: "Vulnerabilities" },
  "/blast-radius":   { section: "Govern",       page: "Blast Radius" },
  "/connectors":     { section: "Intelligence", page: "Connectors" },
  "/documents":      { section: "Intelligence", page: "Documents" },
  "/reports":        { section: "Intelligence", page: "Reports" },
  "/iris":           { section: "Intelligence", page: "Iris" },
  "/changes":        { section: "System",       page: "Changes" },
  "/docs":           { section: "System",       page: "Docs" },
  "/settings":       { section: "System",       page: "Settings" },
};

export default function TopBar() {
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const meta =
    Object.entries(ROUTE_META).find(([path]) => location.pathname.startsWith(path))?.[1] ?? {
      section: "Prism",
      page: "Home",
    };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const canGoBack = location.pathname !== "/dashboard" && location.pathname !== "/";

  return (
    <header
      className="flex items-center gap-3 px-4 flex-shrink-0"
      style={{
        height: 52,
        background: "var(--p-bg-deep)",
        borderBottom: "1px solid var(--p-border)",
        fontFamily: '"Instrument Sans", system-ui, sans-serif',
      }}
    >
      {/* Back button */}
      <button
        onClick={() => canGoBack && navigate(-1)}
        disabled={!canGoBack}
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
        style={{
          color: canGoBack ? "var(--p-text-2)" : "var(--p-text-3)",
          opacity: canGoBack ? 1 : 0.4,
          cursor: canGoBack ? "pointer" : "default",
        }}
        onMouseEnter={(e) => {
          if (canGoBack) {
            (e.currentTarget as HTMLElement).style.color = "var(--p-text-1)";
            (e.currentTarget as HTMLElement).style.background = "var(--p-bg-card)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = canGoBack ? "var(--p-text-2)" : "var(--p-text-3)";
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <ChevronLeft size={14} />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-[12px] font-mono transition-colors"
          style={{ color: "var(--p-text-3)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--p-text-1)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--p-text-3)")}
        >
          {meta.section}
        </button>
        <span className="text-[12px] font-mono" style={{ color: "var(--p-text-3)" }}>
          /
        </span>
        <span className="text-[12px] font-mono font-semibold" style={{ color: "var(--p-text-1)" }}>
          {meta.page}
        </span>
      </div>

      <div className="flex-1" />

      {/* Search bar — centered */}
      <div
        className="flex items-center gap-2 rounded-md px-3 h-8 transition-all flex-shrink-0"
        style={{
          width: 360,
          background: searchFocused ? "var(--p-bg-elevated)" : "var(--p-bg-card)",
          boxShadow: searchFocused
            ? "0 0 0 1px var(--p-accent-border), 0 0 18px var(--p-accent-glow)"
            : "var(--p-surface)",
        }}
      >
        <Search size={12} className="flex-shrink-0" style={{ color: "var(--p-text-3)" }} />
        <input
          type="text"
          placeholder="Search topology, services, docs…"
          className="flex-1 bg-transparent text-[12px] outline-none font-mono"
          style={{ color: "var(--p-text-1)" }}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <kbd
            className="flex items-center justify-center h-4 w-4 rounded"
            style={{
              background: "var(--p-bg-deep)",
              border: "1px solid var(--p-border)",
              color: "var(--p-text-3)",
              fontSize: 9,
            }}
          >
            <Command size={8} />
          </kbd>
          <kbd
            className="flex items-center justify-center h-4 w-4 rounded font-mono"
            style={{
              background: "var(--p-bg-deep)",
              border: "1px solid var(--p-border)",
              color: "var(--p-text-3)",
              fontSize: 9,
            }}
          >
            K
          </kbd>
        </div>
      </div>

      <div className="flex-1" />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
        style={{ color: "var(--p-text-2)" }}
        title={isDark ? "Switch to light" : "Switch to dark"}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--p-text-1)";
          (e.currentTarget as HTMLElement).style.background = "var(--p-bg-card)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--p-text-2)";
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
      </button>

      {/* Notifications */}
      <button
        className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 transition-all relative"
        style={{ color: "var(--p-text-2)" }}
        title="Notifications"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--p-text-1)";
          (e.currentTarget as HTMLElement).style.background = "var(--p-bg-card)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--p-text-2)";
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <Bell size={13} />
        <span
          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--p-red)", boxShadow: "0 0 0 1.5px var(--p-bg-deep)" }}
        />
      </button>

      {/* Avatar */}
      <div className="relative flex-shrink-0" ref={avatarRef}>
        <button
          onClick={() => setAvatarOpen((v) => !v)}
          className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-semibold transition-all"
          style={{
            background: "linear-gradient(135deg, #5E6AD2, #22D3EE)",
            color: "#0A0A14",
            fontSize: 11,
          }}
          title="Account"
        >
          JD
        </button>
        {avatarOpen && (
          <div
            className="absolute right-0 top-10 rounded-lg overflow-hidden z-50"
            style={{
              minWidth: 240,
              background: "var(--p-bg-card)",
              border: "1px solid var(--p-border-strong)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            }}
          >
            <div className="px-3 py-3 flex items-center gap-2.5" style={{ borderBottom: "1px solid var(--p-border-subtle)" }}>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-mono font-semibold"
                style={{ background: "linear-gradient(135deg, #5E6AD2, #22D3EE)", color: "#0A0A14", fontSize: 12 }}
              >
                JD
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold" style={{ color: "var(--p-text-1)" }}>Jordan Dane</div>
                <div className="text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>jordan@acme.com · admin</div>
              </div>
            </div>

            <div className="px-3 py-2">
              <div className="text-[9px] font-mono uppercase tracking-[0.14em] mb-2" style={{ color: "var(--p-text-3)" }}>APPEARANCE</div>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-md" style={{ background: "var(--p-bg-elevated)" }}>
                {(["Light", "Dark", "Auto"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { if ((m === "Dark") !== isDark) toggleTheme(); }}
                    className="text-[11px] font-medium py-1 rounded transition-colors"
                    style={{
                      background:
                        (m === "Dark" && isDark) || (m === "Light" && !isDark)
                          ? "var(--p-bg-card)"
                          : "transparent",
                      color:
                        (m === "Dark" && isDark) || (m === "Light" && !isDark)
                          ? "var(--p-text-1)"
                          : "var(--p-text-3)",
                      boxShadow:
                        (m === "Dark" && isDark) || (m === "Light" && !isDark)
                          ? "var(--p-surface)"
                          : "none",
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-3 py-2" style={{ borderTop: "1px solid var(--p-border-subtle)" }}>
              <div className="text-[9px] font-mono uppercase tracking-[0.14em] mb-1" style={{ color: "var(--p-text-3)" }}>ACCOUNT</div>
              {[
                { label: "Profile",  href: "/settings" },
                { label: "API keys", href: "/settings" },
                { label: "Sign out", href: "/" },
              ].map((it) => (
                <button
                  key={it.label}
                  onClick={() => { setAvatarOpen(false); navigate(it.href); }}
                  className="w-full text-left text-[12px] py-1.5 px-2 rounded transition-colors"
                  style={{ color: "var(--p-text-2)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--p-text-1)";
                    (e.currentTarget as HTMLElement).style.background = "var(--p-bg-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--p-text-2)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {it.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
