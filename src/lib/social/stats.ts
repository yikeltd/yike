import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileSocialStats, PublicFollowProfile, FollowDirection } from "./types";

/** Service-role client for SECURITY DEFINER social RPCs (not callable by anon/authenticated). */
function socialRpcClient(fallback?: SupabaseClient | null): SupabaseClient | null {
  try {
    return createAdminClient();
  } catch {
    return fallback ?? null;
  }
}

export async function getProfileSocialStats(
  _client: SupabaseClient | null | undefined,
  userId: string
): Promise<ProfileSocialStats> {
  const client = socialRpcClient(_client);
  if (!client) {
    return { followersCount: 0, listingLikesCount: 0 };
  }

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
  _client: SupabaseClient | null | undefined,
  listingId: string
): Promise<number> {
  const client = socialRpcClient(_client);
  if (!client) return 0;

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
  _client: SupabaseClient | null | undefined,
  userId: string,
  direction: FollowDirection,
  limit = 50,
  offset = 0
): Promise<PublicFollowProfile[]> {
  const client = socialRpcClient(_client);
  if (!client) return [];

  const { data, error } = await client.rpc("get_public_follow_profiles", {
    p_user_id: userId,
    p_direction: direction,
    p_limit: limit,
    p_offset: offset,
  });

  if (error || !Array.isArray(data)) return [];
  return data as PublicFollowProfile[];
}

export async function getListingLikerProfiles(
  _client: SupabaseClient | null | undefined,
  ownerUserId: string,
  limit = 50,
  offset = 0
): Promise<PublicFollowProfile[]> {
  const client = socialRpcClient(_client);
  if (!client) return [];

  const safeLimit = Math.max(1, Math.min(limit, 100));
  const safeOffset = Math.max(offset, 0);

  const { data: listings, error: listingsError } = await client
    .from("properties")
    .select("id")
    .eq("agent_id", ownerUserId)
    .eq("status", "approved");

  if (listingsError || !listings?.length) return [];

  const listingIds = listings.map((row) => row.id as string);

  const { data: likes, error: likesError } = await client
    .from("listing_likes")
    .select("user_id, created_at")
    .in("listing_id", listingIds)
    .order("created_at", { ascending: false })
    .limit(500);

  if (likesError || !likes?.length) return [];

  const latestByUser = new Map<string, string>();
  for (const row of likes) {
    const userId = row.user_id as string;
    if (!latestByUser.has(userId)) {
      latestByUser.set(userId, row.created_at as string);
    }
  }

  const ranked = [...latestByUser.entries()]
    .sort((a, b) => (a[1] < b[1] ? 1 : -1))
    .slice(safeOffset, safeOffset + safeLimit);

  if (ranked.length === 0) return [];

  const userIds = ranked.map(([id]) => id);
  const { data: profiles, error: profilesError } = await client
    .from("profiles")
    .select(
      "id, full_name, username, avatar_url, account_type, public_slug, company_name, is_banned, profile_status"
    )
    .in("id", userIds);

  if (profilesError || !profiles?.length) return [];

  const byId = new Map(profiles.map((p) => [p.id as string, p]));

  return ranked
    .map(([id, likedAt]) => {
      const profile = byId.get(id);
      if (!profile) return null;
      if (profile.is_banned) return null;
      if (profile.profile_status === "deleted") return null;
      return {
        id: profile.id as string,
        full_name: (profile.full_name as string | null) ?? null,
        username: (profile.username as string | null) ?? null,
        avatar_url: (profile.avatar_url as string | null) ?? null,
        account_type: (profile.account_type as string | null) ?? null,
        public_slug: (profile.public_slug as string | null) ?? null,
        company_name: (profile.company_name as string | null) ?? null,
        followed_at: likedAt,
      } satisfies PublicFollowProfile;
    })
    .filter((p): p is PublicFollowProfile => Boolean(p));
}

export function formatSocialStatsLine(stats: ProfileSocialStats): string {
  const followers = stats.followersCount;
  const likes = stats.listingLikesCount;
  const followersLabel = followers === 1 ? "follower" : "followers";
  const likesLabel = likes === 1 ? "listing like" : "listing likes";
  return `${followers} ${followersLabel} · ${likes} ${likesLabel}`;
}
