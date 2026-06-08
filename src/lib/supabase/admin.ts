import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function supabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
}

function adminKeyCandidates(): string[] {
  return [
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    process.env.SUPABASE_SERVICE_ROLE?.trim(),
    process.env.SUPABASE_SERVICE_KEY?.trim(),
    process.env.SUPABASE_SECRET_KEY?.trim(),
  ].filter((key): key is string => Boolean(key));
}

function isNewSecretKey(key: string): boolean {
  return key.startsWith("sb_secret_");
}

function looksLikeJwt(key: string): boolean {
  return key.startsWith("eyJ") && key.split(".").length === 3;
}

function assertServerOnly() {
  if (typeof window !== "undefined") {
    throw new Error("Supabase admin client is server-only and cannot run in the browser");
  }
}

/** Service / secret key client for trusted server operations only. */
export function createServiceClient(secretKey: string): SupabaseClient {
  assertServerOnly();
  const url = supabaseUrl();
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL for Supabase admin client");
  }
  if (!secretKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for Supabase admin client");
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false },
  });
}

/** Service-role client for trusted server operations only. */
export function createAdminClient(): SupabaseClient {
  assertServerOnly();
  const keys = adminKeyCandidates();
  if (keys.length === 0) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for Supabase admin client");
  }
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
export async function getTrustedAdminClient(): Promise<SupabaseClient> {
  return (await createVerifiedAdminClient()) ?? createAdminClient();
}

function describeKey(key: string): "sb_secret" | "jwt" | "invalid" {
  if (isNewSecretKey(key)) return "sb_secret";
  if (looksLikeJwt(key)) return "jwt";
  return "invalid";
}

/** Pick the first service key that passes an admin auth probe. */
export async function createVerifiedAdminClient(): Promise<SupabaseClient | null> {
  assertServerOnly();
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
  supabaseUrlPresent: boolean;
  serviceRolePresent: boolean;
  authAdminReachable: boolean;
  profilesReachable: boolean;
  error?: string;
}> {
  assertServerOnly();
  const keys = adminKeyCandidates();
  if (!supabaseUrl() || keys.length === 0) {
    return {
      configured: false,
      ok: false,
      keyFormat: "missing",
      supabaseUrlPresent: Boolean(supabaseUrl()),
      serviceRolePresent: keys.length > 0,
      authAdminReachable: false,
      profilesReachable: false,
    };
  }

  const key = keys[0];
  const keyFormat = describeKey(key);

  if (keyFormat === "invalid") {
    return {
      configured: true,
      ok: false,
      keyFormat,
      supabaseUrlPresent: true,
      serviceRolePresent: true,
      authAdminReachable: false,
      profilesReachable: false,
      error:
        "Key looks truncated or malformed — copy the full sb_secret_… or service_role JWT from Supabase (Reveal key)",
    };
  }

  const client = createServiceClient(key);

  const { error: profilesError } = await client.from("profiles").select("id").limit(1);
  const { error: authError } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (profilesError) console.error("[supabase/admin] profiles probe failed:", profilesError.message);
  if (authError) console.error("[supabase/admin] auth admin probe failed:", authError.message);

  const profilesReachable = !profilesError;
  const authAdminReachable = !authError;
  return {
    configured: true,
    ok: profilesReachable && authAdminReachable,
    keyFormat,
    supabaseUrlPresent: true,
    serviceRolePresent: true,
    authAdminReachable,
    profilesReachable,
    error:
      profilesReachable && authAdminReachable
        ? undefined
        : "Supabase service role cannot access auth admin or profiles. Check service role key/project match.",
  };
}

export function isAdminClientConfigured(): boolean {
  return Boolean(supabaseUrl() && adminKeyCandidates().length > 0);
}
