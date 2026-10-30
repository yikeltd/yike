import { createAdminClient } from "@/lib/supabase/admin";

const TRANSFERS_PER_HOUR = Number(process.env.YIKE_YC_TRANSFERS_PER_HOUR ?? "30");
const LOOKUPS_PER_MINUTE = Number(process.env.YIKE_USERNAME_LOOKUPS_PER_MINUTE ?? "40");

export async function isTransferRateLimited(senderId: string): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return true;

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("yike_coin_transfers")
    .select("id", { count: "exact", head: true })
    .eq("sender_id", senderId)
    .gte("created_at", since);

  if (error) return false;
  return (count ?? 0) >= TRANSFERS_PER_HOUR;
}

const lookupBuckets = new Map<string, { count: number; resetAt: number }>();

export function isUsernameLookupRateLimited(viewerId: string): boolean {
  const now = Date.now();
  const bucket = lookupBuckets.get(viewerId);
  if (!bucket || bucket.resetAt < now) {
    lookupBuckets.set(viewerId, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  bucket.count += 1;
  if (bucket.count > LOOKUPS_PER_MINUTE) return true;
  return false;
}

export const ADMIN_GRANT_MAX_COINS = Number(process.env.YIKE_ADMIN_GRANT_MAX_COINS ?? "50000");
