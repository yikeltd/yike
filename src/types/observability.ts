export type SpanStatus = "ok" | "error" | "warn";

export type TraceSpan = {
  id: string;
  parentId?: string;
  service: string;
  operation: string;
  durationMs: number;
  status: SpanStatus;
  startTimeOffsetMs: number;
  details?: string;
};

export type TraceRecord = {
  traceId: string;
  requestId: string;
  timestamp: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  statusCode: number;
  totalDurationMs: number;
  userRole?: string;
  spans: TraceSpan[];
};

export type ServiceNode = {
  id: string;
  name: string;
  serviceType: "frontend" | "api" | "database" | "escrow" | "payments" | "webhooks";
  latencyMs: number;
  status: "operational" | "degraded" | "failing";
  errorRate: string;
  dependencies: string[];
};

export type LogLevel = "INFO" | "WARN" | "ERROR" | "CRITICAL";

export type LogEntry = {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: string;
  requestId: string;
  message: string;
  metadata?: Record<string, string | number | boolean>;
};

export type AlertRule = {
  id: string;
  name: string;
  targetService: string;
  condition: string;
  threshold: string;
  severity: "critical" | "warning" | "info";
  enabled: boolean;
  lastTriggered?: string;
};
