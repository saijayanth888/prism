import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Eye, EyeOff, Loader2, Plus, RefreshCw, Settings2, Shield, X, Zap } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";

type Status = "synced" | "syncing" | "error" | "unknown";

type AuthProtocol =
  | "api_key"
  | "bearer"
  | "basic"
  | "oauth2"
  | "msgraph"
  | "mtls"
  | "aws_iam"
  | "k8s_sa"
  | "saml"
  | "ldap";

const AUTH_PROTOCOLS: { value: AuthProtocol; label: string; desc: string }[] = [
  { value: "api_key",  label: "API Key",                   desc: "Static key sent as header or query param" },
  { value: "bearer",   label: "Bearer Token",              desc: "JWT / PAT in Authorization header" },
  { value: "basic",    label: "Basic Auth",                desc: "Username + password over TLS" },
  { value: "oauth2",   label: "OAuth 2.0",                 desc: "Client credentials flow" },
  { value: "msgraph",  label: "Microsoft Graph OAuth 2.0", desc: "Azure AD app registration — tenant/client/secret" },
  { value: "mtls",     label: "mTLS",                      desc: "Mutual TLS with client certificate" },
  { value: "aws_iam",  label: "AWS IAM",                   desc: "Access key + secret + SigV4 signing" },
  { value: "k8s_sa",   label: "Kubernetes ServiceAccount", desc: "In-cluster service account or kubeconfig" },
  { value: "saml",     label: "SAML 2.0",                  desc: "SSO via identity provider assertion" },
  { value: "ldap",     label: "LDAP / Active Directory",   desc: "Bind DN + password directory auth" },
];

const DEFAULT_PROTOCOL: Record<string, AuthProtocol> = {
  kubernetes: "k8s_sa",  github: "bearer",     datadog: "api_key",  aws: "aws_iam",
  vault: "bearer",       servicenow: "basic",  jira: "basic",       sonarqube: "basic",
  terraform: "bearer",   argocd: "bearer",     apiconnect: "oauth2", confluent: "api_key",
  nexus: "basic",        sharepoint: "msgraph",
};

const STATUS_CONFIG: Record<Status, { color: string; bg: string; label: string; icon: React.FC<any> }> = {
  synced:  { color: "var(--p-green)",   bg: "var(--p-green-subtle)",  label: "Synced",  icon: CheckCircle },
  syncing: { color: "var(--p-amber)",   bg: "var(--p-amber-subtle)",  label: "Syncing", icon: Loader2 },
  error:   { color: "var(--p-red)",     bg: "var(--p-red-subtle)",    label: "Error",   icon: AlertCircle },
  unknown: { color: "var(--p-text-3)",  bg: "var(--p-bg-border)",     label: "Unknown", icon: AlertCircle },
};

const PLATFORM_COLORS: Record<string, string> = {
  kubernetes: "#3B82F6", github: "var(--p-text-2)",  datadog: "#8B5CF6",  aws: "#F59E0B",
  confluent: "#22C55E",  argocd: "#EC4899",  terraform: "#7C3AED", vault: "#F59E0B",
  servicenow: "#22D3EE", jira: "#3B82F6",    apiconnect: "#6366F1", sonarqube: "#EF4444",
  nexus: "var(--p-text-3)",      sharepoint: "#0078D4",
};

interface Platform {
  id: string; name: string; entityCount: number;
  status: Status; lastSynced?: string; host?: string;
}

const MOCK_PLATFORMS: Platform[] = [
  { id: "kubernetes", name: "Kubernetes",       entityCount: 312, status: "synced",  lastSynced: "2 min ago",   host: "https://k8s.internal:6443" },
  { id: "github",     name: "GitHub",           entityCount: 87,  status: "synced",  lastSynced: "5 min ago",   host: "https://api.github.com" },
  { id: "datadog",    name: "Datadog",          entityCount: 204, status: "synced",  lastSynced: "3 min ago",   host: "https://api.datadoghq.com" },
  { id: "aws",        name: "AWS",              entityCount: 156, status: "synced",  lastSynced: "4 min ago",   host: "https://aws.amazon.com" },
  { id: "confluent",  name: "Confluent Kafka",  entityCount: 43,  status: "synced",  lastSynced: "6 min ago",   host: "https://confluent.cloud" },
  { id: "argocd",     name: "ArgoCD",           entityCount: 28,  status: "syncing", lastSynced: "syncing…",    host: "https://argocd.internal" },
  { id: "terraform",  name: "Terraform",        entityCount: 198, status: "synced",  lastSynced: "10 min ago",  host: "https://app.terraform.io" },
  { id: "vault",      name: "HashiCorp Vault",  entityCount: 67,  status: "synced",  lastSynced: "8 min ago",   host: "https://vault.internal:8200" },
  { id: "servicenow", name: "ServiceNow",       entityCount: 0,   status: "error",   lastSynced: "auth failed", host: "https://acme.service-now.com" },
  { id: "jira",       name: "Jira",             entityCount: 112, status: "synced",  lastSynced: "12 min ago",  host: "https://acme.atlassian.net" },
  { id: "apiconnect", name: "IBM API Connect",  entityCount: 95,  status: "synced",  lastSynced: "7 min ago",   host: "https://api.acme.ibm.com" },
  { id: "sonarqube",  name: "SonarQube",        entityCount: 284, status: "synced",  lastSynced: "15 min ago",  host: "https://sonar.internal" },
  { id: "nexus",       name: "Nexus Registry",           entityCount: 89,  status: "synced",  lastSynced: "20 min ago",  host: "https://nexus.internal:8081" },
  { id: "sharepoint",  name: "Microsoft SharePoint",     entityCount: 0,   status: "unknown", lastSynced: "never",       host: "https://acme.sharepoint.com" },
];

/* ── Shared field components ─────────────────────────────── */
function Field({ label, placeholder, secret, value, onChange }: {
  label: string; placeholder?: string; secret?: boolean;
  value: string; onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-[9px] uppercase tracking-wider mb-1 font-semibold" style={{ color: "var(--p-text-3)" }}>{label}</label>
      <div className="flex items-center gap-1 rounded-lg overflow-hidden transition-all"
        style={{ background: "var(--p-bg-main)", border: "1px solid var(--p-border)" }}
        onFocus={() => {}} >
        <input
          type={secret && !show ? "password" : "text"}
          value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 text-[11px] font-mono bg-transparent outline-none" style={{ color: "var(--p-text-1)" }}
          onFocus={(e) => (e.currentTarget.parentElement!.style.borderColor = "var(--p-iris-border)")}
          onBlur={(e) => (e.currentTarget.parentElement!.style.borderColor = "var(--p-border)")}
        />
        {secret && (
          <button onClick={() => setShow(!show)} className="px-2 transition-colors" style={{ color: "var(--p-text-3)" }}>
            {show ? <EyeOff size={11} /> : <Eye size={11} />}
          </button>
        )}
      </div>
    </div>
  );
}

function TextArea({ label, placeholder, value, onChange }: {
  label: string; placeholder?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[9px] uppercase tracking-wider mb-1 font-semibold" style={{ color: "var(--p-text-3)" }}>{label}</label>
      <textarea
        rows={3} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 text-[10px] font-mono rounded-lg resize-none outline-none transition-all" style={{ color: "var(--p-text-1)" }}
        style={{ background: "var(--p-bg-main)", border: "1px solid var(--p-border)" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--p-iris-border)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--p-border)")}
      />
    </div>
  );
}

function Toggle({ label, desc, value, onChange }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div>
        <div className="text-[11px] font-medium" style={{ color: "var(--p-text-2)" }}>{label}</div>
        {desc && <div className="text-[9px] mt-0.5" style={{ color: "var(--p-text-3)" }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!value)}
        className="w-9 h-5 rounded-full flex items-center px-0.5 transition-all flex-shrink-0"
        style={{ background: value ? "var(--p-iris)" : "var(--p-bg-main)", border: `1px solid ${value ? "var(--p-iris)" : "var(--p-border)"}` }}>
        <div className="w-4 h-4 rounded-full bg-white transition-all" style={{ marginLeft: value ? "auto" : 0 }} />
      </button>
    </div>
  );
}

/* ── Auth protocol dynamic fields ───────────────────────── */
function AuthFields({ protocol, fields, setField }: {
  protocol: AuthProtocol;
  fields: Record<string, string>;
  setField: (k: string, v: string) => void;
}) {
  const f = (k: string) => fields[k] || "";
  const s = (k: string) => (v: string) => setField(k, v);

  switch (protocol) {
    case "api_key": return (
      <div className="space-y-2.5">
        <Field label="Header Name" placeholder="X-API-Key" value={f("header")} onChange={s("header")} />
        <Field label="API Key" placeholder="your-api-key" secret value={f("api_key")} onChange={s("api_key")} />
      </div>
    );
    case "bearer": return (
      <Field label="Bearer Token" placeholder="eyJ..." secret value={f("token")} onChange={s("token")} />
    );
    case "basic": return (
      <div className="space-y-2.5">
        <Field label="Username" placeholder="admin" value={f("username")} onChange={s("username")} />
        <Field label="Password" placeholder="••••••••" secret value={f("password")} onChange={s("password")} />
      </div>
    );
    case "oauth2": return (
      <div className="space-y-2.5">
        <Field label="Client ID" placeholder="client_id" value={f("client_id")} onChange={s("client_id")} />
        <Field label="Client Secret" placeholder="client_secret" secret value={f("client_secret")} onChange={s("client_secret")} />
        <Field label="Token URL" placeholder="https://auth.example.com/oauth/token" value={f("token_url")} onChange={s("token_url")} />
        <Field label="Scope (optional)" placeholder="read:metrics write:alerts" value={f("scope")} onChange={s("scope")} />
      </div>
    );
    case "mtls": return (
      <div className="space-y-2.5">
        <TextArea label="Client Certificate (PEM)" placeholder="-----BEGIN CERTIFICATE-----" value={f("client_cert")} onChange={s("client_cert")} />
        <TextArea label="Client Private Key (PEM)" placeholder="-----BEGIN PRIVATE KEY-----" value={f("client_key")} onChange={s("client_key")} />
        <TextArea label="CA Certificate (PEM)" placeholder="-----BEGIN CERTIFICATE-----" value={f("ca_cert")} onChange={s("ca_cert")} />
      </div>
    );
    case "aws_iam": return (
      <div className="space-y-2.5">
        <Field label="Access Key ID" placeholder="AKIAIOSFODNN7EXAMPLE" value={f("access_key")} onChange={s("access_key")} />
        <Field label="Secret Access Key" placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" secret value={f("secret_key")} onChange={s("secret_key")} />
        <Field label="Region" placeholder="us-east-1" value={f("region")} onChange={s("region")} />
        <Field label="Role ARN (optional)" placeholder="arn:aws:iam::123456789012:role/PrismRole" value={f("role_arn")} onChange={s("role_arn")} />
      </div>
    );
    case "k8s_sa": return (
      <div className="space-y-2.5">
        <Field label="Kubeconfig Path (optional)" placeholder="/home/.kube/config  (blank = in-cluster)" value={f("kubeconfig")} onChange={s("kubeconfig")} />
        <Field label="Namespace" placeholder="default" value={f("namespace")} onChange={s("namespace")} />
        <Field label="Service Account" placeholder="prism-reader" value={f("service_account")} onChange={s("service_account")} />
        <TextArea label="Service Account Token (optional)" placeholder="eyJhbGciOiJSUzI1NiIs..." value={f("sa_token")} onChange={s("sa_token")} />
      </div>
    );
    case "saml": return (
      <div className="space-y-2.5">
        <Field label="SSO URL (IdP)" placeholder="https://idp.example.com/sso/saml" value={f("sso_url")} onChange={s("sso_url")} />
        <Field label="Entity ID" placeholder="https://prism.internal/saml/metadata" value={f("entity_id")} onChange={s("entity_id")} />
        <TextArea label="IdP Certificate (PEM)" placeholder="-----BEGIN CERTIFICATE-----" value={f("idp_cert")} onChange={s("idp_cert")} />
        <Field label="Attribute Mapping — Email" placeholder="urn:oid:1.2.840.113549.1.9.1" value={f("attr_email")} onChange={s("attr_email")} />
      </div>
    );
    case "ldap": return (
      <div className="space-y-2.5">
        <Field label="LDAP URL" placeholder="ldaps://ldap.example.com:636" value={f("ldap_url")} onChange={s("ldap_url")} />
        <Field label="Bind DN" placeholder="cn=prism-svc,dc=example,dc=com" value={f("bind_dn")} onChange={s("bind_dn")} />
        <Field label="Bind Password" placeholder="••••••••" secret value={f("bind_password")} onChange={s("bind_password")} />
        <Field label="Base DN" placeholder="dc=example,dc=com" value={f("base_dn")} onChange={s("base_dn")} />
        <Field label="User Filter" placeholder="(sAMAccountName={{username}})" value={f("user_filter")} onChange={s("user_filter")} />
      </div>
    );
    case "msgraph": return (
      <div className="space-y-2.5">
        <div className="text-[9px] px-2 py-1.5 rounded-lg font-mono"
          style={{ background: "var(--p-accent-subtle)", color: "var(--p-accent)", border: "1px solid var(--p-accent-border)" }}>
          Microsoft Graph API — requires Azure AD app registration with Sites.Read.All + Files.Read.All permissions
        </div>
        <Field label="Tenant ID" placeholder="00000000-0000-0000-0000-000000000000" value={f("tenant_id")} onChange={s("tenant_id")} />
        <Field label="Client ID (App ID)" placeholder="00000000-0000-0000-0000-000000000000" value={f("client_id")} onChange={s("client_id")} />
        <Field label="Client Secret" placeholder="••••••••" secret value={f("client_secret")} onChange={s("client_secret")} />
        <Field label="SharePoint Site URL" placeholder="https://acme.sharepoint.com/sites/engineering" value={f("site_url")} onChange={s("site_url")} />
        <Field label="Drive / Library (optional)" placeholder="Documents  (blank = all drives)" value={f("drive")} onChange={s("drive")} />
      </div>
    );
    default: return null;
  }
}

/* ── Connector card ─────────────────────────────────────── */
function ConnectorCard({ platform, onSync }: { platform: Platform | CustomPlatform; onSync: (id: string) => void }) {
  const isCustom = "custom" in platform && platform.custom;
  const cfg = STATUS_CONFIG[platform.status] || STATUS_CONFIG.unknown;
  const color = PLATFORM_COLORS[platform.id] || "var(--p-text-3)";
  const Icon = cfg.icon;

  const [expanded, setExpanded] = useState(false);
  const [authProtocol, setAuthProtocol] = useState<AuthProtocol>(DEFAULT_PROTOCOL[platform.id] || "bearer");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [host, setHost] = useState(platform.host || "");
  const [verifySSL, setVerifySSL] = useState(true);
  const [skipHostname, setSkipHostname] = useState(false);
  const [customCA, setCustomCA] = useState(false);
  const [caValue, setCaValue] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [saved, setSaved] = useState(false);

  const setField = (k: string, v: string) => setFields((p) => ({ ...p, [k]: v }));

  const handleTest = () => {
    setTesting(true); setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult(platform.status === "error" ? "fail" : "ok");
    }, 1600);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const proto = AUTH_PROTOCOLS.find((p) => p.value === authProtocol)!;

  return (
    <div className="rounded-xl transition-all duration-200"
      style={{ background: "var(--p-bg-card)", border: `1px solid ${expanded ? "var(--p-border-strong)" : "var(--p-bg-border)"}` }}>

      {/* Card face */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{ background: color + "20", color, border: `1px solid ${color}30` }}>
              {platform.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold" style={{ color: "var(--p-text-1)" }}>{platform.name}</div>
                {isCustom && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{ background: "var(--p-accent-subtle)", color: "var(--p-accent)", border: "1px solid var(--p-accent-border)" }}>
                    Custom
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--p-text-3)" }}>{platform.lastSynced}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium flex-shrink-0"
            style={{ background: cfg.bg, color: cfg.color }}>
            <Icon size={10} className={platform.status === "syncing" ? "animate-spin" : ""} />
            {cfg.label}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px]" style={{ color: "var(--p-text-3)" }}>Entities</span>
          <span className="text-[22px] font-mono font-bold leading-none" style={{ color: "var(--p-text-1)" }}>{platform.entityCount}</span>
        </div>

        <div className="h-1 rounded-full mb-4" style={{ background: "var(--p-bg-border)" }}>
          <div className="h-full rounded-full"
            style={{ width: `${Math.min(100, (platform.entityCount / 50) * 100)}%`, background: color, opacity: 0.6 }} />
        </div>

        <div className="flex gap-2">
          <button onClick={() => onSync(platform.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "var(--p-bg-border)", color: "var(--p-text-3)", border: "1px solid var(--p-border-strong)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-iris)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--p-iris-border)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-3)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--p-border-strong)"; }}>
            <RefreshCw size={11} />
            Sync now
          </button>
          <button onClick={() => { setExpanded(!expanded); setTestResult(null); }}
            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: expanded ? "var(--p-iris-subtle)" : "var(--p-bg-main)",
              color: expanded ? "var(--p-iris)" : "var(--p-text-3)",
              border: `1px solid ${expanded ? "var(--p-iris-border)" : "var(--p-border)"}`,
            }}>
            <Settings2 size={11} />
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        </div>
      </div>

      {/* Expanded configure panel */}
      {expanded && (
        <div className="px-5 pb-5" style={{ borderTop: "1px solid var(--p-border)" }}>
          <div className="pt-4 space-y-4">

            {/* Host */}
            <Field label="Host URL" placeholder="https://..." value={host} onChange={setHost} />

            {/* Auth protocol selector */}
            <div>
              <label className="block text-[9px] uppercase tracking-wider mb-1.5 font-semibold" style={{ color: "var(--p-text-3)" }}>
                Auth Protocol
              </label>
              <div className="grid grid-cols-3 gap-1">
                {AUTH_PROTOCOLS.map((p) => (
                  <button key={p.value} onClick={() => { setAuthProtocol(p.value); setTestResult(null); }}
                    className="text-left px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all leading-tight"
                    style={{
                      background: authProtocol === p.value ? "var(--p-iris-subtle)" : "var(--p-bg-main)",
                      color: authProtocol === p.value ? "var(--p-iris)" : "var(--p-text-3)",
                      border: `1px solid ${authProtocol === p.value ? "var(--p-iris-border)" : "var(--p-border)"}`,
                    }}
                    title={p.desc}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="text-[9px] mt-1.5 font-mono" style={{ color: "var(--p-text-3)" }}>{proto.desc}</div>
            </div>

            {/* Dynamic auth fields */}
            <div className="p-3 rounded-xl space-y-2.5" style={{ background: "var(--p-bg-main)", border: "1px solid var(--p-border)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Shield size={10} style={{ color: "var(--p-iris)" }} />
                <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--p-iris)" }}>
                  {proto.label} credentials
                </span>
              </div>
              <AuthFields protocol={authProtocol} fields={fields} setField={setField} />
            </div>

            {/* TLS settings */}
            <div className="p-3 rounded-xl" style={{ background: "var(--p-bg-main)", border: "1px solid var(--p-border)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Shield size={10} style={{ color: "var(--p-text-3)" }} />
                <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--p-text-3)" }}>TLS / SSL</span>
              </div>
              <div className="space-y-1" style={{ borderTop: "1px solid var(--p-border)", paddingTop: 8 }}>
                <Toggle label="Verify SSL certificate" desc="Recommended for production" value={verifySSL} onChange={setVerifySSL} />
                <Toggle label="Skip hostname verification" desc="Useful for internal CAs" value={skipHostname} onChange={setSkipHostname} />
                <Toggle label="Custom CA certificate" desc="Override system trust store" value={customCA} onChange={setCustomCA} />
                {customCA && (
                  <div className="mt-2">
                    <TextArea label="CA Certificate (PEM)" placeholder="-----BEGIN CERTIFICATE-----" value={caValue} onChange={setCaValue} />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button onClick={handleTest} disabled={testing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all"
                style={{ background: "var(--p-iris-subtle)", color: "var(--p-iris)", border: "1px solid var(--p-iris-border)" }}>
                {testing ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                {testing ? "Testing…" : "Test connection"}
              </button>
              <button onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: saved ? "var(--p-green-subtle)" : "var(--p-iris)",
                  color: saved ? "var(--p-green)" : "var(--p-bg-deep)",
                  border: saved ? "1px solid rgba(52,211,153,0.3)" : "none",
                }}>
                {saved ? <CheckCircle size={11} /> : null}
                {saved ? "Saved!" : "Save"}
              </button>
            </div>

            {/* Test result */}
            {testResult && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium"
                style={{
                  background: testResult === "ok" ? "var(--p-green-subtle)" : "var(--p-red-subtle)",
                  border: `1px solid ${testResult === "ok" ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
                  color: testResult === "ok" ? "var(--p-green)" : "var(--p-red)",
                }}>
                {testResult === "ok"
                  ? <><CheckCircle size={12} /> Connection successful · {proto.label} auth accepted</>
                  : <><AlertCircle size={12} /> Auth failed · check {proto.label} credentials and host URL</>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Custom connector ────────────────────────────────────── */
interface CustomPlatform extends Platform {
  custom: true;
  description: string;
  entityType: string;
  syncSchedule: string;
}

const ENTITY_TYPES = [
  "Service", "API", "Database", "Application", "Repository",
  "Pipeline", "Container", "Topic", "Deployment", "Namespace", "Domain",
];

const SYNC_SCHEDULES = [
  { value: "5m",   label: "Every 5 minutes" },
  { value: "15m",  label: "Every 15 minutes" },
  { value: "1h",   label: "Every hour" },
  { value: "6h",   label: "Every 6 hours" },
  { value: "daily",label: "Daily" },
  { value: "manual", label: "Manual only" },
];

function CustomConnectorModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (c: CustomPlatform) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [entityType, setEntityType] = useState("Service");
  const [authProtocol, setAuthProtocol] = useState<AuthProtocol>("bearer");
  const [syncSchedule, setSyncSchedule] = useState("15m");
  const [fields, setFields] = useState<Record<string, string>>({});
  const setField = (k: string, v: string) => setFields((p) => ({ ...p, [k]: v }));
  const proto = AUTH_PROTOCOLS.find((p) => p.value === authProtocol)!;

  const handleSave = () => {
    if (!name.trim() || !baseUrl.trim()) return;
    const id = "custom_" + name.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
    onSave({
      id, name: name.trim(), description, entityCount: 0, status: "unknown",
      lastSynced: "never", host: baseUrl.trim(),
      custom: true, entityType, syncSchedule,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl flex flex-col"
        style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--p-border)" }}>
          <div>
            <div className="text-sm font-bold" style={{ color: "var(--p-text-1)", fontFamily: '"Syne", sans-serif' }}>
              Add Custom Connector
            </div>
            <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--p-text-3)" }}>
              Connect any REST API · CPT engine auto-resolves entities
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{ color: "var(--p-text-3)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--p-text-3)"; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Name + description */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Connector Name" placeholder="My Internal Platform" value={name} onChange={setName} />
            </div>
            <div className="col-span-2">
              <Field label="Description (optional)" placeholder="What this platform does" value={description} onChange={setDescription} />
            </div>
          </div>

          <Field label="Base URL" placeholder="https://api.myplatform.internal" value={baseUrl} onChange={setBaseUrl} />

          {/* Entity type */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider mb-1.5 font-semibold" style={{ color: "var(--p-text-3)" }}>
              Primary Entity Type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ENTITY_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setEntityType(t)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: entityType === t ? "var(--p-accent-subtle)" : "var(--p-bg-main)",
                    color: entityType === t ? "var(--p-accent)" : "var(--p-text-3)",
                    border: `1px solid ${entityType === t ? "var(--p-accent-border)" : "var(--p-border)"}`,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Sync schedule */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider mb-1.5 font-semibold" style={{ color: "var(--p-text-3)" }}>
              Sync Schedule
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SYNC_SCHEDULES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSyncSchedule(s.value)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: syncSchedule === s.value ? "var(--p-accent-subtle)" : "var(--p-bg-main)",
                    color: syncSchedule === s.value ? "var(--p-accent)" : "var(--p-text-3)",
                    border: `1px solid ${syncSchedule === s.value ? "var(--p-accent-border)" : "var(--p-border)"}`,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auth protocol */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider mb-1.5 font-semibold" style={{ color: "var(--p-text-3)" }}>
              Authentication Protocol
            </label>
            <div className="grid grid-cols-3 gap-1 mb-2">
              {AUTH_PROTOCOLS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => { setAuthProtocol(p.value); setFields({}); }}
                  className="text-left px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all leading-tight"
                  style={{
                    background: authProtocol === p.value ? "rgba(94,106,210,0.1)" : "var(--p-bg-main)",
                    color: authProtocol === p.value ? "var(--p-accent)" : "var(--p-text-3)",
                    border: `1px solid ${authProtocol === p.value ? "rgba(94,106,210,0.3)" : "var(--p-border)"}`,
                  }}
                  title={p.desc}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="text-[9px] font-mono mb-3" style={{ color: "var(--p-text-3)" }}>{proto.desc}</div>

            <div className="p-3 rounded-xl space-y-2.5" style={{ background: "var(--p-bg-main)", border: "1px solid var(--p-border)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Shield size={10} style={{ color: "var(--p-accent)" }} />
                <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--p-accent)" }}>
                  {proto.label} credentials
                </span>
              </div>
              <AuthFields protocol={authProtocol} fields={fields} setField={setField} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: "var(--p-bg-main)", color: "var(--p-text-2)", border: "1px solid var(--p-border)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !baseUrl.trim()}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: "var(--p-accent)", color: "#fff" }}
          >
            Add Connector
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function Connectors() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [customPlatforms, setCustomPlatforms] = useState<CustomPlatform[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["connectors"],
    queryFn: () => apiClient.get("/api/v1/connectors").then((r) => r.data),
    staleTime: 30_000, retry: false,
  });

  const { mutate: triggerSync } = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/v1/connectors/${id}/sync`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connectors"] }),
  });

  const basePlatforms: Platform[] = data?.platforms?.length ? data.platforms : MOCK_PLATFORMS;
  const builtInPlatforms: Platform[] = basePlatforms.find((p) => p.id === "sharepoint")
    ? basePlatforms
    : [...basePlatforms, { id: "sharepoint", name: "Microsoft SharePoint", entityCount: 0, status: "unknown" as const, lastSynced: "never", host: "https://acme.sharepoint.com" }];
  const platforms: Platform[] = [...builtInPlatforms, ...customPlatforms];
  const synced = platforms.filter((p) => p.status === "synced").length;
  const totalEntities = platforms.reduce((a, p) => a + p.entityCount, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {showModal && (
        <CustomConnectorModal
          onClose={() => setShowModal(false)}
          onSave={(c) => setCustomPlatforms((prev) => [...prev, c])}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--p-text-1)", fontFamily: '"Syne", sans-serif' }}>Connectors</h1>
          <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--p-text-3)" }}>Plug-and-play · 10 auth protocols · TLS · CPT-unified</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-mono font-bold" style={{ color: "var(--p-text-1)" }}>{totalEntities.toLocaleString()}</div>
            <div className="text-[10px]" style={{ color: "var(--p-text-3)" }}>total entities</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold" style={{ color: "var(--p-green)" }}>{synced}/{platforms.length}</div>
            <div className="text-[10px]" style={{ color: "var(--p-text-3)" }}>synced</div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "var(--p-accent)", color: "#fff", boxShadow: "0 0 20px rgba(94,106,210,0.3)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 28px rgba(94,106,210,0.5)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(94,106,210,0.3)"; }}
          >
            <Plus size={14} />
            Add Custom
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 px-4 py-3 rounded-xl" style={{ background: "var(--p-bg-card)", border: "1px solid var(--p-border)" }}>
        {(["synced", "syncing", "error"] as Status[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          const count = platforms.filter((p) => p.status === s).length;
          return (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
              <span className="text-[11px] font-mono" style={{ color: "var(--p-text-2)" }}>{count} {cfg.label.toLowerCase()}</span>
            </div>
          );
        })}
        <div className="ml-auto flex items-center gap-4 text-[10px] font-mono" style={{ color: "var(--p-text-3)" }}>
          <span>API Key · Bearer · Basic · OAuth2 · MS Graph · mTLS · AWS IAM · K8s SA · SAML · LDAP</span>
          <div className="flex items-center gap-1" style={{ color: "var(--p-iris)" }}>
            <Zap size={10} />
            CPT Engine active
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-44 rounded-xl animate-pulse" style={{ background: "var(--p-bg-card)" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {platforms.map((p) => (
            <ConnectorCard key={p.id} platform={p} onSync={triggerSync} />
          ))}
        </div>
      )}
    </div>
  );
}
