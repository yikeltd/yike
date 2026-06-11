import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isWhatsappOtpProviderSendchamp,
  isWhatsappProfileVerificationEnabled,
} from "@/lib/feature-flags";
import { toInternationalNigerianPhone } from "@/lib/phone";
import {
  confirmSendchampVerification,
  createSendchampWhatsappVerification,
} from "@/lib/notifications/providers/sendchamp-verification";
import { WHATSAPP_VERIFY_COPY } from "./copy";
import type { WhatsappVerificationStatus } from "./profile";

const MAX_SENDS_PER_PHONE_HOUR = 3;
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60_000;

function hashIp(request: Request): string | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim();
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

async function countSendsLastHour(
  admin: SupabaseClient,
  phoneIntl: string
): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("whatsapp_otp_sessions")
    .select("id", { count: "exact", head: true })
    .eq("phone_intl", phoneIntl)
    .gte("created_at", since);
  return count ?? 0;
}

async function lastSentAt(
  admin: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await admin
    .from("whatsapp_otp_sessions")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.created_at ?? null;
}

export type SendWhatsappCodeResult =
  | { ok: true; message: string }
  | { ok: false; error: string; status: number; code?: string };

export type VerifyWhatsappCodeResult =
  | { ok: true; message: string }
  | { ok: false; error: string; status: number };

export async function sendWhatsappVerificationCode(
  admin: SupabaseClient,
  params: {
    userId: string;
    phoneLocal: string;
    email?: string | null;
    request: Request;
    updateProfilePhone?: boolean;
  }
): Promise<SendWhatsappCodeResult> {
  if (!isWhatsappProfileVerificationEnabled()) {
    return {
      ok: false,
      error: WHATSAPP_VERIFY_COPY.providerUnavailable,
      status: 503,
      code: "whatsapp_otp_disabled",
    };
  }

  if (!isWhatsappOtpProviderSendchamp()) {
    return {
      ok: false,
      error: WHATSAPP_VERIFY_COPY.providerUnavailable,
      status: 503,
    };
  }

  const phoneIntl = toInternationalNigerianPhone(params.phoneLocal);
  if (!phoneIntl) {
    return { ok: false, error: "Enter a valid Nigerian WhatsApp number.", status: 400 };
  }

  const sends = await countSendsLastHour(admin, phoneIntl);
  if (sends >= MAX_SENDS_PER_PHONE_HOUR) {
    return {
      ok: false,
      error: "Too many codes sent. Try again in an hour or use email.",
      status: 429,
      code: "rate_limited",
    };
  }

  const last = await lastSentAt(admin, params.userId);
  if (last) {
    const elapsed = Date.now() - new Date(last).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        error: "Please wait a moment before requesting another code.",
        status: 429,
        code: "cooldown",
      };
    }
  }

  if (params.updateProfilePhone !== false) {
    await admin
      .from("profiles")
      .update({
        whatsapp: params.phoneLocal,
        phone: params.phoneLocal,
        whatsapp_verification_status: "pending" as WhatsappVerificationStatus,
        whatsapp_verification_requested_at: new Date().toISOString(),
      })
      .eq("id", params.userId);
  }

  const created = await createSendchampWhatsappVerification({
    phoneIntl,
    purpose: "whatsapp_number_verification",
    email: params.email ?? undefined,
  });

  if (!created.ok) {
    console.error("[whatsapp-verify] send failed", created.error);
    if (created.code === "provider_auth_failed") {
      console.error("[whatsapp-verify] provider_auth_failed");
    }
    return {
      ok: false,
      error: WHATSAPP_VERIFY_COPY.providerUnavailable,
      status: created.status,
      code: created.code ?? "provider_failed",
    };
  }

  const expiresAt = new Date(Date.now() + created.expiresMinutes * 60_000).toISOString();

  await admin.from("whatsapp_otp_sessions").insert({
    user_id: params.userId,
    phone_local: params.phoneLocal,
    phone_intl: phoneIntl,
    provider_reference: created.reference,
    channel: "whatsapp",
    status: "sent",
    verify_attempts: 0,
    expires_at: expiresAt,
    ip_hash: hashIp(params.request),
  });

  await admin
    .from("profiles")
    .update({
      whatsapp_verification_reference: created.reference,
      whatsapp_verification_status: "pending",
      whatsapp_verification_requested_at: new Date().toISOString(),
    })
    .eq("id", params.userId);

  return {
    ok: true,
    message: WHATSAPP_VERIFY_COPY.afterSend,
  };
}

export async function verifyWhatsappCode(
  admin: SupabaseClient,
  params: {
    userId: string;
    code: string;
  }
): Promise<VerifyWhatsappCodeResult> {
  if (!isWhatsappProfileVerificationEnabled()) {
    return { ok: false, error: WHATSAPP_VERIFY_COPY.providerUnavailable, status: 503 };
  }

  const code = params.code.trim();
  if (!/^\d{4,8}$/.test(code)) {
    return { ok: false, error: WHATSAPP_VERIFY_COPY.invalidCode, status: 400 };
  }

  const { data: session } = await admin
    .from("whatsapp_otp_sessions")
    .select("id, provider_reference, verify_attempts, expires_at, status")
    .eq("user_id", params.userId)
    .eq("status", "sent")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session?.provider_reference) {
    return { ok: false, error: WHATSAPP_VERIFY_COPY.invalidCode, status: 400 };
  }

  if (new Date(session.expires_at) < new Date()) {
    await admin
      .from("whatsapp_otp_sessions")
      .update({ status: "expired", consumed_at: new Date().toISOString() })
      .eq("id", session.id);
    return { ok: false, error: WHATSAPP_VERIFY_COPY.invalidCode, status: 400 };
  }

  if (session.verify_attempts >= MAX_VERIFY_ATTEMPTS) {
    return {
      ok: false,
      error: "Too many attempts. Request a new code.",
      status: 429,
    };
  }

  const confirmed = await confirmSendchampVerification({
    reference: session.provider_reference,
    code,
  });

  if (!confirmed.ok) {
    await admin
      .from("whatsapp_otp_sessions")
      .update({ verify_attempts: session.verify_attempts + 1 })
      .eq("id", session.id);
    await admin
      .from("profiles")
      .update({
        whatsapp_verification_attempts: session.verify_attempts + 1,
      })
      .eq("id", params.userId);
    return { ok: false, error: WHATSAPP_VERIFY_COPY.invalidCode, status: 400 };
  }

  const now = new Date().toISOString();
  await admin
    .from("whatsapp_otp_sessions")
    .update({ status: "verified", consumed_at: now })
    .eq("id", session.id);

  await admin
    .from("profiles")
    .update({
      whatsapp_verified_at: now,
      whatsapp_verification_status: "verified",
      whatsapp_verification_reference: null,
      whatsapp_verification_attempts: 0,
      phone_verified: true,
    })
    .eq("id", params.userId);

  return { ok: true, message: WHATSAPP_VERIFY_COPY.verified };
}

export async function resetWhatsappVerificationOnNumberChange(
  admin: SupabaseClient,
  userId: string,
  newPhoneLocal: string,
  previousPhone: string
): Promise<void> {
  const normalizedNew = newPhoneLocal.trim();
  const normalizedPrev = previousPhone.trim();
  if (!normalizedNew || normalizedNew === normalizedPrev) return;

  await admin
    .from("profiles")
    .update({
      whatsapp: normalizedNew,
      phone: normalizedNew,
      whatsapp_verified_at: null,
      whatsapp_verification_status: "unverified",
      whatsapp_verification_reference: null,
      whatsapp_verification_attempts: 0,
      phone_verified: false,
    })
    .eq("id", userId);
}

export async function setAdminRequiredWhatsappVerification(
  admin: SupabaseClient,
  userId: string
): Promise<void> {
  await admin
    .from("profiles")
    .update({
      whatsapp_verification_status: "admin_required",
      whatsapp_verified_at: null,
    })
    .eq("id", userId);
}
