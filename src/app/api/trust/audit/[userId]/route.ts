import { NextResponse } from "next/server";
import { generateTrustAuditReport } from "@/lib/identity/service";

export const runtime = "nodejs";

/**
 * GET /api/trust/audit/[userId] — Fetch transparent score audit report & breakdown
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const report = await generateTrustAuditReport(userId);
    return NextResponse.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate Trust Audit report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
