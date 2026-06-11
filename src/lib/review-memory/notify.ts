import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReviewRequestType } from "./constants";

export async function notifyAgentReviewRequest(
  client: SupabaseClient,
  input: {
    agentId: string;
    listingId: string;
    listingTitle: string;
    requestType: ReviewRequestType;
    message: string;
    requestId: string;
  }
): Promise<void> {
  try {
    await client.from("user_notifications").insert({
      recipient_user_id: input.agentId,
      title: `Update needed — ${input.listingTitle}`,
      body: "Your listing needs a few edits before approval.",
      action_url: `/agent/listings/${input.listingId}/edit?review=${input.requestId}`,
      category: "listing_review",
      priority: "normal",
    });
  } catch {
    // Notification is best-effort — edit request row is already saved.
  }
}
