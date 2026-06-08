import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdaptiveTrustLevel } from "./constants";
import { escalateUserTrust, restoreUserTrust } from "./escalate";
import { deriveVerificationState, levelForEnforcementAction } from "./status-states";
import {
  getRequiredVerificationTasks,
  serializeRequiredTasks,
} from "./tasks";
import type { VerificationControlConfig } from "./config";
import type { TrustProfileSlice } from "./levels";

export type EnforcementAction =
  | "require_whatsapp"
  | "require_bank"
  | "require_enhanced_review"
  | "restrict_listing"
  | "pause_leads"
  | "escalate_trust"
  | "restore_trust"
  | "remove_escalation"
  | "revoke_verification";

export const ENFORCEMENT_ACTION_LABELS: Record<EnforcementAction, string> = {
  require_whatsapp: "Require WhatsApp verification",
  require_bank: "Require bank verification",
  require_enhanced_review: "Require enhanced review",
  restrict_listing: "Restrict listing temporarily",
  pause_leads: "Pause lead access",
  escalate_trust: "Escalate trust level",
  restore_trust: "Restore trust access",
  remove_escalation: "Remove escalation",
  revoke_verification: "Revoke verification",
};

const ACTION_TO_REVIEW: Partial<Record<EnforcementAction, string>> = {
  require_whatsapp: "require_whatsapp_review",
  require_bank: "require_bank_verification",
  require_enhanced_review: "request_verification",
  restrict_listing: "pause_listings",
  pause_leads: "pause_listings",
};

export async function applyEnforcementAction(
  client: SupabaseClient,
  params: {
    userId: string;
    action: EnforcementAction;
    reason: string;
    actorId: string;
    config?: VerificationControlConfig;
    currentLevel?: number;
  }
): Promise<{ ok: boolean; caseId?: string; reference?: string }> {
  const { data: profile } = await client
    .from("profiles")
    .select("*")
    .eq("id", params.userId)
    .single();

  if (!profile) return { ok: false };

  const current = Number(params.currentLevel ?? profile.adaptive_trust_level ?? 0);
  const restoreActions: EnforcementAction[] = [
    "restore_trust",
    "remove_escalation",
  ];

  if (restoreActions.includes(params.action)) {
    const target = (params.action === "revoke_verification"
      ? 1
      : levelForEnforcementAction(params.action) ?? 2) as AdaptiveTrustLevel;

    const ok = await restoreUserTrust(client, {
      userId: params.userId,
      targetLevel: target,
      resolvedBy: params.actorId,
      resolutionAction: params.action,
      note: params.reason,
    });

    if (ok) {
      await syncProfileVerificationMeta(client, params.userId, params.config);
    }
    return { ok };
  }

  if (params.action === "revoke_verification") {
    await client
      .from("profiles")
      .update({
        verified_badge: false,
        verification_status: "pending",
        adaptive_trust_level: 1,
        verification_required: true,
      })
      .eq("id", params.userId);
    await syncProfileVerificationMeta(client, params.userId, params.config);
    return { ok: true };
  }

  const mappedLevel = levelForEnforcementAction(params.action);
  const level = Math.max(
    current + (params.action === "escalate_trust" ? 1 : 0),
    mappedLevel ?? 4
  ) as AdaptiveTrustLevel;

  const requiredActions = ACTION_TO_REVIEW[params.action]
    ? [ACTION_TO_REVIEW[params.action]!]
    : [];

  const result = await escalateUserTrust(client, {
    userId: params.userId,
    level: Math.min(5, level) as AdaptiveTrustLevel,
    reason: params.reason,
    openedBy: params.actorId,
    caseType: "manual",
    requiredActions,
  });

  if (result) {
    await syncProfileVerificationMeta(client, params.userId, params.config, requiredActions);
  }

  return { ok: Boolean(result), ...result ?? {} };
}

export async function syncProfileVerificationMeta(
  client: SupabaseClient,
  userId: string,
  config?: VerificationControlConfig,
  escalationActions: string[] = []
): Promise<void> {
  const { data: profile } = await client.from("profiles").select("*").eq("id", userId).single();
  if (!profile) return;

  const slice = profile as TrustProfileSlice;
  const state = deriveVerificationState(slice);
  const tasks = getRequiredVerificationTasks(slice, config, escalationActions);

  await client
    .from("profiles")
    .update({
      verification_state: state,
      required_verification_tasks: serializeRequiredTasks(tasks),
    })
    .eq("id", userId);
}

export async function applyBulkEnforcement(
  client: SupabaseClient,
  params: {
    userIds: string[];
    action: EnforcementAction;
    reason: string;
    actorId: string;
  }
): Promise<{ succeeded: string[]; failed: string[] }> {
  const succeeded: string[] = [];
  const failed: string[] = [];

  for (const userId of params.userIds) {
    const result = await applyEnforcementAction(client, { ...params, userId });
    if (result.ok) succeeded.push(userId);
    else failed.push(userId);
  }

  return { succeeded, failed };
}
