import type { SupabaseClient } from "@supabase/supabase-js";
import type { OtpChannel } from "@/lib/notifications/types";

/** Strip provider secrets and cap length for DB storage. */
export function sanitizeOtpError(message?: string): string | null {
  if (!message?.trim()) return null;
  return message.replace(/\b(sk_|Bearer\s+)\S+/gi, "[redacted]").slice(0, 240);
}

export async function logOtpEvent(
  admin: SupabaseClient,
  params: {
    phone: string;
    channel: OtpChannel;
    status: string;
    attempts?: number;
    expiresAt?: string;
    providerError?: string;
  }
): Promise<void> {
  const errorMessage = sanitizeOtpError(params.providerError);

  await admin.from("otp_logs").insert({
    phone: params.phone,
    channel: params.channel,
    provider: "sendchamp",
    status: params.status,
    attempts: params.attempts ?? 0,
    expires_at: params.expiresAt ?? null,
    error_message: errorMessage,
  });
}
