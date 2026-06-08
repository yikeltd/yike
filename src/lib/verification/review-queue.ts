import type { SupabaseClient } from "@supabase/supabase-js";
import { computeAbuseSuspicionSignals } from "./abuse-signals";
import { getVerificationControlConfig } from "./config";

export type TrustReviewQueueItem = {
  id: string;
  reference: string;
  userId: string | null;
  listingId: string | null;
  caseType: string;
  priority: string;
  status: string;
  suspicionScore: number;
  reason: string;
  signals: Record<string, unknown>;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
  source: "trust_review_cases" | "live_flag";
  linkedAccountIds: string[];
  trustLevel: number;
};

export async function fetchTrustReviewQueue(
  client: SupabaseClient,
  limit = 80
): Promise<TrustReviewQueueItem[]> {
  const items: TrustReviewQueueItem[] = [];
  const config = await getVerificationControlConfig(client);

  const { data: cases } = await client
    .from("trust_review_cases")
    .select(
      "id, case_reference, user_id, listing_id, case_type, priority, status, suspicion_score, reason, signals, created_at, profiles(full_name, email)"
    )
    .in("status", ["open", "in_review"])
    .order("suspicion_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  for (const row of cases ?? []) {
    const profile = row.profiles as { full_name?: string; email?: string } | null;
    items.push({
      id: row.id as string,
      reference: row.case_reference as string,
      userId: row.user_id as string | null,
      listingId: row.listing_id as string | null,
      caseType: row.case_type as string,
      priority: row.priority as string,
      status: row.status as string,
      suspicionScore: Number(row.suspicion_score ?? 0),
      reason: row.reason as string,
      signals: (row.signals as Record<string, unknown>) ?? {},
      userName: profile?.full_name ?? null,
      userEmail: profile?.email ?? null,
      createdAt: row.created_at as string,
      source: "trust_review_cases",
      linkedAccountIds: [],
      trustLevel: 0,
    });
  }

  const { data: flagged } = await client
    .from("profiles")
    .select(
      "id, full_name, email, adaptive_trust_level, abuse_review_flag, abuse_review_reason, verification_required, complaint_count, created_at, operational_suspicion_score"
    )
    .or("verification_required.eq.true,abuse_review_flag.eq.true,adaptive_trust_level.gte.4")
    .limit(40);

  const seen = new Set(items.map((i) => i.userId).filter(Boolean));

  for (const p of flagged ?? []) {
    if (seen.has(p.id as string)) continue;
    let suspicion =
      Number(p.operational_suspicion_score ?? 0) ||
      Number(p.adaptive_trust_level ?? 0) * 12 +
        (p.abuse_review_flag ? 20 : 0) +
        Math.min(Number(p.complaint_count ?? 0) * 5, 30);

    let linkedAccountIds: string[] = [];
    if (config.multi_account_detection_enabled || config.device_abuse_monitoring_enabled) {
      const abuse = await computeAbuseSuspicionSignals(client, p.id as string);
      suspicion = Math.max(suspicion, abuse.suspicionScore);
      linkedAccountIds = abuse.linkedAccountIds;
    }

    items.push({
      id: `live-${p.id}`,
      reference: `LIVE-${String(p.id).slice(0, 8)}`,
      userId: p.id as string,
      listingId: null,
      caseType: p.abuse_review_flag ? "complaint_pattern" : "escalated_user",
      priority: suspicion >= 60 ? "urgent" : suspicion >= 40 ? "high" : "normal",
      status: "open",
      suspicionScore: suspicion,
      reason:
        (p.abuse_review_reason as string) ||
        "Account flagged for trust review",
      signals: {
        adaptive_trust_level: p.adaptive_trust_level,
        verification_required: p.verification_required,
      },
      userName: p.full_name as string | null,
      userEmail: p.email as string | null,
      createdAt: p.created_at as string,
      source: "live_flag",
      linkedAccountIds,
      trustLevel: Number(p.adaptive_trust_level ?? 0),
    });
  }

  for (const item of items) {
    if (item.userId && item.linkedAccountIds.length === 0 && item.source === "trust_review_cases") {
      const abuse = await computeAbuseSuspicionSignals(client, item.userId);
      item.suspicionScore = Math.max(item.suspicionScore, abuse.suspicionScore);
      item.linkedAccountIds = abuse.linkedAccountIds;
      item.signals = { ...item.signals, ...abuse.signals };
    }
  }

  return items
    .sort((a, b) => b.suspicionScore - a.suspicionScore || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
