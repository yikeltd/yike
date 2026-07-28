import { NextResponse } from "next/server";
import { getUserEntitlements, hasEntitlement } from "@/lib/revenue/service";
import type { EntitlementKey } from "@/lib/revenue/types";

export const runtime = "nodejs";

/**
 * GET /api/revenue/entitlements/[userId] — Query active entitlements for user
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(req.url);
    const keyParam = searchParams.get("key") as EntitlementKey | null;

    if (keyParam) {
      const active = hasEntitlement(userId, keyParam);
      return NextResponse.json({ userId, key: keyParam, hasEntitlement: active });
    }

    const entitlements = getUserEntitlements(userId);
    return NextResponse.json({ userId, entitlements });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to query entitlements";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
