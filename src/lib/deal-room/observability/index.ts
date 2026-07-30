/**
 * Yike BTOS — Observability & Telemetry Framework (Milestone 5)
 * Structured logging with correlation IDs, latency tracking, & metrics.
 */

export interface LogPayload {
  level: "info" | "warn" | "error" | "debug";
  message: string;
  correlationId?: string;
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

  public static info(message: string, workspaceId?: string, correlationId?: string): void {
    this.log({ level: "info", message, workspaceId, correlationId });
  }

  public static error(message: string, workspaceId?: string, correlationId?: string, metadata?: Record<string, unknown>): void {
    this.log({ level: "error", message, workspaceId, correlationId, metadata });
  }
}
