import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateLeadReference } from "./reference";
import type { LeadType } from "./types";

function serverToken(): string | null {
  return process.env.YIKE_OTP_SERVER_TOKEN?.trim() || null;
}

function adminClient() {
  try {
    return createAdminClient();
  } catch (error) {
    console.error("[leads] admin client unavailable", (error as Error).message);
    return null;
  }
}

export function hashClientIp(ip: string | null): string | null {
  if (!ip?.trim()) return null;
  const salt = process.env.YIKE_OTP_SERVER_TOKEN?.trim() || "yike";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function logLead(input: {
  userId?: string | null;
  guestId?: string | null;
  userIpHash?: string | null;
  listingId: string;
  agentId: string;
  leadType: LeadType;
  sourcePage?: string;
  message?: string;
  userAgent?: string | null;
  city: string;
  area?: string;
  yikeReference?: string;
}): Promise<
  | { ok: true; yikeReference: string; leadId: string }
  | { ok: false; error: string; cooldown?: boolean }
> {
  const token = serverToken();
  const client = adminClient();
  if (!token || !client) {
    return { ok: false, error: "Lead logging unavailable" };
  }

  let reference = input.yikeReference ?? generateLeadReference(input.city, input.area);

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await client.rpc("yike_log_lead", {
      p_token: token,
      p_user_id: input.userId ?? null,
      p_guest_id: input.guestId ?? null,
      p_user_ip_hash: input.userIpHash ?? null,
      p_listing_id: input.listingId,
      p_agent_id: input.agentId,
      p_lead_type: input.leadType,
      p_source_page: input.sourcePage ?? null,
      p_message: input.message ?? null,
      p_yike_reference: reference,
      p_user_agent: input.userAgent ?? null,
    });

    if (!error && data) {
      return { ok: true, yikeReference: reference, leadId: String(data) };
    }

    const msg = error?.message ?? "";
    if (msg.includes("lead_cooldown")) {
      return { ok: false, error: "cooldown", cooldown: true };
    }

    if (msg.includes("unique") || error?.code === "23505") {
      reference = generateLeadReference(input.city, input.area);
      continue;
    }

    console.error("[leads] log failed", msg);
    return { ok: false, error: msg || "log_failed" };
  }

  return { ok: false, error: "reference_collision" };
}
