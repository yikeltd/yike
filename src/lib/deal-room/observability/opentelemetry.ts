/**
 * Yike BTOS — OpenTelemetry Tracing Integration (Enterprise Enhancement 3)
 * W3C Trace Context propagation & OTel standard span format for Grafana Tempo / Jaeger compatibility.
 */

export interface OTelSpanContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
  isRemote?: boolean;
}

export interface OTelSpan {
  context: OTelSpanContext;
  parentSpanId?: string;
  name: string;
  kind: "INTERNAL" | "SERVER" | "CLIENT" | "PRODUCER" | "CONSUMER";
  startTimeUnixNano: number;
  endTimeUnixNano?: number;
  status: { code: "UNSET" | "OK" | "ERROR"; message?: string };
  attributes: Record<string, string | number | boolean>;
}

export class BTOSOpenTelemetryTracer {
  private static instance: BTOSOpenTelemetryTracer;
  private activeOTelSpans: Map<string, OTelSpan> = new Map();
  private exportedSpansBuffer: OTelSpan[] = [];

  public static getInstance(): BTOSOpenTelemetryTracer {
    if (!BTOSOpenTelemetryTracer.instance) {
      BTOSOpenTelemetryTracer.instance = new BTOSOpenTelemetryTracer();
    }
    return BTOSOpenTelemetryTracer.instance;
  }

  /**
   * Generates a 16-byte hex traceId and 8-byte hex spanId matching W3C Trace Context spec
   */
  public createOTelSpan(
    name: string,
    kind: OTelSpan["kind"] = "INTERNAL",
    parentContext?: OTelSpanContext
  ): OTelSpan {
    const traceId = parentContext?.traceId || this.generateHex(32);
    const spanId = this.generateHex(16);

    const span: OTelSpan = {
      context: {
        traceId,
        spanId,
        traceFlags: 1, // Sampled
      },
      parentSpanId: parentContext?.spanId,
      name,
      kind,
      startTimeUnixNano: Date.now() * 1_000_000,
      status: { code: "UNSET" },
      attributes: {
        "service.name": "yike-btos",
        "service.version": "1.0.0",
      },
    };

    this.activeOTelSpans.set(spanId, span);
    return span;
  }

  public endOTelSpan(spanId: string, isError = false, errorMessage?: string): OTelSpan | undefined {
    const span = this.activeOTelSpans.get(spanId);
    if (!span) return undefined;

    span.endTimeUnixNano = Date.now() * 1_000_000;
    span.status = isError
      ? { code: "ERROR", message: errorMessage }
      : { code: "OK" };

    this.activeOTelSpans.delete(spanId);
    this.exportedSpansBuffer.push(span);

    if (this.exportedSpansBuffer.length > 500) {
      this.exportedSpansBuffer.shift();
    }

    return span;
  }

  /**
   * Formats trace context as W3C `traceparent` HTTP header
   * Format: `00-{traceId}-{spanId}-01`
   */
  public formatW3CTraceParent(context: OTelSpanContext): string {
    return `00-${context.traceId}-${context.spanId}-01`;
  }

  public getExportedSpans(): OTelSpan[] {
    return [...this.exportedSpansBuffer];
  }

  private generateHex(length: number): string {
    let result = "";
    const characters = "0123456789abcdef";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
}

export const otelTracer = BTOSOpenTelemetryTracer.getInstance();
