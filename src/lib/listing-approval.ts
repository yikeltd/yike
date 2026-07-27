import { revalidatePath, revalidateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertCanPublishListing } from "@/lib/seller-trust";
import { recordListingHistoryEvent } from "@/lib/listing-history/record";
import { saveReviewDecision } from "@/lib/review-memory/memory";
import { applyReviewTrustImpact } from "@/lib/review-memory/trust-impact";
import type { ReviewDecisionType } from "@/lib/review-memory/constants";
import type { Property, PropertyStatus, Profile } from "@/types/database";

export interface ApproveListingParams {
  listingId: string;
  adminId: string;
  adminRole?: string;
  agentVerified?: boolean;
  note?: string;
  decisionType?: ReviewDecisionType;
  ip?: string;
}

export interface ApproveListingResult {
  ok: boolean;
  listing?: Property;
  error?: string;
  code?: string;
}

export interface InvalidateListingCacheParams {
  listingId: string;
  slug?: string | null;
  assetType?: string | null;
}

/**
 * Triggers Next.js ISR cache invalidation across all affected paths and tags.
 */
export function invalidateListingCaches({
  slug,
  assetType,
}: InvalidateListingCacheParams): { revalidatedPaths: string[]; revalidatedTags: string[] } {
  const paths: string[] = ["/", "/properties", "/agent", "/agent/listings", "/lex/auth/listings"];
  const tags: string[] = ["properties", "listings"];

  if (slug) {
    paths.push(`/properties/${slug}`);
  }
  if (assetType === "VEHICLE") {
    paths.push("/cars");
    tags.push("vehicles");
  }

  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch {
      // Invalidation warning ignored in non-Next server contexts
    }
  }

  for (const tag of tags) {
    try {
      revalidateTag(tag, "max");
    } catch {
      // Invalidation warning ignored in non-Next server contexts
    }
  }

  return { revalidatedPaths: paths, revalidatedTags: tags };
}

/**
 * Centralized, atomic listing approval pipeline.
 * Ensures every publication field, trigger bypass, event log, and cache invalidation
 * occurs consistently without stale states.
 */
export async function approveListingInPipeline(
  admin: SupabaseClient,
  params: ApproveListingParams
): Promise<ApproveListingResult> {
  const startedAt = Date.now();
  const { listingId, adminId, adminRole = "admin", agentVerified, note, decisionType = "approved" } = params;

  // 1. Fetch current listing + agent profile
  const { data: existing, error: fetchErr } = await admin
    .from("properties")
    .select(
      `*, agent:profiles!properties_agent_id_fkey (
        id, email_verified, phone_verified, whatsapp_verification_status,
        whatsapp_verified_at, verification_status, verified_badge, role,
        is_banned, account_status, profile_status
      )`
    )
    .eq("id", listingId)
    .single();

  if (fetchErr || !existing) {
    console.error(`[listing-approval] FAILURE listing=${listingId} reason=not_found error=${fetchErr?.message}`);
    return { ok: false, error: fetchErr?.message || "Listing not found" };
  }

  const property = existing as Property & { agent: Profile | null };

  // 2. Enforce Seller Verification Gate
  if (property.agent) {
    const publishGate = assertCanPublishListing(property.agent);
    if (!publishGate.ok) {
      console.warn(`[listing-approval] GATE_DENIED listing=${listingId} agent=${property.agent_id} code=${publishGate.code}`);
      return {
        ok: false,
        error: publishGate.error,
        code: publishGate.code,
      };
    }
  }

  const now = new Date();
  const nowIso = now.toISOString();

  // 3. Ensure valid future expiration date (guarantees expires_at > NOW())
  let expiresAtIso = property.expires_at;
  if (!expiresAtIso || new Date(expiresAtIso).getTime() <= now.getTime()) {
    const durationDays = property.listing_duration_days || 14;
    expiresAtIso = new Date(now.getTime() + durationDays * 86_400_000).toISOString();
  }

  // 4. Construct Atomic Database Publication Patch
  const patch: Record<string, unknown> = {
    status: "approved" as PropertyStatus,
    moderation_state: "approved",
    listing_activity_status: "active",
    approved_at: nowIso,
    approved_by: adminId,
    last_refreshed_at: nowIso,
    expires_at: expiresAtIso,
    review_hold_status: "none",
    possible_duplicate: false,
    duplicate_confidence_score: null,
    updated_at: nowIso,
  };

  if (agentVerified !== undefined) {
    patch.is_verified_listing = agentVerified;
  }
  if (note?.trim()) {
    patch.moderation_note = note.trim();
  }

  // 5. Update Database Record
  const { data: updated, error: updateErr } = await admin
    .from("properties")
    .update(patch)
    .eq("id", listingId)
    .select()
    .single();

  if (updateErr || !updated) {
    console.error(`[listing-approval] FAILURE listing=${listingId} reason=db_update_failed error=${updateErr?.message}`);
    return { ok: false, error: updateErr?.message || "Failed to update listing status" };
  }

  // 6. Record Events & Intelligence Memory
  void recordListingHistoryEvent(admin, {
    listingId,
    eventType: "admin_reviewed",
    oldValue: { status: property.status },
    newValue: { status: "approved", action: "approve" },
    actorId: adminId,
    actorRole: adminRole,
    source: "approval_pipeline",
    publicVisible: false,
    internalNote: note?.trim() || null,
  });

  void saveReviewDecision(admin, {
    listing: property,
    decisionType,
    decisionReason: note,
    adminId,
    extraSignals: { pipeline: "approveListingInPipeline" },
  });

  if (property.agent_id) {
    void applyReviewTrustImpact(admin, {
      agentId: property.agent_id,
      listingId,
      decisionType,
      adminId,
      reason: note,
    });
  }

  // 7. Invalidate Cache & ISR
  const cacheResult = invalidateListingCaches({
    listingId,
    slug: (updated as Property).slug,
    assetType: (updated as Property).asset_type,
  });

  // 8. Telemetry Logging
  console.log(
    `[listing-approval] SUCCESS listing=${listingId} previous_status=${property.status} new_status=approved moderator=${adminId} expires_at=${expiresAtIso} durationMs=${Date.now() - startedAt} revalidated_paths=${cacheResult.revalidatedPaths.length}`
  );

  return { ok: true, listing: updated as Property };
}
