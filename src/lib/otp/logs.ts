import type { SupabaseClient } from "@supabase/supabase-js";
import type { OtpChannel } from "@/lib/notifications/types";

export async function logOtpEvent(
  admin: SupabaseClient,
  params: {
    phone: string;
    channel: OtpChannel;
    status: string;
    attempts?: number;
    expiresAt?: string;
  }
): Promise<void> {
  await admin.from("otp_logs").insert({
    phone: params.phone,
    channel: params.channel,
    provider: "sendchamp",
    status: params.status,
    attempts: params.attempts ?? 0,
    expires_at: params.expiresAt ?? null,
  });
}
