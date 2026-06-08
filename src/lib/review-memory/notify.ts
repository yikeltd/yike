import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReviewRequestType } from "./constants";
import { REVIEW_REQUEST_LABELS } from "./constants";

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
  const title = REVIEW_REQUEST_LABELS[input.requestType];
  const body = `${title}: ${input.message.slice(0, 200)}`;

  await client.from("user_notifications").insert({
    recipient_user_id: input.agentId,
    title: `Listing review — ${input.listingTitle}`,
    body,
    action_url: `/agent/listings/${input.listingId}/edit?review=${input.requestId}`,
    category: "listing_review",
  });
}
