import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function supabaseUrl(): string | null {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    null
  );
}

function publicKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    null
  );
}

/** Anon/publishable client for public API routes (signup, OTP, careers, etc.). */
export function createPublicClient(): SupabaseClient | null {
  const url = supabaseUrl();
  const key = publicKey();
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
