import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isYikeCoinsEnabled } from "@/lib/yike-coins/flags";
import { getYikeCoinBalance } from "@/lib/yike-coins/ledger";

export const runtime = "nodejs";

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 50);

  const { data: entries, error } = await supabase
    .from("yike_coin_ledger")
    .select(
      "id, direction, amount_coins, balance_after, reason, reference, service_code, metadata, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const balanceCoins = await getYikeCoinBalance(user.id);

  return NextResponse.json({
    balanceCoins,
    entries: entries ?? [],
  });
}
