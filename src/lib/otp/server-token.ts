import { isProductionEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/** Linked Yike Supabase — dev hydration only when env token is unset. */
const CANONICAL_DEV_REF = "hlpojfurfldvcxfxhveg";

let hydratePromise: Promise<boolean> | null = null;

export function getOtpServerTokenFromEnv(): string | null {
  return process.env.YIKE_OTP_SERVER_TOKEN?.trim() || null;
}

/**
 * Local dev: mirror Coolify by loading otp_server_token from yike_internal_config
 * when YIKE_OTP_SERVER_TOKEN is missing from .env.local.
 * Never runs in production — production must set env explicitly.
 */
export async function hydrateOtpServerTokenForLocalDev(): Promise<boolean> {
  if (getOtpServerTokenFromEnv()) return true;
  if (isProductionEnv()) return false;

  if (!hydratePromise) {
    hydratePromise = (async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
      const ref = url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1]?.toLowerCase();
      if (ref !== CANONICAL_DEV_REF) return false;

      try {
        const admin = createAdminClient();
        const { data, error } = await admin
          .from("yike_internal_config")
          .select("value")
          .eq("key", "otp_server_token")
          .maybeSingle();
        if (error || !data?.value?.trim()) {
          console.error("[otp/server-token] dev hydrate failed:", error?.message ?? "no row");
          return false;
        }
        process.env.YIKE_OTP_SERVER_TOKEN = data.value.trim();
        return true;
      } catch (err) {
        console.error("[otp/server-token] dev hydrate error:", (err as Error).message);
        return false;
      }
    })();
  }

  return hydratePromise;
}

export function requireOtpServerToken(): string {
  const token = getOtpServerTokenFromEnv();
  if (!token) throw new Error("YIKE_OTP_SERVER_TOKEN not configured");
  return token;
}
