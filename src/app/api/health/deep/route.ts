import { NextResponse } from "next/server";
import { DependencyHealthMonitor } from "@/lib/deal-room/observability/dependency-health";

export const runtime = "nodejs";

/**
 * GET /api/health/deep — Enterprise Health & Dependency Monitoring Endpoint
 */
export async function GET() {
  const report = await DependencyHealthMonitor.runFullHealthAudit();
  const statusCode = report.overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(report, { status: statusCode });
}
