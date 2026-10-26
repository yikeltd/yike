import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isYikeCoinsEnabled } from "@/lib/yike-coins/flags";
import { getYikeCoinBalance } from "@/lib/yike-coins/ledger";
import { getVideoCallPreflight } from "@/lib/video-calls/allowance";
import { normalizeUsername } from "@/lib/username/rules";
import { consumerRoute } from "@/lib/navigation/consumer-routes";
import {
  parseWalletFromParam,
  resolveWalletBackNavigation,
  walletAuthLoginPath,
} from "@/lib/navigation/account-routes";
import { WalletPageExperience } from "@/components/yike-coins/wallet-page-experience";

export const metadata = {
  title: "Yike Coins | Yike",
  description: "Top up and manage your Yike Coins balance.",
};

export default async function YikeCoinsAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from: fromRaw } = await searchParams;
  const walletFrom = parseWalletFromParam(fromRaw);
  const loginNext = walletAuthLoginPath(
    walletFrom ? { from: walletFrom } : undefined,
  );

  const supabase = await createClient();
  if (!supabase) redirect(loginNext);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(loginNext);

  if (!isYikeCoinsEnabled()) {
    redirect(consumerRoute("profile"));
  }

  const balance = await getYikeCoinBalance(user.id);
  const video = await getVideoCallPreflight(user.id);

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("username, role")
    .eq("id", user.id)
    .maybeSingle();
  const username = profileRow?.username ? normalizeUsername(profileRow.username) : null;
  const hasUsername = Boolean(username && username.length >= 3);
  const backNav = resolveWalletBackNavigation({
    from: walletFrom,
    profile: profileRow ? { role: profileRow.role } : null,
  });

  return (
    <WalletPageExperience
      backNav={backNav}
      initialBalance={balance}
      video={video}
      initialUsername={hasUsername ? username : null}
      initialNeedsUsername={!hasUsername}
      hasUsername={hasUsername}
    />
  );
}
