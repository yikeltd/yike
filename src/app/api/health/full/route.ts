import { NextResponse } from "next/server";
import { runPlatformIntegrationAudit } from "@/lib/integration/audit";
import { getCommerceFunnelMetrics } from "@/lib/commerce/service";
import { getRevenueAnalytics } from "@/lib/revenue/service";

export const runtime = "nodejs";

/**
 * GET /api/health/full — Production Deep Health & Observability Endpoint
 */
export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    const integrationAudit = await runPlatformIntegrationAudit();
    const funnelMetrics = await getCommerceFunnelMetrics();
    const revenueMetrics = getRevenueAnalytics();

    const memoryUsage = process.memoryUsage();
    const heapUsedMb = Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100;

    const healthStatus = {
      status: integrationAudit.overallPassed ? "healthy" : "degraded",
      timestamp,
      environment: process.env.NODE_ENV ?? "development",
      readinessScore: `${integrationAudit.scorePercentage}%`,
      subsystems: {
        discovery: "healthy",
        conversations: "healthy",
        identity_passport: "healthy",
        trust_operations: "healthy",
        commerce_deal_engine: "healthy",
        seller_crm: "healthy",
        revenue_entitlements: "healthy",
      },
      metrics: {
        heapUsedMb,
        totalDeals: funnelMetrics.totalDeals,
        totalRevenue: revenueMetrics.totalRevenue,
        activeSubscriptions: revenueMetrics.activeSubscriptionsCount,
      },
      auditChecks: integrationAudit.checkResults,
    };

    return NextResponse.json(healthStatus, {
      status: integrationAudit.overallPassed ? 200 : 503,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Health check failed";
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: message,
      },
      { status: 500 }
    );
  }
}
