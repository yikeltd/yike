import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingLeadType } from "@/lib/listing-leads/constants";
import { isValidUuid, validateLeadRequest } from "@/lib/leads/validation";
import { normalizeAssetType } from "@/lib/marketplace/listings";

const ASSET_TYPES = new Set(["PROPERTY", "VEHICLE", "ELECTRONICS"]);

/** Lead types that must reference an eligible published listing row. */
export const LISTING_BOUND_LEAD_TYPES = new Set<ListingLeadType>([
  "whatsapp",
  "call",
  "save",
  "message",
  "verification_request",
]);

export function isListingBoundLeadType(leadType: ListingLeadType): boolean {
  return LISTING_BOUND_LEAD_TYPES.has(leadType);
}

export type ValidateCaptureResult =
  | { ok: true; sellerId: string; listingId: string | null }
  | { ok: false; status: number; error: string };

function notFoundListing(): ValidateCaptureResult {
  return { ok: false, status: 404, error: "Listing not found" };
}

/**
 * Server-side binding for POST /api/listing-leads/capture — never trust client sellerId
 * for listing-bound leads without validating the properties row.
 */
export async function validateListingLeadCaptureRequest(
  admin: SupabaseClient,
  input: {
    leadType: ListingLeadType;
    listingId: string | null;
    sellerId: string;
    assetType?: string | null;
  }
): Promise<ValidateCaptureResult> {
  const sellerId = input.sellerId.trim();
  if (!isValidUuid(sellerId)) {
    return { ok: false, status: 400, error: "Invalid sellerId" };
  }

  if (isListingBoundLeadType(input.leadType)) {
    const listingId = input.listingId?.trim() ?? "";
    if (!listingId || !isValidUuid(listingId)) {
      return { ok: false, status: 400, error: "listingId required" };
    }

    const validation = await validateLeadRequest(admin, listingId, sellerId);
    if (!validation.ok) {
      if (
        validation.code === "agent_listing_mismatch" ||
        validation.code === "listing_not_found" ||
        validation.code === "agent_not_found"
      ) {
        return notFoundListing();
      }
      if (validation.code === "invalid_ids" || validation.code === "missing_ids") {
        return { ok: false, status: 400, error: "Invalid request" };
      }
      // Ineligible (expired, hidden, suspended agent, …) — do not attribute lead
      return notFoundListing();
    }

    const assetRaw = input.assetType?.trim().toUpperCase() ?? "";
    if (assetRaw && ASSET_TYPES.has(assetRaw)) {
      const { data: row } = await admin
        .from("properties")
        .select("agent_id, asset_type")
        .eq("id", listingId)
        .maybeSingle();
      const rowAsset = normalizeAssetType(String(row?.asset_type ?? "")).toUpperCase();
      if (!row?.agent_id || rowAsset !== assetRaw || row.agent_id !== validation.agent.id) {
        return notFoundListing();
      }
    }

    return {
      ok: true,
      sellerId: validation.agent.id,
      listingId,
    };
  }

  if (input.leadType === "follow") {
    if (input.listingId?.trim()) {
      return { ok: false, status: 400, error: "listingId not allowed for follow leads" };
    }
    const { data: profile } = await admin
      .from("profiles")
      .select("id, is_banned, profile_status")
      .eq("id", sellerId)
      .maybeSingle();
    if (!profile || profile.is_banned || profile.profile_status === "deleted") {
      return { ok: false, status: 404, error: "Seller not found" };
    }
    return { ok: true, sellerId, listingId: null };
  }

  return { ok: false, status: 400, error: "Invalid lead type" };
}
