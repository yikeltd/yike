import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isYikeCoinsEnabled } from "@/lib/yike-coins/flags";
import { YcAmount } from "@/components/yike-coins/yc-amount";
import { YikeCoinsLedgerClient } from "./ledger-client";
import { getYikeCoinBalance } from "@/lib/yike-coins/ledger";
import { getVideoCallPreflight } from "@/lib/video-calls/allowance";
import { YikeCoinsTopupClient } from "./topup-client";
import { WalletUsernameSection } from "./wallet-username-section";
import { SendYcClient } from "./send-yc-client";
import { normalizeUsername } from "@/lib/username/rules";
import { ConsumerSubpageHeader } from "@/components/layout/consumer-subpage-header";
import { WalletBalanceLive } from "@/components/yike-coins/wallet-balance-live";
import { consumerRoute } from "@/lib/navigation/consumer-routes";
import { YikeCoinsNonCashNotice } from "@/components/yike-coins/non-cash-notice";

export const metadata = {
  title: "Yike Coins | Yike",
  description: "Top up and manage your Yike Coins balance.",
};

export default async function YikeCoinsAccountPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/auth/login?next=/account/coins");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account/coins");

  if (!isYikeCoinsEnabled()) {
    redirect(consumerRoute("profile"));
  }

  const balance = await getYikeCoinBalance(user.id);
  const video = await getVideoCallPreflight(user.id);

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  const username = profileRow?.username ? normalizeUsername(profileRow.username) : null;
  const hasUsername = Boolean(username && username.length >= 3);

  return (
    <div className="mx-auto w-full max-w-lg px-1 py-6 sm:px-2 lg:py-8">
      <ConsumerSubpageHeader
        title="Yike Coins wallet"
        subtitle="1 YC ≈ ₦1 nominal on eligible services."
        backHref={consumerRoute("home")}
        backLabel="Back to home"
      />

      <WalletUsernameSection
        initialUsername={hasUsername ? username : null}
        initialNeedsUsername={!hasUsername}
      />

      <YikeCoinsNonCashNotice className="mb-4" />

      <WalletBalanceLive initialBalance={balance} />

      <nav
        className="mt-4 grid grid-cols-3 gap-2 text-center"
        aria-label="Wallet actions"
      >
        <a
          href="#wallet-top-up"
          className="pressable rounded-xl border border-navy/10 bg-white px-2 py-2.5 text-[11px] font-bold text-navy"
        >
          Top up YC
        </a>
        <a
          href="#wallet-share"
          className="pressable rounded-xl border border-navy/10 bg-white px-2 py-2.5 text-[11px] font-bold text-navy"
        >
          Share YC
        </a>
        <a
          href="#wallet-history"
          className="pressable rounded-xl border border-navy/10 bg-white px-2 py-2.5 text-[11px] font-bold text-navy"
        >
          History
        </a>
      </nav>

      <div className="mt-4 rounded-2xl border border-navy/10 bg-surface/50 p-4 text-sm text-navy/80">
        <p className="font-semibold text-navy">Video calls today</p>
        <p className="mt-1">
          {video.freeAllowanceRemaining} of {video.freeAllowanceTotal} free connected calls left.
        </p>
        <p className="mt-1 text-xs text-muted">{video.resetExplanation}</p>
        {video.billable && video.priceCoins != null ? (
          <p className="mt-2 text-xs">
            After free allowance: <YcAmount amount={video.priceCoins} /> per call.
          </p>
        ) : video.billable ? (
          <p className="mt-2 text-xs text-amber-800">Extra call pricing is pending approval.</p>
        ) : null}
      </div>

      <div id="wallet-top-up">
        <YikeCoinsTopupClient />
      </div>

      <div id="wallet-share">
        <SendYcClient balanceCoins={balance} hasUsername={hasUsername} />
      </div>

      <div id="wallet-history" className="mt-8">
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

      <YikeCoinsNonCashNotice className="mt-6" />
      <p className="mt-3 text-xs leading-relaxed text-navy/55">
        Sending YC requires a username. Paystack fees may apply at checkout.
      </p>
    </div>
  );
}
