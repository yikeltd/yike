import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function adminKeyCandidates(): string[] {
  return [
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    process.env.SUPABASE_SECRET_KEY?.trim(),
  ].filter((key): key is string => Boolean(key));
}

function supabaseUrl(): string | null {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    null
  );
}

/** Service-role client for trusted server operations only. */
export function createAdminClient(): SupabaseClient | null {
  const url = supabaseUrl();
  if (!url) return null;

  const keys = adminKeyCandidates();
  if (keys.length === 0) return null;

  return createClient(url, keys[0], {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Pick the first service key that can read a protected table (handles stale env keys). */
export async function createVerifiedAdminClient(): Promise<SupabaseClient | null> {
  const url = supabaseUrl();
  const keys = adminKeyCandidates();
  if (!url || keys.length === 0) return null;

  for (const key of keys) {
    const client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await client.from("profiles").select("id").limit(1);
    if (!error) return client;
    console.error("[supabase/admin] service key rejected:", error.message);
  }

  return null;
}

export function isAdminClientConfigured(): boolean {
  return Boolean(supabaseUrl() && adminKeyCandidates().length > 0);
}

