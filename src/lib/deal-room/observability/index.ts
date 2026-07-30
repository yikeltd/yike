export * from "./tracing";
export * from "./metrics";
export * from "./opentelemetry";
export * from "./dependency-health";
export * from "./prometheus";
export * from "./slo-engine";

export interface LogPayload {
  level: "info" | "warn" | "error" | "debug";
  message: string;
  traceId?: string;
  spanId?: string;
  workspaceId?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export class BTOSLogger {
  public static log(payload: LogPayload): void {
    const output = {
      timestamp: new Date().toISOString(),
      system: "BTOS",
      ...payload,
    };
    if (payload.level === "error") {
      console.error(JSON.stringify(output));
    } else {
      console.log(JSON.stringify(output));
    }
  }

  public static info(message: string, workspaceId?: string, traceId?: string): void {
    this.log({ level: "info", message, workspaceId, traceId });
  }

  public static error(message: string, workspaceId?: string, traceId?: string, metadata?: Record<string, unknown>): void {
    this.log({ level: "error", message, workspaceId, traceId, metadata });
  }
}
