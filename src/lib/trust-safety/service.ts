import { SupabaseClient } from "@supabase/supabase-js";
import { TrustProfile, TrustLedgerEntry, UserReport, ReportCategory, ReportStatus } from "@/types/trust-safety";

/**
 * Gets or initializes a Trust Profile for a user.
 */
export async function getOrCreateTrustProfile(
  client: SupabaseClient,
  userId: string
): Promise<TrustProfile> {
  const { data: existing, error } = await client
    .from("trust_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return existing as TrustProfile;
  }

  const { data: created, error: createError } = await client
    .from("trust_profiles")
    .insert({
      user_id: userId,
      trust_status: "normal",
      risk_score: 0,
      trust_score: 50,
      verification_score: 0,
      identity_status: "unverified",
    })
    .select("*")
    .single();

  if (createError || !created) {
    // Return fallback in-memory object if database insert fails or pending migration
    return {
      id: `tp-${userId}`,
      user_id: userId,
      trust_status: "normal",
      risk_score: 0,
      trust_score: 50,
      verification_score: 0,
      identity_status: "unverified",
      report_count: 0,
      confirmed_violations: 0,
      dismissed_reports: 0,
      warnings_issued: 0,
      restrictions_count: 0,
      suspensions_count: 0,
      permanent_ban_flag: false,
      appeal_status: "none",
      last_reviewed_at: null,
      last_reviewed_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return created as TrustProfile;
}

/**
 * Appends an event to the immutable Trust Ledger and updates scores.
 */
export async function recordTrustEvent(
  client: SupabaseClient,
  params: {
    userId: string;
    eventType: string;
    actorId?: string;
    title: string;
    description?: string;
    riskScoreDelta?: number;
    trustScoreDelta?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<TrustLedgerEntry | null> {
  const riskDelta = params.riskScoreDelta ?? 0;
  const trustDelta = params.trustScoreDelta ?? 0;

  // 1. Insert into trust_ledger
  const { data: ledger, error: ledgerError } = await client
    .from("trust_ledger")
    .insert({
      user_id: params.userId,
      event_type: params.eventType,
      actor_id: params.actorId ?? null,
      title: params.title,
      description: params.description ?? null,
      risk_score_delta: riskDelta,
      trust_score_delta: trustDelta,
      metadata: params.metadata ?? {},
    })
    .select("*")
    .single();

  if (ledgerError) {
    console.warn("[TrustSafetyService] Ledger insert error:", ledgerError.message);
  }

  // 2. Fetch current profile & update dynamic risk/trust score bounds
  const profile = await getOrCreateTrustProfile(client, params.userId);
  const newRiskScore = Math.min(100, Math.max(0, profile.risk_score + riskDelta));
  const newTrustScore = Math.min(100, Math.max(0, profile.trust_score + trustDelta));

  await client
    .from("trust_profiles")
    .update({
      risk_score: newRiskScore,
      trust_score: newTrustScore,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", params.userId);

  return ledger as TrustLedgerEntry | null;
}

/**
 * Universal User Reporting Workflow:
 * Report Submitted -> Evidence Stored -> Risk Score Updated -> Moderator Queue
 * Note: A single report NEVER automatically hides listings or suspends users (False Report Protection).
 */
export async function submitUserReport(
  client: SupabaseClient,
  params: {
    reporterId: string;
    reportedUserId: string;
    reportedListingId?: string;
    reportedConversationId?: string;
    category: ReportCategory;
    description: string;
    evidence?: Array<{
      type: "image" | "document" | "screenshot" | "conversation_ref" | "listing_ref";
      url?: string;
      note?: string;
    }>;
  }
): Promise<UserReport> {
  // 1. Insert into user_reports
  const { data: report, error } = await client
    .from("user_reports")
    .insert({
      reporter_id: params.reporterId,
      reported_user_id: params.reportedUserId,
      reported_listing_id: params.reportedListingId ?? null,
      reported_conversation_id: params.reportedConversationId ?? null,
      category: params.category,
      description: params.description,
      evidence: params.evidence ?? [],
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !report) {
    throw new Error(`Failed to record report: ${error?.message ?? "Unknown error"}`);
  }

  // 2. Record event in Trust Ledger (+5 risk score for preliminary review notice)
  await recordTrustEvent(client, {
    userId: params.reportedUserId,
    eventType: "report_submitted",
    actorId: params.reporterId,
    title: `Report Submitted (${params.category})`,
    description: params.description,
    riskScoreDelta: 5,
    metadata: { report_id: report.id, category: params.category },
  });

  // 3. Update report_count on trust_profile
  const profile = await getOrCreateTrustProfile(client, params.reportedUserId);
  await client
    .from("trust_profiles")
    .update({
      report_count: (profile.report_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", params.reportedUserId);

  // 4. Audit Trail
  await logTrustAudit(client, {
    actorId: params.reporterId,
    targetUserId: params.reportedUserId,
    reportId: report.id,
    action: "report_created",
    details: { category: params.category },
  });

  return report as UserReport;
}

/**
 * Logs a moderation audit action.
 */
export async function logTrustAudit(
  client: SupabaseClient,
  params: {
    actorId: string;
    targetUserId?: string;
    reportId?: string;
    action: string;
    details?: Record<string, unknown>;
  }
) {
  try {
    await client.from("trust_audit_logs").insert({
      actor_id: params.actorId,
      target_user_id: params.targetUserId ?? null,
      report_id: params.reportId ?? null,
      action: params.action,
      details: params.details ?? {},
    });
  } catch (err) {
    console.warn("[TrustSafetyService] Audit logging failed silently:", err);
  }
}
