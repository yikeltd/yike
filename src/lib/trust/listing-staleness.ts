import type { SupabaseClient } from "@supabase/supabase-js";

/** Archives listings past auto_archive_at — soft removal, admin can restore. */
export async function archiveDueListings(
  admin: SupabaseClient,
  limit = 80
): Promise<number> {
  const now = new Date().toISOString();

  const { data: rows } = await admin
    .from("properties")
    .select("id")
    .eq("status", "approved")
    .lte("auto_archive_at", now)
    .in("listing_activity_status", ["inactive", "stale"])
    .limit(limit);

  if (!rows?.length) return 0;

  const ids = rows.map((r) => r.id as string);
  await admin
    .from("properties")
    .update({
      status: "archived",
      listing_activity_status: "archived",
      updated_at: now,
    })
    .in("id", ids);

  return ids.length;
}
