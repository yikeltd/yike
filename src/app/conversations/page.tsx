import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  isMarketplaceMessagingEnabled,
  listConversationsForUser,
} from "@/lib/marketplace-messaging/service";
import { MarketplaceInbox } from "./marketplace-inbox";

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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-black text-navy">Messages</h1>
      <p className="mt-1 text-sm text-navy/60">Secure Yike conversations with sellers and buyers.</p>
      <div className="mt-6">
        <MarketplaceInbox conversations={conversations} currentUserId={user.id} />
      </div>
    </main>
  );
}
