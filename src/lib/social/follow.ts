import type { SupabaseClient } from "@supabase/supabase-js";
import { isFollowingUser } from "./stats";
import { isSocialRateLimited, logSocialAction } from "./rate-limit";
import { notifySellerFollowed } from "./notify";
import { captureListingLead } from "@/lib/listing-leads/capture";

export type FollowToggleResult =
  | { ok: true; following: boolean }
  | { ok: false; error: string; status: number };

export async function toggleProfileFollow(
  userClient: SupabaseClient,
  admin: SupabaseClient,
  params: {
    followerId: string;
    followedId: string;
    followerName: string;
  }
): Promise<FollowToggleResult> {
  if (params.followerId === params.followedId) {
    return { ok: false, error: "You cannot follow yourself.", status: 400 };
  }

  const already = await isFollowingUser(
    userClient,
    params.followerId,
    params.followedId
  );

  const action = already ? "unfollow" : "follow";
  if (await isSocialRateLimited(admin, params.followerId, action)) {
    return {
      ok: false,
      error: "Too many follow actions. Please wait a moment.",
      status: 429,
    };
  }

  if (already) {
    const { error } = await userClient
      .from("profile_follows")
      .delete()
      .eq("follower_user_id", params.followerId)
      .eq("followed_user_id", params.followedId);

    if (error) {
      return { ok: false, error: "Could not unfollow.", status: 500 };
    }

    await logSocialAction(admin, params.followerId, "unfollow");
    return { ok: true, following: false };
  }

  const { error } = await userClient.from("profile_follows").insert({
    follower_user_id: params.followerId,
    followed_user_id: params.followedId,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: true, following: true };
    }
    return { ok: false, error: "Could not follow.", status: 500 };
  }

  await logSocialAction(admin, params.followerId, "follow");
  await notifySellerFollowed(admin, {
    sellerId: params.followedId,
    followerId: params.followerId,
    followerName: params.followerName,
  });
  const { data: followedProfile } = await admin
    .from("profiles")
    .select("account_type")
    .eq("id", params.followedId)
    .single();
  const accountType = followedProfile?.account_type as string | undefined;
  void captureListingLead(admin, {
    sellerId: params.followedId,
    leadUserId: params.followerId,
    leadType: "follow",
    leadUserDisplay: params.followerName,
    profilePage:
      accountType === "agency" ? "agency" : accountType === "developer" ? "developer" : null,
  });

  return { ok: true, following: true };
}
