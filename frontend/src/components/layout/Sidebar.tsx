import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  GitMerge,
  LayoutGrid,
  Layers,
  Network,
  PlugZap,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../api/client";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
    ],
  },
  {
    label: "Explore",
    items: [
      { to: "/topology", icon: Network,       label: "Topology" },
      { to: "/app",      icon: Layers,         label: "App Lens" },
      { to: "/health",   icon: Activity,       label: "Health" },
    ],
  },
  {
    label: "Govern",
    items: [
      { to: "/compliance",     icon: Shield,        label: "Compliance" },
      { to: "/vulnerabilities", icon: AlertTriangle, label: "Vulnerabilities" },
      { to: "/blast-radius",   icon: Zap,           label: "Blast Radius" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/connectors", icon: PlugZap,    label: "Connectors" },
      { to: "/documents",  icon: FileSearch, label: "Documents" },
      { to: "/reports",    icon: BarChart3,  label: "Reports" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/changes",  icon: GitMerge, label: "Changes" },
      { to: "/docs",     icon: BookOpen, label: "Docs" },
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

const TENANTS = ["demo", "acme-corp", "staging"];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [tenant, setTenant] = useState("demo");
  const [tenantOpen, setTenantOpen] = useState(false);

  const { data: metrics } = useQuery({
    queryKey: ["health-dashboard"],
    queryFn: () => apiClient.get("/api/v1/health/dashboard").then((r) => r.data),
    staleTime: 60_000,
  });

  return (
    <aside
      className="flex flex-col flex-shrink-0 relative"
      style={{
        width: collapsed ? 52 : 216,
        background: "var(--p-bg-deep)",
        borderRight: "1px solid var(--p-border)",
        transition: "width 0.2s cubic-bezier(0.4,0,0.2,1)",
        fontFamily: '"Geist", system-ui, sans-serif',
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center flex-shrink-0"
        style={{
          height: 52,
          padding: collapsed ? "0 10px" : "0 14px",
          borderBottom: "1px solid var(--p-border)",
        }}
      >
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #5E6AD2, #7170FF)",
                  boxShadow: "0 0 14px rgba(94,106,210,0.35)",
                }}
              >
                <Network size={13} style={{ color: "#fff" }} />
              </div>
              <div>
                <div
                  className="text-[14px] font-bold leading-none tracking-tight"
                  style={{ fontFamily: '"Instrument Sans", system-ui, sans-serif', color: "var(--p-text-1)", letterSpacing: "-0.02em" }}
                >
                  prism
                </div>
                <div
                  className="text-[9px] leading-none mt-1 font-mono uppercase"
                  style={{ color: "var(--p-text-3)", letterSpacing: "0.12em" }}
                >
                  CPT ENGINE
                </div>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded-md transition-colors flex-shrink-0"
              style={{ color: "var(--p-text-3)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-2)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-3)"; }}
            >
              <ChevronLeft size={13} />
            </button>
          </>
        ) : (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #5E6AD2, #7170FF)",
              boxShadow: "0 0 10px rgba(94,106,210,0.3)",
            }}
            onClick={() => setCollapsed(false)}
          >
            <Network size={13} style={{ color: "#fff" }} />
          </div>
        )}
      </div>

      {/* Expand chevron (collapsed) */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="absolute -right-3 top-[18px] w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all"
          style={{
            background: "var(--p-bg-elevated)",
            border: "1px solid var(--p-border-strong)",
            color: "var(--p-text-3)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--p-accent)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--p-accent-border)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--p-text-3)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--p-border-strong)";
          }}
        >
          <ChevronRight size={11} />
        </button>
      )}

      {/* ── Tenant selector ── */}
      {!collapsed && (
        <div className="px-2.5 py-2 flex-shrink-0 relative" style={{ borderBottom: "1px solid var(--p-border)" }}>
          <button
            onClick={() => setTenantOpen(!tenantOpen)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: "var(--p-bg-card)",
              border: "1px solid var(--p-border)",
              color: "var(--p-text-2)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-border-strong)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-border)"; }}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--p-green)" }} />
              <span className="font-mono text-[11px]" style={{ color: "var(--p-text-1)" }}>
                {tenant}
              </span>
            </div>
            <ChevronDown
              size={11}
              className={`transition-transform ${tenantOpen ? "rotate-180" : ""}`}
              style={{ color: "var(--p-text-3)" }}
            />
          </button>

          {tenantOpen && (
            <div
              className="absolute left-2.5 right-2.5 top-full mt-1 z-50 rounded-xl overflow-hidden"
              style={{
                background: "var(--p-bg-elevated)",
                boxShadow: "var(--p-surface-float)",
              }}
            >
              {TENANTS.map((t) => (
                <button
                  key={t}
                  onClick={() => { setTenant(t); setTenantOpen(false); }}
                  className="w-full text-left px-3 py-2 text-[11px] font-mono transition-colors"
                  style={{
                    color: t === tenant ? "var(--p-accent)" : "var(--p-text-2)",
                    background: t === tenant ? "var(--p-accent-subtle)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (t !== tenant) (e.currentTarget as HTMLElement).style.background = "var(--p-bg-card)";
                  }}
                  onMouseLeave={(e) => {
                    if (t !== tenant) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-1.5" style={{ scrollbarWidth: "none" }}>
        {NAV_SECTIONS.map(({ label, items }) => (
          <div key={label} className="mb-0.5">
            {!collapsed && (
              <div className="px-3 pt-4 pb-1">
                <span
                  className="text-[9px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: "var(--p-text-3)", fontFamily: '"Geist", sans-serif' }}
                >
                  {label}
                </span>
              </div>
            )}
            {items.map(({ to, icon: Icon, label: itemLabel }) => (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? itemLabel : undefined}
                className="flex items-center text-xs font-medium transition-all duration-150 relative mx-1.5 rounded-lg"
                style={({ isActive }) => ({
                  gap: collapsed ? 0 : 9,
                  padding: collapsed ? "9px 0" : "7px 10px",
                  justifyContent: collapsed ? "center" : undefined,
                  color: isActive ? "var(--p-accent)" : "var(--p-text-2)",
                  background: isActive ? "var(--p-accent-subtle)" : "transparent",
                  marginBottom: 1,
                })}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  const isActive = el.style.color.includes("94") || el.style.background.includes("accent");
                  if (!el.style.background.includes("var(--p-accent-subtle)")) {
                    el.style.background = "var(--p-bg-card)";
                    el.style.color = "var(--p-text-1)";
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  if (!el.style.background.includes("var(--p-accent-subtle)")) {
                    el.style.background = "transparent";
                    el.style.color = "var(--p-text-2)";
                  }
                }}
              >
                <Icon size={14} className="flex-shrink-0" />
                {!collapsed && <span>{itemLabel}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Bottom stats ── */}
      <div
        className="flex-shrink-0"
        style={{
          padding: collapsed ? "10px 6px" : "12px 14px",
          borderTop: "1px solid var(--p-border)",
        }}
      >
        {collapsed ? (
          <div className="flex items-center justify-center">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--p-green)", animation: "pulse 2s infinite" }}
            />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{ color: "var(--p-text-3)" }}>Entities</span>
              <span className="text-[10px] font-mono" style={{ color: "var(--p-text-2)" }}>
                {metrics?.total_entities ?? "1,675"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{ color: "var(--p-text-3)" }}>Platforms</span>
              <span className="text-[10px] font-mono" style={{ color: "var(--p-text-2)" }}>
                {metrics?.platform_count ?? 16}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 mt-2 pt-2"
              style={{ borderTop: "1px solid var(--p-border)" }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "var(--p-green)", animation: "pulse 2s infinite" }}
              />
              <span className="text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>
                connected · 16 platforms
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
