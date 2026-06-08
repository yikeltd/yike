import type { ApplicationPayload } from "@/lib/careers/scoring";
import { createOtpDbClient } from "@/lib/otp/rpc";

function otpServerToken(): string {
  const t = process.env.YIKE_OTP_SERVER_TOKEN?.trim();
  if (!t) throw new Error("YIKE_OTP_SERVER_TOKEN not configured");
  return t;
}

export async function submitFollowUpRpc(
  requestId: string,
  tokenHash: string,
  answers: Record<string, string>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = createOtpDbClient();
  if (!client) return { ok: false, error: "unavailable" };

  const { error } = await client.rpc("yike_career_submit_follow_up", {
    p_token: otpServerToken(),
    p_request_id: requestId,
    p_token_hash: tokenHash,
    p_answers: answers,
  });

  if (error) {
    const msg = error.message ?? "submit_failed";
    if (msg.includes("follow_up_expired")) return { ok: false, error: "expired" };
    if (msg.includes("follow_up_not_available")) return { ok: false, error: "already_submitted" };
    if (msg.includes("follow_up_not_found")) return { ok: false, error: "not_found" };
    console.error("[careers/follow-up] rpc failed:", msg);
    return { ok: false, error: "submit_failed" };
  }

  return { ok: true };
}

export type FollowUpLoadContext = {
  application: ApplicationPayload & { id: string; job_id: string };
  job: {
    id: string;
    title: string;
    category: string;
    department: string;
    requirements: string;
  };
};
