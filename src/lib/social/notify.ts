import type { SupabaseClient } from "@supabase/supabase-js";
import { agentPublicPath } from "@/lib/agent-slugs";

export async function notifySellerFollowed(
  admin: SupabaseClient,
  params: {
    sellerId: string;
    followerId: string;
    followerName: string;
  }
): Promise<void> {
  if (params.sellerId === params.followerId) return;

  const name = params.followerName.trim() || "Someone";
  await admin.from("user_notifications").insert({
    recipient_user_id: params.sellerId,
    title: "New follower",
    body: `${name} started following you on Yike.`,
    action_url: "/agent/followers",
    category: "social_follow",
    priority: "normal",
  });
}

export async function notifyListingLiked(
  admin: SupabaseClient,
  params: {
    agentId: string;
    likerId: string;
    listingId: string;
    listingTitle: string;
  }
): Promise<void> {
  if (params.agentId === params.likerId) return;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", params.agentId)
    .eq("category", "listing_like")
    .gte("created_at", since)
    .ilike("body", `%${params.listingTitle.slice(0, 40)}%`);

  if ((count ?? 0) > 0) return;

  await admin.from("user_notifications").insert({
    recipient_user_id: params.agentId,
    title: "Listing liked",
    body: `Someone liked your listing “${params.listingTitle.slice(0, 60)}”.`,
    action_url: `/agent/listings/${params.listingId}/edit`,
    category: "listing_like",
    priority: "low",
  });
}

export function publicProfilePath(profile: {
  id: string;
  public_slug?: string | null;
}): string {
  return agentPublicPath(profile);
}
