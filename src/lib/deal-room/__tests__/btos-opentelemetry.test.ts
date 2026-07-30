/**
 * Yike BTOS — OpenTelemetry Integration Automated Test Suite (Enterprise Enhancement 3)
 * Tests OTel span generation, parent-child span linking, & W3C traceparent formatting.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { otelTracer } from "../observability/opentelemetry";

test("OpenTelemetry Span Creation & W3C Traceparent Header Test", () => {
  const rootSpan = otelTracer.createOTelSpan("HTTP GET /api/deals", "SERVER");
  assert.equal(rootSpan.context.traceId.length, 32);
  assert.equal(rootSpan.context.spanId.length, 16);

  const traceparent = otelTracer.formatW3CTraceParent(rootSpan.context);
  assert.ok(traceparent.startsWith("00-"));
  assert.ok(traceparent.endsWith("-01"));

  // Child Span Propagation
  const childSpan = otelTracer.createOTelSpan("Database Query btos_sagas", "CLIENT", rootSpan.context);
  assert.equal(childSpan.context.traceId, rootSpan.context.traceId);
  assert.equal(childSpan.parentSpanId, rootSpan.context.spanId);

  otelTracer.endOTelSpan(childSpan.context.spanId, false);
  otelTracer.endOTelSpan(rootSpan.context.spanId, false);

  const exported = otelTracer.getExportedSpans();
  assert.ok(exported.length >= 2);
});
