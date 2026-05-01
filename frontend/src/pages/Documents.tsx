import {
  AlertCircle, CheckCircle, Clock, FileJson, FileSpreadsheet, FileText,
  FileType, Loader2, Paperclip, Plus, Trash2, UploadCloud, X
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";

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

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bg: string; icon: React.FC<any> }> = {
  pending:    { label: "Pending",    color: "var(--p-text-3)", bg: "rgba(100,116,139,0.1)", icon: Clock },
  parsing:    { label: "Parsing",    color: "#F59E0B", bg: "rgba(245,158,11,0.1)", icon: Loader2 },
  extracting: { label: "Extracting", color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: Loader2 },
  enriching:  { label: "Enriching",  color: "var(--p-accent)", bg: "var(--p-accent-subtle)", icon: Loader2 },
  complete:   { label: "Complete",   color: "var(--p-green)", bg: "rgba(52,211,153,0.1)", icon: CheckCircle },
  failed:     { label: "Failed",     color: "var(--p-red)", bg: "rgba(239,68,68,0.1)", icon: AlertCircle },
};

const EXT_ICONS: Record<string, React.FC<any>> = {
  ".pdf": FileType,
  ".docx": FileText,
  ".doc": FileText,
  ".xlsx": FileSpreadsheet,
  ".xls": FileSpreadsheet,
  ".csv": FileSpreadsheet,
  ".json": FileJson,
  ".yaml": FileJson,
  ".yml": FileJson,
  ".md": FileText,
};

function getExt(filename: string) {
  return filename.slice(filename.lastIndexOf(".")).toLowerCase();
}

function FileIcon({ filename, size = 16 }: { filename: string; size?: number }) {
  const Icon = EXT_ICONS[getExt(filename)] || Paperclip;
  return <Icon size={size} />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocRow({ doc, onDelete }: { doc: IngestedDoc; onDelete: (id: string) => void }) {
  const [showEntities, setShowEntities] = useState(false);
  const { data: entitiesData } = useQuery({
    queryKey: ["doc-entities", doc.id],
    queryFn: () => apiClient.get(`/api/v1/documents/${doc.id}/entities`).then(r => r.data),
    enabled: showEntities && doc.status === "complete",
  });

  const cfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const isProcessing = ["pending", "parsing", "extracting", "enriching"].includes(doc.status);

  return (
    <div className="rounded-xl transition-all" style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)" }}>
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer"
        onClick={() => doc.status === "complete" && setShowEntities(!showEntities)}
        style={{ borderBottom: showEntities ? "1px solid var(--p-border)" : "none" }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--p-bg-main)", border: "1px solid var(--p-border)", color: "var(--p-text-2)" }}>
          <FileIcon filename={doc.filename} size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium truncate" style={{ color: "var(--p-text-1)", fontFamily: '"Geist", sans-serif' }}>
              {doc.filename}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
              style={{ background: "var(--p-bg-main)", color: "var(--p-text-3)", border: "1px solid var(--p-border)" }}>
              {getExt(doc.filename).slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>
            <span>{formatBytes(doc.size_bytes)}</span>
            <span>·</span>
            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
            {doc.status === "complete" && <span>· {doc.entity_count} entities</span>}
            {doc.error && <span style={{ color: "var(--p-red)" }}>· {doc.error.slice(0, 40)}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium flex-shrink-0"
          style={{ background: cfg.bg, color: cfg.color }}>
          <StatusIcon size={10} className={isProcessing ? "animate-spin" : ""} />
          {cfg.label}
        </div>

        {doc.status === "complete" && (
          <div className="text-center flex-shrink-0">
            <div className="text-lg font-mono font-bold" style={{ color: "var(--p-accent)" }}>{doc.entity_count}</div>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--p-text-3)" }}>entities</div>
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
          className="w-6 h-6 flex items-center justify-center rounded-lg transition-all flex-shrink-0"
          style={{ color: "var(--p-text-3)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-red)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-3)"; }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {showEntities && entitiesData?.entities?.length > 0 && (
        <div className="px-5 py-3">
          <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color: "var(--p-text-3)" }}>
            Extracted entities ({entitiesData.entity_count})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {entitiesData.entities.slice(0, 20).map((e: any, i: number) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono"
                style={{ background: "var(--p-bg-main)", border: "1px solid var(--p-border)", color: "var(--p-text-2)" }}
                title={e.description || e.entity_type}
              >
                <span style={{ color: "var(--p-accent)" }}>{e.entity_type}</span>
                <span style={{ color: "var(--p-text-3)" }}>·</span>
                {e.name}
              </div>
            ))}
            {entitiesData.entity_count > 20 && (
              <div className="px-2 py-1 rounded-lg text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>
                +{entitiesData.entity_count - 20} more
              </div>
            )}
          </div>
          {entitiesData.summary && (
            <div className="mt-2 text-[11px] leading-relaxed" style={{ color: "var(--p-text-2)" }}>
              {entitiesData.summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const SUPPORTED = [".pdf", ".docx", ".xlsx", ".yaml", ".yml", ".json", ".md", ".csv", ".txt"];

export default function Documents() {
  const qc = useQueryClient();
  const dropRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [draggingOver, setDraggingOver] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => apiClient.get("/api/v1/documents").then(r => r.data),
    staleTime: 10_000,
    refetchInterval: (data: any) => {
      const docs: IngestedDoc[] = data?.documents || [];
      const hasProcessing = docs.some(d => ["pending", "parsing", "extracting", "enriching"].includes(d.status));
      return hasProcessing ? 3000 : false;
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOver(false);
    uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  const docs: IngestedDoc[] = data?.documents || [];
  const totalEntities = docs.reduce((a, d) => a + d.entity_count, 0);
  const complete = docs.filter(d => d.status === "complete").length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--p-text-1)", fontFamily: '"Syne", sans-serif' }}>
            Document Intelligence
          </h1>
          <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--p-text-3)" }}>
            CPT Channel 2 · LLM entity extraction · graph enrichment
          </p>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-2xl font-mono font-bold" style={{ color: "var(--p-text-1)" }}>{docs.length}</div>
            <div className="text-[10px]" style={{ color: "var(--p-text-3)" }}>documents</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold" style={{ color: "var(--p-accent)" }}>{totalEntities}</div>
            <div className="text-[10px]" style={{ color: "var(--p-text-3)" }}>entities extracted</div>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "var(--p-accent)", color: "#fff", boxShadow: "0 0 20px rgba(94,106,210,0.3)" }}
          >
            <Plus size={14} />
            Upload
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={SUPPORTED.join(",")}
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Supported formats bar */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)" }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--p-text-3)" }}>Supported</span>
        <div className="flex flex-wrap gap-1.5">
          {SUPPORTED.map(ext => (
            <span key={ext} className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: "var(--p-bg-main)", color: "var(--p-text-2)", border: "1px solid var(--p-border)" }}>
              {ext}
            </span>
          ))}
        </div>
        <div className="ml-auto text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>
          {complete}/{docs.length} processed
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className="rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3 py-10"
        style={{
          background: draggingOver ? "var(--p-accent-subtle)" : "var(--p-bg-card)",
          border: `2px dashed ${draggingOver ? "var(--p-accent)" : "var(--p-border)"}`,
        }}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: draggingOver ? "var(--p-accent-subtle)" : "var(--p-bg-main)", border: "1px solid var(--p-border)" }}>
          <UploadCloud size={22} style={{ color: draggingOver ? "var(--p-accent)" : "var(--p-text-3)" }} />
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold" style={{ color: draggingOver ? "var(--p-accent)" : "var(--p-text-1)", fontFamily: '"Syne", sans-serif' }}>
            {draggingOver ? "Drop to upload" : "Drop documents here"}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: "var(--p-text-3)" }}>
            CPT engine extracts entities and enriches the knowledge graph
          </div>
        </div>
      </div>

      {/* Uploading spinners */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map(name => (
            <div key={name} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "var(--p-accent-subtle)", border: "1px solid var(--p-accent-border)" }}>
              <Loader2 size={14} className="animate-spin flex-shrink-0" style={{ color: "var(--p-accent)" }} />
              <span className="text-sm font-mono flex-1" style={{ color: "var(--p-accent)" }}>Uploading {name}…</span>
            </div>
          ))}
        </div>
      )}

      {/* Document list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--p-bg-card)" }} />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)" }}>
            <FileText size={24} style={{ color: "var(--p-text-3)" }} />
          </div>
          <div className="text-sm font-semibold mb-1" style={{ color: "var(--p-text-2)", fontFamily: '"Syne", sans-serif' }}>
            No documents yet
          </div>
          <div className="text-[11px]" style={{ color: "var(--p-text-3)" }}>
            Upload architecture docs, runbooks, API specs, or spreadsheets
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <DocRow key={doc.id} doc={doc} onDelete={deleteDoc} />
          ))}
        </div>
      )}

      {/* Info footer */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
        style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)" }}>
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "var(--p-accent-subtle)", border: "1px solid var(--p-accent-border)" }}>
          <span className="text-[10px] font-bold" style={{ color: "var(--p-accent)" }}>i</span>
        </div>
        <div className="text-[11px] leading-relaxed" style={{ color: "var(--p-text-3)" }}>
          Documents are processed asynchronously. The CPT engine classifies each document, chunks it into context windows,
          then uses Claude to extract infrastructure entities and relationships. Extracted entities are merged into your
          knowledge graph and become searchable via Iris using{" "}
          <span className="font-mono" style={{ color: "var(--p-iris)" }}>search_documents</span> and{" "}
          <span className="font-mono" style={{ color: "var(--p-iris)" }}>get_business_context</span> tools.
        </div>
      </div>
    </div>
  );
}
