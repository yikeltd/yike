import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET_MAP: Record<string, string> = {
  legal: "legal-verification-docs",
  verifier: "verifier-report-media",
};

export async function createTrustMediaSignedUrl(
  client: SupabaseClient,
  params: { bucket: keyof typeof BUCKET_MAP | string; path: string; expiresIn?: number }
): Promise<{ url: string | null; error?: string }> {
  const bucketId = BUCKET_MAP[params.bucket] ?? params.bucket;
  const { data, error } = await client.storage
    .from(bucketId)
    .createSignedUrl(params.path, params.expiresIn ?? 3600);

  if (error) return { url: null, error: error.message };
  return { url: data.signedUrl };
}
