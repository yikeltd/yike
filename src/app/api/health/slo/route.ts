import { NextResponse } from "next/server";
import { BTOSSLOEngine } from "@/lib/deal-room/observability/slo-engine";

export const runtime = "nodejs";

/**
 * GET /api/health/slo — Service Level Objectives & Error Budget Endpoint
 */
export async function GET() {
  const report = BTOSSLOEngine.getSLOReport();
  return NextResponse.json(report, { status: 200 });
}
