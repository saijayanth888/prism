import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Shell from "./components/layout/Shell";
import ApplicationLens from "./pages/ApplicationLens";
import BlastRadius from "./pages/BlastRadius";
import Changes from "./pages/Changes";
import ComplianceCenter from "./pages/ComplianceCenter";
import Connectors from "./pages/Connectors";
import Dashboard from "./pages/Dashboard";
import Docs from "./pages/Docs";
import Documents from "./pages/Documents";
import HealthDashboard from "./pages/HealthDashboard";
import IrisChat from "./pages/IrisChat";
import Landing from "./pages/Landing";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import TopologyExplorer from "./pages/TopologyExplorer";
import VulnerabilityIntel from "./pages/VulnerabilityIntel";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Landing page — outside Shell */}
          <Route index element={<Landing />} />

          {/* App shell — all authenticated routes */}
          <Route element={<Shell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/topology" element={<TopologyExplorer />} />
            <Route path="/app/:id?" element={<ApplicationLens />} />
            <Route path="/compliance" element={<ComplianceCenter />} />
            <Route path="/health" element={<HealthDashboard />} />
            <Route path="/iris" element={<IrisChat />} />
            <Route path="/vulnerabilities" element={<VulnerabilityIntel />} />
            <Route path="/blast-radius" element={<BlastRadius />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/connectors" element={<Connectors />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/changes" element={<Changes />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
