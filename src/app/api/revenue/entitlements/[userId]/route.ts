import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserEntitlements, hasEntitlement } from "@/lib/revenue/service";
import type { EntitlementKey } from "@/lib/revenue/types";
import { isValidUuid } from "@/lib/leads/validation";

export const runtime = "nodejs";

/**
 * GET /api/revenue/entitlements/[userId] — Query active entitlements for the signed-in user only.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const { userId } = await params;
    if (!isValidUuid(userId) || user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
