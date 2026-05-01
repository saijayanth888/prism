export interface GraphNode {
  id: string;
  label: string;
  entityType: EntityType;
  platform: string;
  namespace?: string;
  environment?: string;
  healthScore?: number;
  complianceScore?: number;
  properties?: Record<string, unknown>;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationshipType: RelationshipType;
  platform: string;
  confidence: number;
  properties?: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "iris" | "system";
  text: string;
  citations?: string[];
  toolsUsed?: string[];
  confidence?: number;
  timestamp: string;
}

export interface MetricCard {
  label: string;
  value: string | number;
  trend?: number;
  trendDirection?: "up" | "down" | "neutral";
}

export interface Platform {
  name: string;
  entityCount: number;
  status: "synced" | "syncing" | "error" | "unknown";
  lastSynced?: string;
}

export type Persona =
  | "developer"
  | "product_owner"
  | "sre"
  | "auditor"
  | "executive";

export type EntityType =
  | "Application"
  | "Service"
  | "API"
  | "Deployment"
  | "Container"
  | "Repository"
  | "Pipeline"
  | "Image"
  | "Namespace"
  | "Topic"
  | "Database"
  | "Secret"
  | "Policy"
  | "Vulnerability"
  | "Environment"
  | "Domain"
  | "Team";

export type RelationshipType =
  | "DEPENDS_ON"
  | "DEPLOYED_TO"
  | "EXPOSES"
  | "CONSUMES"
  | "BUILT_FROM"
  | "RUNS_IN"
  | "PUBLISHES_TO"
  | "SUBSCRIBES_TO"
  | "OWNS"
  | "BELONGS_TO"
  | "SCANNED_BY"
  | "HAS_VULNERABILITY"
  | "ENFORCES"
  | "STORED_IN"
  | "USES_SECRET"
  | "GATEWAY_FOR";

export const ENTITY_TYPE_COLORS: Record<EntityType, string> = {
  API: "#3B82F6",
  Service: "#10B981",
  Database: "#8B5CF6",
  Topic: "#F59E0B",
  Container: "#EF6C00",
  Repository: "#64748B",
  Secret: "#EC4899",
  Deployment: "#6366F1",
  Pipeline: "#22C55E",
  Application: "#06B6D4",
  Image: "#8B5CF6",
  Namespace: "#94A3B8",
  Policy: "#F97316",
  Vulnerability: "#EF4444",
  Environment: "#84CC16",
  Domain: "#A78BFA",
  Team: "#FB923C",
};
