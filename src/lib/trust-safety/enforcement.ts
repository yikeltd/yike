import { SupabaseClient } from "@supabase/supabase-js";
import { getOrCreateTrustProfile, recordTrustEvent, logTrustAudit } from "./service";
import { TrustStatus } from "@/types/trust-safety";

export type EnforcementLevel =
  | "normal"
  | "warning"
  | "under_review"
  | "restricted"
  | "suspended"
  | "banned";

export interface EnforcementResult {
  success: boolean;
  userId: string;
  previousStatus: TrustStatus;
  newStatus: TrustStatus;
  isVisibilityRestricted: boolean;
}

/**
 * Applies or removes enforcement levels on a user account.
 * Actions are reversible (except permanent ban which flags the profile).
 */
export async function applyEnforcementAction(
  client: SupabaseClient,
  params: {
    userId: string;
    action: EnforcementLevel | "restore";
    moderatorId: string;
    reason: string;
    notes?: string;
  }
): Promise<EnforcementResult> {
  const profile = await getOrCreateTrustProfile(client, params.userId);
  const previousStatus = profile.trust_status;

  let newStatus: TrustStatus = "normal";
  let isRestricted = false;

  switch (params.action) {
    case "warning":
      newStatus = profile.trust_status === "trusted" || profile.trust_status === "verified" ? profile.trust_status : "normal";
      isRestricted = false;
      break;
    case "under_review":
      newStatus = "under_review";
      isRestricted = false;
      break;
    case "restricted":
      newStatus = "restricted";
      isRestricted = true;
      break;
    case "suspended":
      newStatus = "suspended";
      isRestricted = true;
      break;
    case "banned":
      newStatus = "banned";
      isRestricted = true;
      break;
    case "restore":
    case "normal":
      newStatus = "normal";
      isRestricted = false;
      break;
  }

  // 1. Update trust_profiles table
  const updatePayload: Record<string, unknown> = {
    trust_status: newStatus,
    last_reviewed_at: new Date().toISOString(),
    last_reviewed_by: params.moderatorId,
    updated_at: new Date().toISOString(),
  };

  if (params.action === "warning") {
    updatePayload.warnings_issued = (profile.warnings_issued ?? 0) + 1;
  } else if (params.action === "restricted") {
    updatePayload.restrictions_count = (profile.restrictions_count ?? 0) + 1;
  } else if (params.action === "suspended") {
    updatePayload.suspensions_count = (profile.suspensions_count ?? 0) + 1;
  } else if (params.action === "banned") {
    updatePayload.permanent_ban_flag = true;
  } else if (params.action === "restore") {
    updatePayload.permanent_ban_flag = false;
  }

  await client.from("trust_profiles").update(updatePayload).eq("user_id", params.userId);

  // 2. Update profiles table metadata
  await client
    .from("profiles")
    .update({
      enforcement_level: params.action,
      is_visibility_restricted: isRestricted,
      is_banned: params.action === "banned" || params.action === "suspended",
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.userId);

  // 3. Auto-pause active campaigns if user becomes restricted, suspended, or banned
  if (isRestricted) {
    await client
      .from("listing_promotions")
      .update({ status: "paused" })
      .eq("seller_id", params.userId)
      .eq("status", "active");

    await client
      .from("advertisements")
      .update({ status: "paused" })
      .eq("advertiser_id", params.userId)
      .eq("status", "active");
  }

  // 4. Record Trust Ledger Entry
  await recordTrustEvent(client, {
    userId: params.userId,
    eventType: `enforcement_${params.action}`,
    actorId: params.moderatorId,
    title: `Enforcement Action: ${params.action.toUpperCase()}`,
    description: `Reason: ${params.reason}. ${params.notes ?? ""}`.trim(),
    riskScoreDelta: params.action === "restricted" ? +15 : params.action === "banned" ? +50 : 0,
    metadata: {
      action: params.action,
      previousStatus,
      newStatus,
      isRestricted,
    },
  });

  // 5. Audit Logging
  await logTrustAudit(client, {
    actorId: params.moderatorId,
    targetUserId: params.userId,
    action: `apply_enforcement_${params.action}`,
    details: { reason: params.reason, notes: params.notes, previousStatus, newStatus },
  });

  return {
    success: true,
    userId: params.userId,
    previousStatus,
    newStatus,
    isVisibilityRestricted: isRestricted,
  };
}

/**
 * Account Linking Engine (Repeat Offender Detection)
 * Scans for verified phone reuse, email reuse, and device/session indicators.
 */
export async function detectLinkedAccounts(
  client: SupabaseClient,
  userId: string
): Promise<Array<{ linkedUserId: string; confidenceScore: number; reasons: string[] }>> {
  const { data: targetProfile } = await client
    .from("profiles")
    .select("phone, email_normalized, phone_normalized")
    .eq("id", userId)
    .single();

  if (!targetProfile) return [];

  const matches: Map<string, { confidenceScore: number; reasons: string[] }> = new Map();

  // Scan phone reuse
  if (targetProfile.phone_normalized || targetProfile.phone) {
    const phoneVal = targetProfile.phone_normalized || targetProfile.phone;
    const { data: phoneMatches } = await client
      .from("profiles")
      .select("id")
      .or(`phone.eq.${phoneVal},phone_normalized.eq.${phoneVal}`)
      .neq("id", userId);

    (phoneMatches ?? []).forEach((p) => {
      const entry = matches.get(p.id) ?? { confidenceScore: 0, reasons: [] };
      entry.confidenceScore += 45;
      entry.reasons.push("Verified phone reuse");
      matches.set(p.id, entry);
    });
  }

  // Scan normalized email reuse
  if (targetProfile.email_normalized) {
    const { data: emailMatches } = await client
      .from("profiles")
      .select("id")
      .eq("email_normalized", targetProfile.email_normalized)
      .neq("id", userId);

    (emailMatches ?? []).forEach((p) => {
      const entry = matches.get(p.id) ?? { confidenceScore: 0, reasons: [] };
      entry.confidenceScore += 40;
      entry.reasons.push("Normalized email matching");
      matches.set(p.id, entry);
    });
  }

  const results: Array<{ linkedUserId: string; confidenceScore: number; reasons: string[] }> = [];

  for (const [linkedUserId, info] of matches.entries()) {
    const score = Math.min(100, info.confidenceScore);
    results.push({
      linkedUserId,
      confidenceScore: score,
      reasons: info.reasons,
    });

    if (score >= 60) {
      // Record linked account pair in DB
      await client.from("linked_accounts").upsert(
        {
          primary_user_id: userId,
          linked_user_id: linkedUserId,
          confidence_score: score,
          link_reasons: info.reasons,
          status: "detected",
        },
        { onConflict: "primary_user_id,linked_user_id" }
      );

      // Increase risk score for repeat offender suspicion
      await recordTrustEvent(client, {
        userId,
        eventType: "linked_account_detected",
        title: "Potential Linked Account Detected",
        description: `Confidence: ${score}%. Reasons: ${info.reasons.join(", ")}`,
        riskScoreDelta: 10,
        metadata: { linkedUserId, confidenceScore: score, reasons: info.reasons },
      });
    }
  }

  return results;
}

/**
 * Configurable Automated Enforcement Rules:
 * Evaluates Risk Score thresholds to automatically trigger Under Review or Visibility Restriction.
 */
export async function evaluateAutomatedEnforcementRules(
  client: SupabaseClient,
  userId: string
) {
  const profile = await getOrCreateTrustProfile(client, userId);

  // Risk Score >= 80: Apply Visibility Restriction automatically
  if (profile.risk_score >= 80 && profile.trust_status !== "restricted" && profile.trust_status !== "banned") {
    await applyEnforcementAction(client, {
      userId,
      action: "restricted",
      moderatorId: "system-risk-engine",
      reason: `Automated Rule Triggered: Risk Score reached ${profile.risk_score} (Threshold >= 80)`,
      notes: "System protection applied visibility restriction.",
    });
  }
  // Risk Score >= 60: Enter Under Review automatically
  else if (profile.risk_score >= 60 && profile.trust_status === "normal") {
    await applyEnforcementAction(client, {
      userId,
      action: "under_review",
      moderatorId: "system-risk-engine",
      reason: `Automated Rule Triggered: Risk Score reached ${profile.risk_score} (Threshold >= 60)`,
      notes: "System queued account for moderator review.",
    });
  }
}
