import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidUuid } from "@/lib/leads/validation";

const BLOCKED_LISTING_STATUS = new Set([
  "hidden",
  "archived",
  "rejected",
  "pending",
]);

const BLOCKED_AVAILABILITY = new Set(["hidden", "unavailable"]);

/**
 * Public metrics (views, contact clicks, client analytics) may only target
 * live property listings (same visibility rules as lead validation, without agent binding).
 */
export async function isApprovedListingForPublicMetrics(
  admin: SupabaseClient,
  listingId: string
): Promise<boolean> {
  if (!isValidUuid(listingId)) return false;

  const { data } = await admin
    .from("properties")
    .select("id, status, availability_status, expires_at")
    .eq("id", listingId)
    .maybeSingle();

  if (!data?.id) return false;
  if (BLOCKED_LISTING_STATUS.has(String(data.status))) return false;
  if (BLOCKED_AVAILABILITY.has(String(data.availability_status))) return false;
  if (data.expires_at && new Date(String(data.expires_at)) <= new Date()) return false;

  return true;
}
