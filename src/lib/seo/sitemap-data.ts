import { createVerifiedAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isProductionEnv } from "@/lib/env";
import { MOCK_LISTINGS } from "@/lib/mock-listings";
import { propertyPublicSlug } from "@/lib/property-slugs";

function mockSitemapEntries(limit: number): SitemapPropertyEntry[] {
  if (isProductionEnv() || isSupabaseConfigured()) return [];
  return MOCK_LISTINGS.slice(0, limit).map((p) => ({
    path: propertyPublicSlug(p),
    updated_at: p.updated_at,
  }));
}

export type SitemapPropertyEntry = { path: string; updated_at?: string };

/** Build-safe property paths for sitemap (slug preferred). */
export async function getSitemapPropertyEntries(
  limit = 5000
): Promise<SitemapPropertyEntry[]> {
  if (!isSupabaseConfigured()) {
    return mockSitemapEntries(limit);
  }

  const admin = isAdminClientConfigured()
    ? await createVerifiedAdminClient()
    : null;
  if (!admin) {
    return mockSitemapEntries(limit);
  }

  const { data } = await admin
    .from("properties")
    .select("id, slug, updated_at")
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .order("updated_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as {
    id: string;
    slug: string | null;
    updated_at: string;
  }[];

  if (rows.length > 0) {
    return rows.map((r) => ({
      path: r.slug ?? r.id,
      updated_at: r.updated_at,
    }));
  }

  return mockSitemapEntries(limit);
}

/** @deprecated use getSitemapPropertyEntries */
export async function getSitemapPropertyIds(limit = 5000): Promise<string[]> {
  const entries = await getSitemapPropertyEntries(limit);
  return entries.map((e) => e.path);
}
