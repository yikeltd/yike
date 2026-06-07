import type { SupabaseClient } from "@supabase/supabase-js";
import { recordTrustScoreEvent } from "@/lib/trust/score-engine/events";

export type SuspiciousFlagType =
  | "possible_duplicate"
  | "suspicious_pricing"
  | "low_image_quality"
  | "fraud_risk_score"
  | "moderation_flag"
  | "stale_listing";

type UpsertArgs = {
  propertyId: string;
  flagType: SuspiciousFlagType;
  severity?: "low" | "moderate" | "elevated" | "high";
  detail?: string;
  metadata?: Record<string, unknown>;
};

/** Idempotent admin-queue flag — does not auto-ban listings. */
export async function upsertSuspiciousPropertyFlag(
  admin: SupabaseClient,
  args: UpsertArgs
): Promise<void> {
  const { data: existing } = await admin
    .from("suspicious_property_flags")
    .select("id")
    .eq("property_id", args.propertyId)
    .eq("flag_type", args.flagType)
    .eq("status", "pending")
    .maybeSingle();

  if (existing?.id) {
    await admin
      .from("suspicious_property_flags")
      .update({
        severity: args.severity ?? "moderate",
        detail: args.detail ?? null,
        metadata: args.metadata ?? {},
      })
      .eq("id", existing.id);
    return;
  }

  await admin.from("suspicious_property_flags").insert({
    property_id: args.propertyId,
    flag_type: args.flagType,
    severity: args.severity ?? "moderate",
    status: "pending",
    detail: args.detail ?? null,
    metadata: args.metadata ?? {},
  });

  if (
    args.flagType === "fraud_risk_score" ||
    (args.severity === "high" && args.flagType !== "stale_listing")
  ) {
    void recordTrustScoreEvent(admin, {
      entityType: "listing",
      entityId: args.propertyId,
      eventType: args.flagType === "fraud_risk_score" ? "fraud_flag" : "suspicious_report",
      reason: args.detail ?? `Suspicious flag: ${args.flagType}`,
      metadata: { flagType: args.flagType, severity: args.severity },
    });
  }
}
