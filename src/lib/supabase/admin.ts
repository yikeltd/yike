import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ADMIN_KEY_ENV_NAMES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_ROLE",
  "SUPABASE_SERVICE_KEY",
] as const;

type AdminKeySource = (typeof ADMIN_KEY_ENV_NAMES)[number];

function supabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
}

function readEnv(name: AdminKeySource): string | null {
  return process.env[name]?.trim() || null;
}

function adminKeyCandidates(): Array<{ source: AdminKeySource; key: string }> {
  return ADMIN_KEY_ENV_NAMES.flatMap((source) => {
    const key = readEnv(source);
    return key ? [{ source, key }] : [];
  });
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

export function getSupabaseAdminConfig(): {
  supabaseUrlPresent: boolean;
  serviceRolePresent: boolean;
  standardServiceRolePresent: boolean;
  legacyServiceRolePresent: boolean;
  serviceRoleSource: AdminKeySource | null;
} {
  assertServerOnly();
  const candidates = adminKeyCandidates();
  return {
    supabaseUrlPresent: Boolean(supabaseUrl()),
    serviceRolePresent: candidates.length > 0,
    standardServiceRolePresent: Boolean(readEnv("SUPABASE_SERVICE_ROLE_KEY")),
    legacyServiceRolePresent: candidates.some(
      (candidate) => candidate.source !== "SUPABASE_SERVICE_ROLE_KEY"
    ),
    serviceRoleSource: candidates[0]?.source ?? null,
  };
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
  return createServiceClient(keys[0].key);
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

  for (const { source, key } of keys) {
    if (describeKey(key) === "invalid") {
      console.error(
        `[supabase/admin] ${source} looks truncated or malformed — reveal the full key in Supabase dashboard`
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
  standardServiceRolePresent: boolean;
  legacyServiceRolePresent: boolean;
  serviceRoleSource: AdminKeySource | null;
  authAdminReachable: boolean;
  profilesReachable: boolean;
  error?: string;
}> {
  assertServerOnly();
  const config = getSupabaseAdminConfig();
  const keys = adminKeyCandidates();
  if (!supabaseUrl() || keys.length === 0) {
    return {
      configured: false,
      ok: false,
      keyFormat: "missing",
      supabaseUrlPresent: config.supabaseUrlPresent,
      serviceRolePresent: config.serviceRolePresent,
      standardServiceRolePresent: config.standardServiceRolePresent,
      legacyServiceRolePresent: config.legacyServiceRolePresent,
      serviceRoleSource: config.serviceRoleSource,
      authAdminReachable: false,
      profilesReachable: false,
    };
  }

  let lastResult: {
    keyFormat: "sb_secret" | "jwt" | "invalid";
    source: AdminKeySource;
    authAdminReachable: boolean;
    profilesReachable: boolean;
    error?: string;
  } | null = null;

  for (const { source, key } of keys) {
    const keyFormat = describeKey(key);

    if (keyFormat === "invalid") {
      lastResult = {
        keyFormat,
        source,
        authAdminReachable: false,
        profilesReachable: false,
        error:
          "Service role key looks truncated or malformed. Copy the full service_role secret from Supabase.",
      };
      continue;
    }

    const client = createServiceClient(key);
    const { error: profilesError } = await client.from("profiles").select("id").limit(1);
    const { error: authError } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (profilesError) {
      console.error("[supabase/admin] profiles probe failed:", profilesError.message);
    }
    if (authError) {
      console.error("[supabase/admin] auth admin probe failed:", authError.message);
    }

    const profilesReachable = !profilesError;
    const authAdminReachable = !authError;
    lastResult = {
      keyFormat,
      source,
      authAdminReachable,
      profilesReachable,
      error:
        profilesReachable && authAdminReachable
          ? undefined
          : "Supabase service role cannot access auth admin or profiles. Check service role key/project match.",
    };

    if (profilesReachable && authAdminReachable) {
      return {
        configured: true,
        ok: true,
        keyFormat,
        supabaseUrlPresent: true,
        serviceRolePresent: true,
        standardServiceRolePresent: config.standardServiceRolePresent,
        legacyServiceRolePresent: config.legacyServiceRolePresent,
        serviceRoleSource: source,
        authAdminReachable,
        profilesReachable,
      };
    }
  }

  const result = lastResult ?? {
    keyFormat: "invalid" as const,
    source: keys[0].source,
    authAdminReachable: false,
    profilesReachable: false,
    error:
      "Service role key looks truncated or malformed. Copy the full service_role secret from Supabase.",
  };
  return {
    configured: true,
    ok: false,
    keyFormat: result.keyFormat,
    supabaseUrlPresent: true,
    serviceRolePresent: true,
    standardServiceRolePresent: config.standardServiceRolePresent,
    legacyServiceRolePresent: config.legacyServiceRolePresent,
    serviceRoleSource: result.source,
    authAdminReachable: result.authAdminReachable,
    profilesReachable: result.profilesReachable,
    error: result.error,
  };
}

export function isAdminClientConfigured(): boolean {
  return Boolean(supabaseUrl() && adminKeyCandidates().length > 0);
}

/** Returns null instead of throwing when admin env is missing or misconfigured. */
export function tryCreateAdminClient(): SupabaseClient | null {
  try {
    if (!isAdminClientConfigured()) return null;
    return createAdminClient();
  } catch {
    return null;
  }
}
