import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { creditYikeCoins } from "@/lib/yike-coins/ledger";
import { isYikeCoinsEnabled } from "@/lib/yike-coins/flags";
import {
  devYikeCoinTestCreditMaxPerRequest,
  isDevYikeCoinTestCreditEnabled,
} from "@/lib/yike-coins/dev-test-credit";
import { isProductionEnv } from "@/lib/env";

export const runtime = "nodejs";

type Body = {
  amountCoins?: number;
  reference?: string;
  reason?: string;
};

/**
 * Development-only self credit for the signed-in user.
 * Requires YIKE_DEV_COIN_TEST_CREDIT=true and non-production APP_ENV.
 */
export async function POST(request: Request) {
  if (isProductionEnv()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isDevYikeCoinTestCreditEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isYikeCoinsEnabled()) {
    return NextResponse.json(
      { error: "Enable Yike Coins in this environment first (ENABLE_YIKE_COINS=true)." },
      { status: 503 },
    );
  }

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

  let body: Body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const amountCoins = body.amountCoins;
  const reference = body.reference?.trim();
  const reason = body.reason?.trim() || "Development test credit";

  if (!reference) {
    return NextResponse.json({ error: "reference is required (unique per credit)" }, { status: 400 });
  }

  if (!Number.isInteger(amountCoins) || (amountCoins ?? 0) <= 0) {
    return NextResponse.json({ error: "amountCoins must be a positive integer" }, { status: 400 });
  }

  const max = devYikeCoinTestCreditMaxPerRequest();
  if ((amountCoins ?? 0) > max) {
    return NextResponse.json({ error: `Maximum ${max} coins per dev test credit` }, { status: 400 });
  }

  const result = await creditYikeCoins({
    userId: user.id,
    amountCoins: amountCoins!,
    reference: `DEV-${reference}`,
    idempotencyKey: `dev_test_credit:${user.id}:${reference}`,
    serviceCode: "wallet_topup",
    reason: `Dev test credit: ${reason}`,
    metadata: { source: "dev_test_credit_route" },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
  }

  return NextResponse.json({
    balanceAfter: result.balanceAfter,
    ledgerId: result.ledgerId,
    alreadyApplied: result.alreadyApplied,
  });
}
