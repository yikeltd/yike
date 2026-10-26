import { NextResponse } from "next/server";
import { getOrCreateTrustIdentity } from "@/lib/identity/service";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { isValidUuid } from "@/lib/leads/validation";

export const runtime = "nodejs";

/**
 * GET /api/trust/passport/[userId] — Fetch complete Yike Passport & Trust Identity
 * Hidden unless passport launch flag is enabled.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!isLaunchFeatureVisible("passport_ui")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { userId } = await params;
    if (!isValidUuid(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const passport = await getOrCreateTrustIdentity(userId);
    return NextResponse.json({ passport });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch Yike Passport";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
