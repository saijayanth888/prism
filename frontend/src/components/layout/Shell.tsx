import { Bot, Sparkles } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useChatStore } from "../../stores/chat";
import IrisPanel from "../copilot/IrisPanel";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function Shell() {
  const { isOpen, toggleChat } = useChatStore();

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ background: "var(--p-bg-main)" }}
    >
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto relative" style={{ background: "var(--p-bg-main)" }}>
          <Outlet />

          {/* Floating Iris FAB — hidden when panel is open */}
          {!isOpen && (
            <button
              onClick={toggleChat}
              className="fixed bottom-6 right-6 z-50 flex items-center gap-2 transition-all"
              style={{
                background: "linear-gradient(135deg, #22D3EE, #3B82F6)",
                borderRadius: 16,
                padding: "9px 15px",
                boxShadow: "0 0 28px rgba(34,211,238,0.4), 0 4px 14px rgba(0,0,0,0.35)",
                fontFamily: '"Geist", system-ui, sans-serif',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = "0 0 40px rgba(34,211,238,0.55), 0 6px 20px rgba(0,0,0,0.45)";
                el.style.transform = "translateY(-2px) scale(1.02)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = "0 0 28px rgba(34,211,238,0.4), 0 4px 14px rgba(0,0,0,0.35)";
                el.style.transform = "translateY(0) scale(1)";
              }}
            >
              <div className="relative">
                <Bot size={15} style={{ color: "#0A0A14" }} />
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border"
                  style={{ background: "#34D399", borderColor: "#0A0A14", animation: "pulse 2s infinite" }}
                />
              </div>
              <span className="text-xs font-bold" style={{ color: "#0A0A14" }}>Ask Iris</span>
              <Sparkles size={11} style={{ color: "#0A0A14", opacity: 0.7 }} />
            </button>
          )}
        </main>
      </div>

      {/* Floating Iris panel — position:fixed, draggable, renders above everything */}
      {isOpen && <IrisPanel />}
    </div>
  );
}
