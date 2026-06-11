import type { SupabaseClient } from "@supabase/supabase-js";
import { isSocialRateLimited, logSocialAction } from "./rate-limit";
import { notifyListingLiked } from "./notify";
import { captureListingLead } from "@/lib/listing-leads/capture";

export type ListingLikeToggleResult =
  | { ok: true; liked: boolean; likeCount: number }
  | { ok: false; error: string; status: number };

export async function toggleListingLike(
  userClient: SupabaseClient,
  admin: SupabaseClient,
  params: {
    userId: string;
    listingId: string;
  }
): Promise<ListingLikeToggleResult> {
  const { data: listing } = await admin
    .from("properties")
    .select("id, title, agent_id, status")
    .eq("id", params.listingId)
    .maybeSingle();

  if (!listing || listing.status !== "approved") {
    return { ok: false, error: "Listing not available.", status: 404 };
  }

  const { data: existing } = await userClient
    .from("listing_likes")
    .select("id")
    .eq("user_id", params.userId)
    .eq("listing_id", params.listingId)
    .maybeSingle();

  const action = existing ? "unlike" : "like";
  if (await isSocialRateLimited(admin, params.userId, action)) {
    return {
      ok: false,
      error: "Too many like actions. Please wait a moment.",
      status: 429,
    };
  }

  if (existing) {
    const { error } = await userClient
      .from("listing_likes")
      .delete()
      .eq("user_id", params.userId)
      .eq("listing_id", params.listingId);

    if (error) {
      return { ok: false, error: "Could not remove like.", status: 500 };
    }

    await logSocialAction(admin, params.userId, "unlike");
  } else {
    const { error } = await userClient.from("listing_likes").insert({
      user_id: params.userId,
      listing_id: params.listingId,
    });

    if (error) {
      if (error.code === "23505") {
        const { data: count } = await admin.rpc("get_listing_like_count", {
          p_listing_id: params.listingId,
        });
        return { ok: true, liked: true, likeCount: Number(count ?? 0) };
      }
      return { ok: false, error: "Could not like listing.", status: 500 };
    }

    await logSocialAction(admin, params.userId, "like");
    if (listing.agent_id) {
      await notifyListingLiked(admin, {
        agentId: listing.agent_id,
        likerId: params.userId,
        listingId: params.listingId,
        listingTitle: listing.title ?? "your listing",
      });
      void captureListingLead(admin, {
        listingId: params.listingId,
        sellerId: listing.agent_id as string,
        leadUserId: params.userId,
        leadType: "save",
        listingTitle: listing.title ?? undefined,
      });
    }
  }

  const { data: count } = await admin.rpc("get_listing_like_count", {
    p_listing_id: params.listingId,
  });

  return {
    ok: true,
    liked: !existing,
    likeCount: Number(count ?? 0),
  };
}
