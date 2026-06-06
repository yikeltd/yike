import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { MOCK_LISTINGS } from "@/lib/mock-listings";

/** Build-safe property IDs for sitemap (no request cookies). */
export async function getSitemapPropertyIds(limit = 5000): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_LISTINGS.map((p) => p.id).slice(0, limit);
  }

  const admin = createAdminClient();
  if (!admin) {
    return MOCK_LISTINGS.map((p) => p.id).slice(0, limit);
  }

  const { data } = await admin
    .from("properties")
    .select("id")
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .order("updated_at", { ascending: false })
    .limit(limit);

  const ids = (data ?? []).map((r) => r.id as string);
  if (ids.length > 0) return ids;
  return MOCK_LISTINGS.map((p) => p.id).slice(0, limit);
}
