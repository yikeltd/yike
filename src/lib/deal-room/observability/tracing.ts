/**
 * Yike BTOS — Observability & Distributed Tracing Engine (Milestone 5)
 * Traces end-to-end transaction operations across domain boundaries & sagas.
 */

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  workspaceId?: string;
  actorId?: string;
  startTimeMs: number;
  endTimeMs?: number;
  durationMs?: number;
  status: "ok" | "error";
  errorDetails?: string;
  attributes: Record<string, unknown>;
}

export class BTOSTracer {
  private static instance: BTOSTracer;
  private activeSpans: Map<string, TraceSpan> = new Map();
  private completedSpans: TraceSpan[] = [];

  public static getInstance(): BTOSTracer {
    if (!BTOSTracer.instance) {
      BTOSTracer.instance = new BTOSTracer();
    }
    return BTOSTracer.instance;
  }

  /**
   * Starts a new trace span with correlation IDs
   */
  public startSpan(
    name: string,
    workspaceId?: string,
    actorId?: string,
    parentSpanId?: string
  ): TraceSpan {
    const traceId = `trc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const spanId = `spn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const span: TraceSpan = {
      traceId,
      spanId,
      parentSpanId,
      name,
      workspaceId,
      actorId,
      startTimeMs: Date.now(),
      status: "ok",
      attributes: {},
    };

    this.activeSpans.set(spanId, span);
    return span;
  }

  /**
   * Ends a trace span and records execution duration
   */
  public endSpan(spanId: string, status: "ok" | "error" = "ok", errorDetails?: string): TraceSpan | undefined {
    const span = this.activeSpans.get(spanId);
    if (!span) return undefined;

    span.endTimeMs = Date.now();
    span.durationMs = span.endTimeMs - span.startTimeMs;
    span.status = status;
    span.errorDetails = errorDetails;

    this.activeSpans.delete(spanId);
    this.completedSpans.push(span);

    // Limit memory trace buffer
    if (this.completedSpans.length > 1000) {
      this.completedSpans.shift();
    }

    return span;
  }

  /**
   * Executes an async operation wrapped in a trace span
   */
  public async traceOperation<T>(
    name: string,
    workspaceId: string | undefined,
    operation: (span: TraceSpan) => Promise<T>
  ): Promise<T> {
    const span = this.startSpan(name, workspaceId);
    try {
      const result = await operation(span);
      this.endSpan(span.spanId, "ok");
      return result;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.endSpan(span.spanId, "error", errMsg);
      throw err;
    }
  }

  public getTraceHistory(workspaceId?: string): TraceSpan[] {
    return this.completedSpans.filter((s) => !workspaceId || s.workspaceId === workspaceId);
  }
}

export const btosTracer = BTOSTracer.getInstance();
