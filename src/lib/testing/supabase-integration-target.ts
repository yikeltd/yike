import { APPLICATION_IDENTITY } from "@/lib/application-identity";

export const PRODUCTION_SUPABASE_REF = APPLICATION_IDENTITY.supabaseProjectRef;

/** Retired — DNS dead; never allow. */
export const RETIRED_SANDBOX_REF = "gyxemepnrkwxocgzfbeo";

export function supabaseRefFromUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const match = url.trim().match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1]?.toLowerCase() ?? null;
}

/** Explicit non-production refs permitted for mutating DB integration tests. */
export function parseIntegrationAllowlist(): string[] {
  const refs = new Set<string>();
  const list = process.env.YIKE_INTEGRATION_ALLOWED_REFS?.trim();
  if (list) {
    for (const part of list.split(",")) {
      const ref = part.trim().toLowerCase();
      if (ref) refs.add(ref);
    }
  }
  const expected = process.env.E2E_EXPECTED_REF?.trim().toLowerCase();
  if (expected) refs.add(expected);
  return [...refs];
}

export type IntegrationTargetCheck =
  | { ok: true; ref: string; allowlist: string[] }
  | { ok: false; reason: string };

/**
 * Fail-closed: integration tests must not run against production or unknown refs.
 * Requires YIKE_DEV_DB_INTEGRATION=1 and an explicit allowlist entry matching the URL host.
 */
export function checkIntegrationSupabaseTarget(): IntegrationTargetCheck {
  if (process.env.YIKE_DEV_DB_INTEGRATION !== "1") {
    return { ok: false, reason: "YIKE_DEV_DB_INTEGRATION is not 1" };
  }

  const ref =
    supabaseRefFromUrl(process.env.SUPABASE_URL) ??
    supabaseRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (!ref) {
    return {
      ok: false,
      reason: "SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL must resolve to https://<ref>.supabase.co",
    };
  }

  if (ref === PRODUCTION_SUPABASE_REF) {
    return {
      ok: false,
      reason: `Production Supabase ref ${PRODUCTION_SUPABASE_REF} is blocked for integration mutations`,
    };
  }

  if (ref === RETIRED_SANDBOX_REF) {
    return { ok: false, reason: `Retired sandbox ref ${RETIRED_SANDBOX_REF} is blocked` };
  }

  const allowlist = parseIntegrationAllowlist();
  if (allowlist.length === 0) {
    return {
      ok: false,
      reason:
        "Set E2E_EXPECTED_REF (in .env.e2e.local) or YIKE_INTEGRATION_ALLOWED_REFS to an explicit non-production project ref",
    };
  }

  if (allowlist.includes(PRODUCTION_SUPABASE_REF)) {
    return {
      ok: false,
      reason: "Allowlist must not include the production Supabase ref",
    };
  }

  if (!allowlist.includes(ref)) {
    return {
      ok: false,
      reason: `Configured ref ${ref} is not in the integration allowlist (${allowlist.join(", ")})`,
    };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return { ok: false, reason: "SUPABASE_SERVICE_ROLE_KEY is required for integration tests" };
  }

  return { ok: true, ref, allowlist };
}

export function integrationMutationsEnabled(): boolean {
  return checkIntegrationSupabaseTarget().ok;
}
