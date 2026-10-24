import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { purchaseListingBoostWithYikeCoins } from "@/lib/yike-coins/boost-purchase";
import { formatCoinNairaEquivalent, formatYikeCoins } from "@/lib/yike-coins/constants";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await context.params;
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

  let body: { plan?: string; idempotencyKey?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const idempotencyKey = body.idempotencyKey?.trim();
  if (!idempotencyKey) {
    return NextResponse.json({ error: "idempotencyKey required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const result = await purchaseListingBoostWithYikeCoins(admin, {
    userId: user.id,
    listingId,
    plan: body.plan ?? "",
    idempotencyKey,
  });

  if (!result.ok) {
    const status =
      result.code === "insufficient_balance"
        ? 402
        : result.code === "not_found"
          ? 404
          : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({
    ok: true,
    promotionId: result.promotionId,
    priceCoins: result.priceCoins,
    balanceAfter: result.balanceAfter,
    display: {
      coins: formatYikeCoins(result.priceCoins),
      nominal: formatCoinNairaEquivalent(result.priceCoins),
    },
    alreadyApplied: result.alreadyApplied,
  });
}
