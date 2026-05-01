import {
  AlertCircle, CheckCircle, Clock, FileJson, FileSpreadsheet, FileText,
  FileType, Loader2, Paperclip, Plus, RefreshCw, Trash2, UploadCloud,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";
import PageHead from "../components/common/PageHead";
import MetricCard from "../components/dashboard/MetricCard";
import IrisQuickAsk from "../components/common/IrisQuickAsk";

type DocStatus = "pending" | "parsing" | "extracting" | "enriching" | "complete" | "failed";

interface IngestedDoc {
  id: string;
  filename: string;
  status: DocStatus;
  doc_type: string;
  entity_count: number;
  size_bytes: number;
  created_at: string;
  processed_at: string | null;
  error?: string;
}

/* ──────────────────────────────────────────────
   Source mock data — mirrors reference design
   ────────────────────────────────────────────── */

interface DocActivity {
  id: string;
  src: "C" | "G" | "N" | "D" | "L" | "S";
  srcName: string;
  srcColor: string;
  title: string;
  meta: string;
  tags: string[];
  time: string;
  stale: boolean;
}

const ACTIVITY: DocActivity[] = [
  { id: "a1", src: "C", srcName: "Confluence", srcColor: "#172B4D", title: "payments-svc · DB failover runbook",         meta: "platform · sara@",        tags: ["runbook"],      time: "2h",   stale: false },
  { id: "a2", src: "C", srcName: "Confluence", srcColor: "#172B4D", title: "SOC 2 narratives — CC6 access review",       meta: "compliance · jordan@",    tags: ["SOC 2"],        time: "14m",  stale: false },
  { id: "a3", src: "G", srcName: "GitHub",     srcColor: "#24292F", title: "orders-api/README.md",                       meta: "orders · ci-bot",         tags: ["code"],         time: "1d",   stale: false },
  { id: "a4", src: "C", srcName: "Confluence", srcColor: "#172B4D", title: "Post-mortem · INC-2042 elevated 5xx",        meta: "orders · jordan@",        tags: ["post-mortem"],  time: "5h",   stale: false },
  { id: "a5", src: "G", srcName: "GitHub",     srcColor: "#24292F", title: "infra/terraform/networking",                 meta: "platform · ci-bot",       tags: ["IaC"],          time: "3d",   stale: false },
  { id: "a6", src: "N", srcName: "Notion",     srcColor: "#000000", title: "On-call rotation · Q2",                      meta: "platform · sara@",        tags: ["ticket"],       time: "8h",   stale: false },
  { id: "a7", src: "D", srcName: "Drive",      srcColor: "#1FA463", title: "Architecture deep-dive · v3",                meta: "architecture · jordan@",  tags: ["design"],       time: "12m",  stale: false },
  { id: "a8", src: "C", srcName: "Confluence", srcColor: "#172B4D", title: "Kafka sizing guide",                         meta: "data · platform-eng@",    tags: ["runbook"],      time: "94d",  stale: true },
  { id: "a9", src: "S", srcName: "SharePoint", srcColor: "#0078D4", title: "DR procedures — legacy",                     meta: "platform · platform-eng@",tags: ["DR"],           time: "182d", stale: true },
  { id: "a10",src: "L", srcName: "Local",      srcColor: "#5E6AD2", title: "CMDB export 2024",                           meta: "data · sara@",            tags: ["compliance"],   time: "123d", stale: true },
];

const SOURCES = [
  { name: "Confluence", count: 298, pct: 62, color: "#172B4D" },
  { name: "GitHub",     count: 136, pct: 28, color: "#24292F" },
  { name: "Notion",     count: 38,  pct: 8,  color: "#000000" },
  { name: "Drive",      count: 8,   pct: 4,  color: "#1FA463" },
  { name: "SharePoint", count: 2,   pct: 2,  color: "#0078D4" },
];

const TOP_CITED = [
  { title: "Architecture deep-dive", count: 84 },
  { title: "DB failover runbook",     count: 62 },
  { title: "orders-api README",       count: 54 },
  { title: "SOC 2 narratives",        count: 47 },
  { title: "On-call rotation",        count: 38 },
];

const STALE_DOCS = [
  { title: "Kafka sizing guide", age: "94d",  warn: true },
  { title: "DR procedures",      age: "123d", warn: true },
  { title: "CMDB export 2024",   age: "182d", danger: true },
];

const IRIS_PROMPTS = [
  "Find all runbooks related to the payments service",
  "Which documents have not been updated in 90 days and are linked to critical services?",
];

/* ──────────────────────────────────────────────
   Status / icon helpers (live upload pipeline)
   ────────────────────────────────────────────── */

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bg: string; icon: React.FC<any> }> = {
  pending:    { label: "Pending",    color: "var(--p-text-3)", bg: "var(--p-bg-elevated)",   icon: Clock },
  parsing:    { label: "Parsing",    color: "var(--p-amber)",  bg: "var(--p-amber-subtle)",  icon: Loader2 },
  extracting: { label: "Extracting", color: "var(--p-accent)", bg: "var(--p-accent-subtle)", icon: Loader2 },
  enriching:  { label: "Enriching",  color: "var(--p-accent)", bg: "var(--p-accent-subtle)", icon: Loader2 },
  complete:   { label: "Complete",   color: "var(--p-green)",  bg: "var(--p-green-subtle)",  icon: CheckCircle },
  failed:     { label: "Failed",     color: "var(--p-red)",    bg: "var(--p-red-subtle)",    icon: AlertCircle },
};

const EXT_ICONS: Record<string, React.FC<any>> = {
  ".pdf": FileType, ".docx": FileText, ".doc": FileText,
  ".xlsx": FileSpreadsheet, ".xls": FileSpreadsheet, ".csv": FileSpreadsheet,
  ".json": FileJson, ".yaml": FileJson, ".yml": FileJson, ".md": FileText,
};

function getExt(filename: string) { return filename.slice(filename.lastIndexOf(".")).toLowerCase(); }

function FileIcon({ filename, size = 14 }: { filename: string; size?: number }) {
  const Icon = EXT_ICONS[getExt(filename)] || Paperclip;
  return <Icon size={size} />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ──────────────────────────────────────────────
   Small UI primitives used on this page
   ────────────────────────────────────────────── */

function Pill({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-[2px] rounded-md text-[10px] font-mono"
      style={{
        background: "var(--p-bg-elevated)",
        color: color || "var(--p-text-2)",
        border: "1px solid var(--p-border)",
      }}
    >
      {children}
    </span>
  );
}

function SidePanel({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: accent ? "var(--p-iris-subtle)" : "var(--p-bg-card)",
        boxShadow: accent ? "inset 0 0 0 1px var(--p-iris-border)" : "var(--p-surface)",
      }}
    >
      <h4
        className="text-[10px] font-mono uppercase tracking-[0.12em] mb-2.5 font-medium"
        style={{ color: accent ? "var(--p-iris)" : "var(--p-text-3)" }}
      >
        {title}
      </h4>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function SideRow({
  k, v, vColor, bar,
}: {
  k: string;
  v: string | number;
  vColor?: string;
  bar?: { pct: number; color: string };
}) {
  return (
    <div
      className="flex items-center gap-2.5 py-[7px] text-[11px] font-mono"
      style={{ borderBottom: "1px solid var(--p-border-subtle)" }}
    >
      <span className="flex-1 truncate" style={{ color: "var(--p-text-2)" }}>{k}</span>
      {bar && (
        <div className="flex-1 h-1 rounded-sm overflow-hidden" style={{ background: "var(--p-bg-elevated)" }}>
          <span className="block h-full rounded-sm" style={{ width: `${bar.pct}%`, background: bar.color }} />
        </div>
      )}
      <span className="font-semibold" style={{ color: vColor || "var(--p-text-1)" }}>{v}</span>
    </div>
  );
}

function HeaderButton({
  variant = "ghost", onClick, children, icon,
}: {
  variant?: "ghost" | "primary";
  onClick?: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
      style={{
        background: isPrimary ? "var(--p-accent)" : "var(--p-bg-card)",
        color: isPrimary ? "var(--p-text-inv)" : "var(--p-text-2)",
        border: `1px solid ${isPrimary ? "var(--p-accent)" : "var(--p-border)"}`,
        boxShadow: isPrimary ? "0 0 18px var(--p-accent-glow)" : "none",
        fontFamily: '"Geist", system-ui, sans-serif',
      }}
    >
      {icon}
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────
   Live upload row (kept from prior implementation)
   ────────────────────────────────────────────── */

function UploadRow({ doc, onDelete }: { doc: IngestedDoc; onDelete: (id: string) => void }) {
  const cfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const isProcessing = ["pending", "parsing", "extracting", "enriching"].includes(doc.status);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface)" }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--p-bg-elevated)", color: "var(--p-text-2)" }}
      >
        <FileIcon filename={doc.filename} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate" style={{ color: "var(--p-text-1)" }}>{doc.filename}</div>
        <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--p-text-3)" }}>
          {formatBytes(doc.size_bytes)} · {doc.entity_count} entities
        </div>
      </div>
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        <StatusIcon size={10} className={isProcessing ? "animate-spin" : ""} />
        {cfg.label}
      </div>
      <button
        onClick={() => onDelete(doc.id)}
        className="w-6 h-6 flex items-center justify-center rounded-md transition-colors"
        style={{ color: "var(--p-text-3)" }}
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main page
   ────────────────────────────────────────────── */

const SUPPORTED = [".pdf", ".docx", ".xlsx", ".yaml", ".yml", ".json", ".md", ".csv", ".txt"];

export default function Documents() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [src, setSrc] = useState<"all" | DocActivity["src"]>("all");
  const [filt, setFilt] = useState<"all" | "runbook" | "stale" | "compliance">("all");
  const [uploading, setUploading] = useState<string[]>([]);

  const { data } = useQuery({
    queryKey: ["documents"],
    queryFn: () => apiClient.get("/api/v1/documents").then(r => r.data),
    staleTime: 10_000,
    refetchInterval: (data: any) => {
      const docs: IngestedDoc[] = data?.documents || [];
      return docs.some(d => ["pending", "parsing", "extracting", "enriching"].includes(d.status)) ? 3000 : false;
    },
  });

  const { mutate: deleteDoc } = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    for (const file of arr) {
      setUploading(prev => [...prev, file.name]);
      try {
        const form = new FormData();
        form.append("file", file);
        await apiClient.post("/api/v1/documents/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        qc.invalidateQueries({ queryKey: ["documents"] });
      } catch (e) {
        console.error("Upload failed:", e);
      } finally {
        setUploading(prev => prev.filter(n => n !== file.name));
      }
    }
  }, [qc]);

  const docs: IngestedDoc[] = data?.documents || [];
  const liveDocs = docs.filter(d => d.status !== "complete" || uploading.length > 0).slice(0, 3);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ACTIVITY.filter(row => {
      const srcOk  = src === "all" || row.src === src;
      const tagOk  = filt === "all" || filt === "stale" || row.tags.some(t => t.toLowerCase().includes(filt));
      const stOk   = filt !== "stale" || row.stale;
      const qOk    = !q || (row.title + " " + row.meta + " " + row.tags.join(" ")).toLowerCase().includes(q);
      return srcOk && tagOk && stOk && qOk;
    });
  }, [search, src, filt]);

  return (
    <div className="min-h-screen" style={{ background: "var(--p-bg-main)" }}>
      <PageHead
        eyebrow="INTELLIGENCE · INDEXED KNOWLEDGE"
        title="Documents"
        subtitle="482 documents across Confluence, GitHub, Notion, Drive, SharePoint. Embedded with 1024-dim model. Iris cites by anchor — every answer links back here."
        actions={
          <>
            <HeaderButton icon={<RefreshCw size={12} />} onClick={() => qc.invalidateQueries({ queryKey: ["documents"] })}>
              Re-index
            </HeaderButton>
            <HeaderButton variant="primary" icon={<Plus size={12} />} onClick={() => fileRef.current?.click()}>
              Upload doc
            </HeaderButton>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={SUPPORTED.join(",")}
              className="hidden"
              onChange={(e) => e.target.files && uploadFiles(e.target.files)}
            />
          </>
        }
      />

      <div className="px-6 pb-8 space-y-4">
        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Indexed" value="482" trend={24} trendDirection="up" />
          <MetricCard label="Stale" value="38" />
          <MetricCard label="Iris citations/d" value="214" />
          <MetricCard label="Sources" value="6" />
        </div>

        {/* Toolbar */}
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-xl"
          style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface)" }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 px-2">
            <FileText size={13} style={{ color: "var(--p-text-3)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search runbooks, architecture docs, post-mortems, READMEs…"
              className="flex-1 bg-transparent outline-none font-mono text-xs"
              style={{ color: "var(--p-text-1)" }}
            />
            <kbd
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: "var(--p-bg-elevated)", color: "var(--p-text-3)", border: "1px solid var(--p-border)" }}
            >⌘</kbd>
            <kbd
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: "var(--p-bg-elevated)", color: "var(--p-text-3)", border: "1px solid var(--p-border)" }}
            >F</kbd>
          </div>
          <div className="flex items-center gap-3 pl-3" style={{ borderLeft: "1px solid var(--p-border)" }}>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--p-text-3)" }}>source</span>
              <select
                value={src}
                onChange={(e) => setSrc(e.target.value as any)}
                className="text-[11px] rounded-md px-2 py-1 outline-none font-mono cursor-pointer"
                style={{ background: "var(--p-bg-elevated)", color: "var(--p-text-2)", border: "1px solid var(--p-border)" }}
              >
                <option value="all">all</option>
                <option value="C">Confluence</option>
                <option value="G">GitHub</option>
                <option value="N">Notion</option>
                <option value="D">Drive</option>
                <option value="S">SharePoint</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--p-text-3)" }}>filter</span>
              <select
                value={filt}
                onChange={(e) => setFilt(e.target.value as any)}
                className="text-[11px] rounded-md px-2 py-1 outline-none font-mono cursor-pointer"
                style={{ background: "var(--p-bg-elevated)", color: "var(--p-text-2)", border: "1px solid var(--p-border)" }}
              >
                <option value="all">all</option>
                <option value="runbook">runbook</option>
                <option value="stale">stale (&gt;90d)</option>
                <option value="compliance">compliance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live upload status */}
        {(uploading.length > 0 || liveDocs.length > 0) && (
          <div className="space-y-2">
            {uploading.map(name => (
              <div
                key={name}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                style={{ background: "var(--p-accent-subtle)", border: "1px solid var(--p-accent-border)" }}
              >
                <Loader2 size={13} className="animate-spin flex-shrink-0" style={{ color: "var(--p-accent)" }} />
                <span className="text-xs font-mono flex-1" style={{ color: "var(--p-accent)" }}>Uploading {name}…</span>
              </div>
            ))}
            {liveDocs.map(d => <UploadRow key={d.id} doc={d} onDelete={deleteDoc} />)}
          </div>
        )}

        {/* Two-col main */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 280px" }}>
          {/* LEFT — Recent activity */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--p-bg-card)", boxShadow: "var(--p-surface)" }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--p-border-subtle)" }}
            >
              <div className="text-sm font-semibold" style={{ color: "var(--p-text-1)" }}>
                Recent activity{" "}
                <span className="font-mono text-[11px] ml-1" style={{ color: "var(--p-text-2)" }}>{filtered.length}</span>
              </div>
            </div>
            <div>
              {filtered.length === 0 ? (
                <div className="px-5 py-10 text-center text-xs" style={{ color: "var(--p-text-3)" }}>
                  No documents match your filters.
                </div>
              ) : (
                filtered.map((d, i) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--p-border-subtle)" : "none",
                      borderLeft: d.stale ? "2px solid var(--p-amber)" : "2px solid transparent",
                      background: d.stale ? "var(--p-amber-subtle)" : "transparent",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 text-[12px] font-bold"
                      style={{ background: d.srcColor, color: "#FFFFFF", fontFamily: '"JetBrains Mono", monospace' }}
                      title={d.srcName}
                    >
                      {d.src}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate" style={{ color: "var(--p-text-1)" }}>
                        {d.title}
                      </div>
                      <div className="text-[10.5px] font-mono mt-0.5" style={{ color: "var(--p-text-3)" }}>
                        {d.meta}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {d.tags.map(t => <Pill key={t}>{t}</Pill>)}
                    </div>
                    <div
                      className="text-[11px] font-mono w-12 text-right flex-shrink-0"
                      style={{ color: d.stale ? "var(--p-amber)" : "var(--p-text-3)" }}
                    >
                      {d.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT — sidebar */}
          <div className="flex flex-col gap-4">
            <SidePanel title="Sources">
              {SOURCES.map(s => (
                <SideRow key={s.name} k={s.name} v={s.count} bar={{ pct: s.pct, color: s.color }} />
              ))}
            </SidePanel>

            <SidePanel title="Top cited by Iris">
              {TOP_CITED.map(t => <SideRow key={t.title} k={t.title} v={`${t.count}×`} />)}
            </SidePanel>

            <SidePanel title="Stale docs (>90d)">
              {STALE_DOCS.map(s => (
                <SideRow
                  key={s.title}
                  k={s.title}
                  v={s.age}
                  vColor={s.danger ? "var(--p-red)" : "var(--p-amber)"}
                />
              ))}
            </SidePanel>

            <IrisQuickAsk prompts={IRIS_PROMPTS} context="documents" />
          </div>
        </div>

        {/* Drop zone — minimised inline footer */}
        <div
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => { e.preventDefault(); uploadFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
          style={{
            background: "var(--p-bg-card)",
            border: "1px dashed var(--p-border-strong)",
          }}
        >
          <UploadCloud size={15} style={{ color: "var(--p-text-3)" }} />
          <div className="text-[12px]" style={{ color: "var(--p-text-2)" }}>
            Drop files here, or click to upload —
            <span className="font-mono ml-1" style={{ color: "var(--p-text-3)" }}>
              {SUPPORTED.join("  ")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
