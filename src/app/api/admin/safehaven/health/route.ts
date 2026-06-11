import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import {
  getSafeHavenConfigSummary,
  validateSafeHavenEnvForRuntime,
  isSafeHavenConfigured,
} from "@/lib/providers/safehaven/config";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const summary = getSafeHavenConfigSummary();
  const missingRequired = validateSafeHavenEnvForRuntime();

  return NextResponse.json({
    ...summary,
    configured: isSafeHavenConfigured(),
    missingRequired,
    statusLabel:
      summary.status === "disabled"
        ? "Disabled"
        : summary.status === "configured"
          ? "Configured"
          : "Awaiting credentials",
  });
}
