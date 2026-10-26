import { APPLICATION_IDENTITY } from "@/lib/application-identity";
import { isProductionEnv } from "@/lib/env";

const PRODUCTION_SUPABASE_REF = APPLICATION_IDENTITY.supabaseProjectRef;

function envAllowed(name: string): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export function supabaseProjectRefFromUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const match = url.trim().match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1]?.toLowerCase() ?? null;
}

export function isLocalDevelopmentRuntime(): boolean {
  return !isProductionEnv() && process.env.NODE_ENV !== "production";
}

/** True when local dev is pointed at the production Supabase project. */
export function isProductionDatabaseTarget(): boolean {
  const ref =
    supabaseProjectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ??
    supabaseProjectRefFromUrl(process.env.SUPABASE_URL);
  return ref === PRODUCTION_SUPABASE_REF;
}

export type LocalMutationGuardResult =
  | { ok: true }
  | { ok: false; code: string; error: string };

/**
 * Fail-closed guard for payment initialization / reconciliation from a local dev server.
 * Opt-in via YIKE_ALLOW_PRODUCTION_DB_IN_DEV and YIKE_ALLOW_LIVE_PAYSTACK_IN_DEV.
 */
export function guardLocalPaymentMutation(
  paystackSecretKey: string | null | undefined,
): LocalMutationGuardResult {
  if (!isLocalDevelopmentRuntime()) {
    return { ok: true };
  }

  if (isProductionDatabaseTarget() && !envAllowed("YIKE_ALLOW_PRODUCTION_DB_IN_DEV")) {
    return {
      ok: false,
      code: "production_db_blocked",
      error:
        "Local dev is pointed at the production database. Set YIKE_ALLOW_PRODUCTION_DB_IN_DEV=1 only when you intentionally test against production data.",
    };
  }

  const secret = paystackSecretKey?.trim() ?? "";
  if (secret.startsWith("sk_live_") && !envAllowed("YIKE_ALLOW_LIVE_PAYSTACK_IN_DEV")) {
    return {
      ok: false,
      code: "live_paystack_blocked",
      error:
        "Live Paystack keys are blocked in local development. Use test keys or set YIKE_ALLOW_LIVE_PAYSTACK_IN_DEV=1 when authorized.",
    };
  }

  return { ok: true };
}
