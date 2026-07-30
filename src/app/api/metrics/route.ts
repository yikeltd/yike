import { NextResponse } from "next/server";
import { PrometheusMetricsExporter } from "@/lib/deal-room/observability/prometheus";

export const runtime = "nodejs";

/**
 * GET /api/metrics — Prometheus Exposition Endpoint (v0.0.4)
 */
export async function GET() {
  const metricsData = await PrometheusMetricsExporter.generateMetricsExposition();

  return new NextResponse(metricsData, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    },
  });
}
