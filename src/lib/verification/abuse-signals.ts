import type { SupabaseClient } from "@supabase/supabase-js";
export type AbuseSignalResult = {
  suspicionScore: number;
  signals: Record<string, unknown>;
  linkedAccountIds: string[];
};

/** Internal-only suspicion scoring — guides human review, never auto-punishes. */
export async function computeAbuseSuspicionSignals(
  client: SupabaseClient,
  userId: string
): Promise<AbuseSignalResult> {
  const signals: Record<string, unknown> = {};
  const linkedAccountIds = new Set<string>();
  let score = 0;

  const { data: profile } = await client
    .from("profiles")
    .select(
      "complaint_count, abuse_review_flag, verification_required, adaptive_trust_level, whatsapp, phone, is_banned, account_status"
    )
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return { suspicionScore: 0, signals: {}, linkedAccountIds: [] };
  }

  const complaints = Number(profile.complaint_count ?? 0);
  if (complaints > 0) {
    const pts = Math.min(complaints * 8, 40);
    score += pts;
    signals.complaint_count = complaints;
  }

  if (profile.abuse_review_flag) {
    score += 25;
    signals.abuse_review_flag = true;
  }

  if (profile.verification_required) {
    score += 15;
    signals.verification_required = true;
  }

  const level = Number(profile.adaptive_trust_level ?? 0);
  if (level >= 4) {
    score += level * 5;
    signals.adaptive_trust_level = level;
  }

  const contact = (profile.whatsapp || profile.phone || "").trim();
  if (contact) {
    const { data: sameContact } = await client
      .from("profiles")
      .select("id")
      .neq("id", userId)
      .or(`whatsapp.eq.${contact},phone.eq.${contact}`)
      .limit(8);
    if ((sameContact?.length ?? 0) > 0) {
      score += 20;
      signals.shared_whatsapp_accounts = sameContact?.length ?? 0;
      for (const row of sameContact ?? []) {
        linkedAccountIds.add(row.id as string);
      }
    }
  }

  const { data: devices } = await client
    .from("trusted_devices")
    .select("ip_subnet_hash, user_agent_hash")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .limit(5);

  for (const device of devices ?? []) {
    if (device.ip_subnet_hash) {
      const { data: sharedIp } = await client
        .from("trusted_devices")
        .select("user_id")
        .eq("ip_subnet_hash", device.ip_subnet_hash)
        .neq("user_id", userId)
        .is("revoked_at", null)
        .limit(10);
      if ((sharedIp?.length ?? 0) > 0) {
        score += 15;
        signals.shared_ip_subnet = (sharedIp?.length ?? 0) + 1;
        for (const row of sharedIp ?? []) {
          linkedAccountIds.add(row.user_id as string);
        }
      }
    }
  }

  const { count: failedEvents } = await client
    .from("auth_security_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("event_type", ["login.failed", "sensitive.failed", "device.suspicious"]);

  if ((failedEvents ?? 0) > 2) {
    score += Math.min((failedEvents ?? 0) * 3, 20);
    signals.security_event_failures = failedEvents;
  }

  const { count: dupListings } = await client
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", userId)
    .eq("possible_duplicate", true);

  if ((dupListings ?? 0) > 0) {
    score += Math.min((dupListings ?? 0) * 6, 24);
    signals.duplicate_listings = dupListings;
  }

  const { count: removedListings } = await client
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", userId)
    .in("status", ["rejected", "archived"]);

  if ((removedListings ?? 0) > 3) {
    score += 10;
    signals.listing_removals = removedListings;
  }

  if (profile.is_banned) {
    score += 50;
    signals.previously_banned = true;
  }

  return {
    suspicionScore: Math.min(100, score),
    signals,
    linkedAccountIds: [...linkedAccountIds],
  };
}

export async function refreshOperationalSuspicionScore(
  client: SupabaseClient,
  userId: string
): Promise<number> {
  const result = await computeAbuseSuspicionSignals(client, userId);
  await client
    .from("profiles")
    .update({
      operational_suspicion_score: result.suspicionScore,
    })
    .eq("id", userId);
  return result.suspicionScore;
}
