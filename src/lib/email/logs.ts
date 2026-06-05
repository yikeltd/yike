import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailType } from "@/lib/notifications/types";

export async function logEmailEvent(
  admin: SupabaseClient,
  params: {
    email: string;
    type: EmailType;
    status: "sent" | "failed";
  }
): Promise<void> {
  await admin.from("email_logs").insert({
    email: params.email,
    type: params.type,
    provider: "resend",
    status: params.status,
  });
}

export async function hasSentEmail(
  admin: SupabaseClient,
  email: string,
  type: EmailType
): Promise<boolean> {
  const { data } = await admin
    .from("email_logs")
    .select("id")
    .eq("email", email)
    .eq("type", type)
    .eq("status", "sent")
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}
