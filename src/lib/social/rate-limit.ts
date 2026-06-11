import type { SupabaseClient } from "@supabase/supabase-js";

export type SocialActionType = "follow" | "unfollow" | "like" | "unlike";

const LIMITS: Record<SocialActionType, { max: number; windowMs: number }> = {
  follow: { max: 30, windowMs: 60 * 60 * 1000 },
  unfollow: { max: 30, windowMs: 60 * 60 * 1000 },
  like: { max: 60, windowMs: 60 * 60 * 1000 },
  unlike: { max: 60, windowMs: 60 * 60 * 1000 },
};

export async function logSocialAction(
  admin: SupabaseClient,
  userId: string,
  actionType: SocialActionType
): Promise<void> {
  await admin.from("social_action_events").insert({
    user_id: userId,
    action_type: actionType,
  });
}

export async function isSocialRateLimited(
  admin: SupabaseClient,
  userId: string,
  actionType: SocialActionType
): Promise<boolean> {
  const rule = LIMITS[actionType];
  const since = new Date(Date.now() - rule.windowMs).toISOString();
  const { count } = await admin
    .from("social_action_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action_type", actionType)
    .gte("created_at", since);

  return (count ?? 0) >= rule.max;
}
