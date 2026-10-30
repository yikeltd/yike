import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getYikeCoinBalance } from "@/lib/yike-coins/ledger";
import { isYikeCoinsEnabled } from "@/lib/yike-coins/flags";
import { getVideoCallPreflight } from "@/lib/video-calls/allowance";
import { YIKE_COIN_NGN_NOMINAL } from "@/lib/yike-coins/constants";
import { isDevYikeCoinTestCreditEnabled } from "@/lib/yike-coins/dev-test-credit";

export const runtime = "nodejs";

export async function GET() {
  if (!isYikeCoinsEnabled()) {
    return NextResponse.json({ error: "Yike Coins are not available" }, { status: 503 });
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

  const balanceCoins = await getYikeCoinBalance(user.id);
  const videoPreflight = await getVideoCallPreflight(user.id);

  return NextResponse.json({
    product: "Yike Coins",
    balanceCoins,
    nominalNgnPerCoin: YIKE_COIN_NGN_NOMINAL,
    videoCalls: videoPreflight,
    devTestCreditAvailable: isDevYikeCoinTestCreditEnabled(),
  });
}
