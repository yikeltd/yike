export type MetricStatus = "healthy" | "warning" | "critical";

export type SystemHealthMetric = {
  id: string;
  name: string;
  category: "infrastructure" | "database" | "queue" | "cache";
  currentValue: string;
  threshold: string;
  status: MetricStatus;
  unit: string;
};

export type ThirdPartyServiceStatus = {
  id: string;
  serviceName: string;
  category: "payments" | "notifications" | "escrow" | "identity";
  status: "operational" | "degraded" | "outage";
  latencyMs: number;
  provider: string;
};

export type ActiveAlert = {
  id: string;
  title: string;
  severity: "info" | "warning" | "error" | "critical";
  source: string;
  triggeredAt: string;
  acknowledged: boolean;
};

export type IncidentRecord = {
  id: string;
  title: string;
  severity: "major" | "minor";
  impact: string;
  status: "resolved" | "investigating" | "monitoring";
  resolvedAt: string;
  rootCause: string;
};

export type UptimeSlaMetric = {
  targetUptime: string;
  actualUptime30d: string;
  actualUptime90d: string;
  p95LatencyMs: number;
  p99LatencyMs: number;
  totalRequestsToday: number;
};
