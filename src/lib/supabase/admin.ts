import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function adminKeyCandidates(): string[] {
  return [
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    process.env.SUPABASE_SECRET_KEY?.trim(),
  ].filter((key): key is string => Boolean(key));
}

/** Service-role client for trusted server operations only. */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return null;

  const keys = adminKeyCandidates();
  if (keys.length === 0) return null;

  return createClient(url, keys[0], {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isAdminClientConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && adminKeyCandidates().length > 0
  );
}
