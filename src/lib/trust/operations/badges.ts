import type { SupabaseClient } from "@supabase/supabase-js";

export type TrustBadgeType =
  | "physically_reviewed"
  | "verification_requested"
  | "legal_review_available"
  | "trusted_agent"
  | "trusted_company";

type GrantArgs = {
  entityType: "property" | "agent" | "company";
  entityId: string;
  badgeType: TrustBadgeType;
  grantedBy?: string | null;
  expiresAt?: string | null;
  adminNotes?: string | null;
};

export async function grantTrustBadge(
  admin: SupabaseClient,
  args: GrantArgs
): Promise<void> {
  await admin.from("trust_badge_grants").upsert(
    {
      entity_type: args.entityType,
      entity_id: args.entityId,
      badge_type: args.badgeType,
      granted_by: args.grantedBy ?? null,
      granted_at: new Date().toISOString(),
      expires_at: args.expiresAt ?? null,
      revoked_at: null,
      admin_notes: args.adminNotes ?? null,
    },
    { onConflict: "entity_type,entity_id,badge_type" }
  );
}

export async function revokeTrustBadge(
  admin: SupabaseClient,
  args: Pick<GrantArgs, "entityType" | "entityId" | "badgeType">,
  reason?: string
): Promise<void> {
  await admin
    .from("trust_badge_grants")
    .update({
      revoked_at: new Date().toISOString(),
      admin_notes: reason ?? null,
    })
    .eq("entity_type", args.entityType)
    .eq("entity_id", args.entityId)
    .eq("badge_type", args.badgeType)
    .is("revoked_at", null);
}
