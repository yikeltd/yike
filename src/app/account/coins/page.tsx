import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isYikeCoinsEnabled } from "@/lib/yike-coins/flags";
import { formatCoinNairaEquivalent, formatYikeCoins } from "@/lib/yike-coins/constants";
import { YikeCoinsLedgerClient } from "./ledger-client";
import { getYikeCoinBalance } from "@/lib/yike-coins/ledger";
import { getVideoCallPreflight } from "@/lib/video-calls/allowance";
import { YikeCoinsTopupClient } from "./topup-client";

export const metadata = {
  title: "Yike Coins | Yike",
  description: "Top up and manage your Yike Coins balance.",
};

export default async function YikeCoinsAccountPage() {
  if (!isYikeCoinsEnabled()) {
    redirect("/profile");
  }

  const supabase = await createClient();
  if (!supabase) redirect("/auth/login?next=/account/coins");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account/coins");

  const balance = await getYikeCoinBalance(user.id);
  const video = await getVideoCallPreflight(user.id);

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-xl font-black text-navy">Yike Coins</h1>
      <p className="mt-1 text-sm text-navy/60">
        One balance for approved Yike services. {formatCoinNairaEquivalent(1).replace("1 ", "")}
      </p>

      <div className="mt-6 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Available balance</p>
        <p className="mt-1 text-3xl font-black text-navy">{formatYikeCoins(balance)}</p>
        <p className="mt-2 text-xs text-navy/55">{formatCoinNairaEquivalent(balance)}</p>
      </div>

      <div className="mt-4 rounded-2xl border border-navy/10 bg-surface/50 p-4 text-sm text-navy/80">
        <p className="font-semibold text-navy">Video calls today</p>
        <p className="mt-1">
          {video.freeAllowanceRemaining} of {video.freeAllowanceTotal} free connected video calls
          remaining.
        </p>
        <p className="mt-1 text-xs text-muted">{video.resetExplanation}</p>
        {video.billable && video.priceCoins != null ? (
          <p className="mt-2 text-xs">
            Additional calls: {formatYikeCoins(video.priceCoins)} each when configured.
          </p>
        ) : video.billable ? (
          <p className="mt-2 text-xs text-amber-800">Additional call pricing awaits approval.</p>
        ) : null}
      </div>

      <YikeCoinsTopupClient />

      <div className="mt-8">
        <h2 className="text-sm font-black text-navy">Transaction history</h2>
        <div className="mt-3">
          <YikeCoinsLedgerClient />
        </div>
      </div>

      <Link
        href="/payments/history"
        className="pressable mt-4 inline-block text-sm font-bold text-navy/70 underline-offset-2 hover:underline"
      >
        Paystack payment history
      </Link>

      <p className="mt-6 text-xs leading-relaxed text-navy/55">
        Yike Coins are platform credits for eligible services — not cash, not transferable, and not
        automatically redeemable. Payment provider fees may apply at checkout.
      </p>

      <Link href="/conversations" className="pressable mt-4 inline-block text-sm font-bold text-gold-dark">
        Open messages
      </Link>
    </main>
  );
}
