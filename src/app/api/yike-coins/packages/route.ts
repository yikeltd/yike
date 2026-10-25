import { NextResponse } from "next/server";
import { isYikeCoinsEnabled } from "@/lib/yike-coins/flags";
import { getYikeCoinTopupPackages } from "@/lib/yike-coins/topup-packages";
import { YIKE_COIN_NGN_NOMINAL } from "@/lib/yike-coins/constants";
import { isProductionEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  if (!isYikeCoinsEnabled()) {
    return NextResponse.json({ error: "Yike Coins are not available" }, { status: 503 });
  }

  const packages = getYikeCoinTopupPackages();

  return NextResponse.json({
    packages,
    nominalNgnPerCoin: YIKE_COIN_NGN_NOMINAL,
    pricingNote: isProductionEnv()
      ? "Top-up packs use the approved Yike catalog. Contact ops to change commercial pricing."
      : "Development/staging may override packs via YIKE_COIN_TOPUP_PACKS_NGN.",
  });
}
