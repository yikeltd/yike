import { NextResponse } from "next/server";
import { getOrCreateTrustIdentity } from "@/lib/identity/service";

export const runtime = "nodejs";

/**
 * GET /api/trust/passport/[userId] — Fetch complete Yike Passport & Trust Identity
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const passport = await getOrCreateTrustIdentity(userId);
    return NextResponse.json({ passport });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch Yike Passport";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
