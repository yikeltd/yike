import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function supabaseUrl(): string | null {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    null
  );
}

function adminKeyCandidates(): string[] {
  return [
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    process.env.SUPABASE_SECRET_KEY?.trim(),
  ].filter((key): key is string => Boolean(key));
}

function isNewSecretKey(key: string): boolean {
  return key.startsWith("sb_secret_");
}

function looksLikeJwt(key: string): boolean {
  return key.startsWith("eyJ") && key.split(".").length === 3;
}

/** Service / secret key client for trusted server operations only. */
export function createServiceClient(secretKey: string): SupabaseClient | null {
  const url = supabaseUrl();
  if (!url || !secretKey) return null;

  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Service-role client for trusted server operations only. */
export function createAdminClient(): SupabaseClient | null {
  const keys = adminKeyCandidates();
  if (keys.length === 0) return null;
  return createServiceClient(keys[0]);
}

async function verifyServiceClient(client: SupabaseClient): Promise<string | null> {
  const { error: restError } = await client.from("profiles").select("id").limit(1);
  if (!restError) return null;

  const { error: authError } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (!authError) return null;

  return restError.message || authError.message || "service key rejected";
}

/** Verified admin when possible; falls back to configured service client. */
export async function getTrustedAdminClient(): Promise<SupabaseClient | null> {
  return (await createVerifiedAdminClient()) ?? createAdminClient();
}

function describeKey(key: string): "sb_secret" | "jwt" | "invalid" {
  if (isNewSecretKey(key)) return "sb_secret";
  if (looksLikeJwt(key)) return "jwt";
  return "invalid";
}

/** Pick the first service key that passes an admin auth probe. */
export async function createVerifiedAdminClient(): Promise<SupabaseClient | null> {
  const keys = adminKeyCandidates();
  if (!supabaseUrl() || keys.length === 0) return null;

  for (const key of keys) {
    if (describeKey(key) === "invalid") {
      console.error(
        "[supabase/admin] SUPABASE_SERVICE_ROLE_KEY looks truncated or malformed — reveal the full key in Supabase dashboard"
      );
      continue;
    }

    const client = createServiceClient(key);
    if (!client) continue;

    const error = await verifyServiceClient(client);
    if (!error) return client;
    console.error("[supabase/admin] service key rejected:", error);
  }

  return null;
}

export async function probeSupabaseAdmin(): Promise<{
  configured: boolean;
  ok: boolean;
  keyFormat: "sb_secret" | "jwt" | "invalid" | "missing";
  error?: string;
}> {
  const keys = adminKeyCandidates();
  if (!supabaseUrl() || keys.length === 0) {
    return { configured: false, ok: false, keyFormat: "missing" };
  }

  const key = keys[0];
  const keyFormat = describeKey(key);

  if (keyFormat === "invalid") {
    return {
      configured: true,
      ok: false,
      keyFormat,
      error:
        "Key looks truncated or malformed — copy the full sb_secret_… or service_role JWT from Supabase (Reveal key)",
    };
  }

  const client = createServiceClient(key);
  if (!client) {
    return { configured: true, ok: false, keyFormat, error: "Could not create admin client" };
  }

  const error = await verifyServiceClient(client);
  return {
    configured: true,
    ok: !error,
    keyFormat,
    error: error ?? undefined,
  };
}

export function isAdminClientConfigured(): boolean {
  return Boolean(supabaseUrl() && adminKeyCandidates().length > 0);
}
