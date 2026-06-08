import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdaptiveTrustLevel } from "./constants";

function caseRef(): string {
  return `TRQ-${Math.floor(100000 + Math.random() * 900000)}`;
}

export async function escalateUserTrust(
  client: SupabaseClient,
  params: {
    userId: string;
    level: AdaptiveTrustLevel;
    reason: string;
    openedBy: string;
    caseType?: string;
    suspicionScore?: number;
    signals?: Record<string, unknown>;
    requiredActions?: string[];
    listingId?: string | null;
  }
): Promise<{ caseId: string; reference: string } | null> {
  let ref = caseRef();
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await client
      .from("trust_review_cases")
      .select("id")
      .eq("case_reference", ref)
      .maybeSingle();
    if (!clash) break;
    ref = caseRef();
  }

  const verificationRequired = params.level >= 4;

  const { error: profileError } = await client
    .from("profiles")
    .update({
      adaptive_trust_level: params.level,
      verification_required: verificationRequired,
      verification_escalation_reason: params.reason,
      verification_escalated_at: new Date().toISOString(),
      verification_escalated_by: params.openedBy,
      account_status:
        params.level >= 5 ? "on_hold" : verificationRequired ? "pending_verification" : "active",
    })
    .eq("id", params.userId);

  if (profileError) return null;

  const { data, error } = await client
    .from("trust_review_cases")
    .insert({
      case_reference: ref,
      user_id: params.userId,
      listing_id: params.listingId ?? null,
      case_type: params.caseType ?? "escalated_user",
      priority: params.level >= 5 ? "urgent" : params.level >= 4 ? "high" : "normal",
      status: "open",
      suspicion_score: params.suspicionScore ?? params.level * 15,
      reason: params.reason,
      signals: params.signals ?? {},
      required_actions: params.requiredActions ?? [],
      opened_by: params.openedBy,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return { caseId: data.id as string, reference: ref };
}

export async function restoreUserTrust(
  client: SupabaseClient,
  params: {
    userId: string;
    targetLevel: AdaptiveTrustLevel;
    resolvedBy: string;
    caseId?: string;
    resolutionAction: string;
    note?: string;
  }
): Promise<boolean> {
  const restored = params.targetLevel < 4;
  const { error: profileError } = await client
    .from("profiles")
    .update({
      adaptive_trust_level: params.targetLevel,
      adaptive_trust_override: null,
      verification_required: !restored,
      verification_escalation_reason: restored ? null : params.note ?? null,
      verification_escalated_at: restored ? null : undefined,
      verification_escalated_by: restored ? null : undefined,
      account_status: params.targetLevel >= 5 ? "on_hold" : "active",
      ...(restored ? { profile_status: "active" as const } : {}),
    })
    .eq("id", params.userId);

  if (profileError) return false;

  if (params.caseId) {
    await client
      .from("trust_review_cases")
      .update({
        status: "resolved",
        resolution_action: params.resolutionAction,
        resolved_by: params.resolvedBy,
        resolved_at: new Date().toISOString(),
        admin_notes: params.note ?? null,
      })
      .eq("id", params.caseId);
  }

  return true;
}

export async function addTrustAdminNote(
  client: SupabaseClient,
  params: { userId: string; authorId: string; note: string }
): Promise<boolean> {
  const { error } = await client.from("trust_admin_notes").insert({
    user_id: params.userId,
    author_id: params.authorId,
    note: params.note,
  });
  return !error;
}
