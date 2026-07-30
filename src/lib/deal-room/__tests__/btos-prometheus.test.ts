/**
 * Yike BTOS — Prometheus Metrics Export Automated Test Suite (Enterprise Enhancement 4)
 * Tests Prometheus text exposition generation & incoming W3C traceparent header import.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { PrometheusMetricsExporter } from "../observability/prometheus";
import { otelTracer } from "../observability/opentelemetry";

test("Prometheus Exposition Text Format Test", async () => {
  const exposition = await PrometheusMetricsExporter.generateMetricsExposition();
  assert.ok(exposition.includes("# HELP btos_active_workspaces_total"));
  assert.ok(exposition.includes("# TYPE btos_sagas_completed_total counter"));
  assert.ok(exposition.includes("btos_health_status"));
});

test("W3C Incoming Traceparent Header Parsing Test", () => {
  const incomingHeader = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
  const parsedContext = otelTracer.parseW3CTraceParent(incomingHeader);

  assert.ok(parsedContext);
  assert.equal(parsedContext?.traceId, "4bf92f3577b34da6a3ce929d0e0e4736");
  assert.equal(parsedContext?.spanId, "00f067aa0ba902b7");
  assert.equal(parsedContext?.isRemote, true);

  const importedSpan = otelTracer.createOTelSpan("Imported Upstream Request", "SERVER", parsedContext);
  assert.equal(importedSpan.context.traceId, "4bf92f3577b34da6a3ce929d0e0e4736");
  assert.equal(importedSpan.parentSpanId, "00f067aa0ba902b7");
});
