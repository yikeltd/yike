import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileSocialStats, PublicFollowProfile, FollowDirection } from "./types";

export async function getProfileSocialStats(
  client: SupabaseClient,
  userId: string
): Promise<ProfileSocialStats> {
  const { data, error } = await client.rpc("get_profile_social_stats", {
    p_user_id: userId,
  });

  if (error || !data || typeof data !== "object") {
    return { followersCount: 0, listingLikesCount: 0 };
  }

  const row = data as { followers_count?: number; listing_likes_count?: number };
  return {
    followersCount: Number(row.followers_count ?? 0),
    listingLikesCount: Number(row.listing_likes_count ?? 0),
  };
}

export async function getListingLikeCount(
  client: SupabaseClient,
  listingId: string
): Promise<number> {
  const { data, error } = await client.rpc("get_listing_like_count", {
    p_listing_id: listingId,
  });
  if (error) return 0;
  return Number(data ?? 0);
}

export async function getUserLikedListingIds(
  client: SupabaseClient,
  userId: string,
  listingIds: string[]
): Promise<Set<string>> {
  if (listingIds.length === 0) return new Set();
  const { data } = await client
    .from("listing_likes")
    .select("listing_id")
    .eq("user_id", userId)
    .in("listing_id", listingIds);
  return new Set((data ?? []).map((r) => r.listing_id as string));
}

export async function isFollowingUser(
  client: SupabaseClient,
  followerId: string,
  followedId: string
): Promise<boolean> {
  const { data } = await client
    .from("profile_follows")
    .select("id")
    .eq("follower_user_id", followerId)
    .eq("followed_user_id", followedId)
    .maybeSingle();
  return Boolean(data);
}

export async function getFollowProfiles(
  client: SupabaseClient,
  userId: string,
  direction: FollowDirection,
  limit = 50,
  offset = 0
): Promise<PublicFollowProfile[]> {
  const { data, error } = await client.rpc("get_public_follow_profiles", {
    p_user_id: userId,
    p_direction: direction,
    p_limit: limit,
    p_offset: offset,
  });

  if (error || !Array.isArray(data)) return [];
  return data as PublicFollowProfile[];
}

export function formatSocialStatsLine(stats: ProfileSocialStats): string {
  const followers = stats.followersCount;
  const likes = stats.listingLikesCount;
  const followersLabel = followers === 1 ? "follower" : "followers";
  const likesLabel = likes === 1 ? "listing like" : "listing likes";
  return `${followers} ${followersLabel} · ${likes} ${likesLabel}`;
}
