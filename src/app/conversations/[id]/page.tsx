import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isMarketplaceMessagingEnabled } from "@/lib/marketplace-messaging/service";
import { MarketplaceThread } from "./marketplace-thread";

export const metadata = {
  title: "Conversation | Yike",
  description: "Direct buyer and seller messaging on Yike.",
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isMarketplaceMessagingEnabled()) {
    redirect("/");
  }

  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) redirect(`/auth/login?next=/conversations/${id}`);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/conversations/${id}`);

  return <MarketplaceThread conversationId={id} currentUserId={user.id} />;
}
