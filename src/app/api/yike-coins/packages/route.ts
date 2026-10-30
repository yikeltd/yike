import { NextResponse } from "next/server";
import { isYikeCoinsEnabled } from "@/lib/yike-coins/flags";
import { getYikeCoinTopupPackages } from "@/lib/yike-coins/topup-packages";
import { YIKE_COIN_NGN_NOMINAL } from "@/lib/yike-coins/constants";
import { getWalletTopupCheckoutStatus } from "@/lib/payments/checkout-availability";

export const runtime = "nodejs";

export async function GET() {
  if (!isYikeCoinsEnabled()) {
    return NextResponse.json({ error: "Yike Coins are not available" }, { status: 503 });
  }

  const packages = getYikeCoinTopupPackages();
  const checkout = getWalletTopupCheckoutStatus();

  return NextResponse.json({
    packages,
    nominalNgnPerCoin: YIKE_COIN_NGN_NOMINAL,
    checkoutAvailable: checkout.available,
    checkoutMessage: checkout.message,
    checkoutReasonCode: checkout.reasonCode,
  });
}
