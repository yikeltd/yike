import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  isMarketplaceMessagingEnabled,
  listConversationsForUser,
} from "@/lib/marketplace-messaging/service";
import { MarketplaceInbox } from "./marketplace-inbox";
import { ConsumerSubpageHeader } from "@/components/layout/consumer-subpage-header";
import { consumerRoute } from "@/lib/navigation/consumer-routes";

export const metadata = {
  title: "Messages | Yike",
  description: "Buyer and seller conversations on Yike.",
};

export default async function ConversationsInboxPage() {
  if (!isMarketplaceMessagingEnabled()) {
    redirect("/");
  }

  const supabase = await createClient();
  if (!supabase) redirect("/auth/login?next=/conversations");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/conversations");

  const conversations = await listConversationsForUser(user.id);

  return (
    <div className="mx-auto max-w-2xl px-2 py-6 sm:px-4 lg:py-8">
      <ConsumerSubpageHeader
        title="Messages"
        subtitle="Conversations with sellers and buyers on Yike."
        backHref={consumerRoute("home")}
        backLabel="Back to home"
      />
      <div className="mb-4 flex justify-end">
        <a
          href={consumerRoute("wallet")}
          className="pressable rounded-xl border border-navy/10 bg-white px-3 py-2 text-xs font-bold text-navy"
        >
          Yike Coins wallet
        </a>
      </div>
      <MarketplaceInbox conversations={conversations} currentUserId={user.id} />
    </div>
  );
}
