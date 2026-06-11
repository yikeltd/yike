import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingLeadType } from "@/lib/listing-leads/constants";

const BATCH_WINDOW_MS = 30 * 60_000;

export async function notifySellerNewLead(
  admin: SupabaseClient,
  params: {
    sellerId: string;
    leadId: string;
    leadType: ListingLeadType;
    listingTitle?: string | null;
  }
): Promise<void> {
  const since = new Date(Date.now() - BATCH_WINDOW_MS).toISOString();
  const { count } = await admin
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", params.sellerId)
    .eq("category", "listing_lead")
    .gte("created_at", since);

  if ((count ?? 0) >= 3) return;

  const typeLabel =
    params.leadType === "whatsapp"
      ? "WhatsApp inquiry"
      : params.leadType === "call"
        ? "Call tap"
        : params.leadType === "save"
          ? "Listing saved"
          : params.leadType === "follow"
            ? "New follower"
            : params.leadType === "verification_request"
              ? "Verification interest"
              : "New message";

  const listing = params.listingTitle?.trim();
  const body = listing
    ? `${typeLabel} on “${listing.slice(0, 50)}”.`
    : `${typeLabel} on your Yike profile.`;

  await admin.from("user_notifications").insert({
    recipient_user_id: params.sellerId,
    title: "New lead",
    body,
    action_url: "/agent/leads",
    category: "listing_lead",
    priority: params.leadType === "whatsapp" || params.leadType === "call" ? "normal" : "low",
  });
}
