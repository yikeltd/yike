import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LEAD_QUALITY_SCORE,
  type ListingLeadType,
} from "@/lib/listing-leads/constants";
import { inferLeadSource } from "@/lib/listing-leads/sources";
import { notifySellerNewLead } from "@/lib/listing-leads/notify";

export type CaptureListingLeadInput = {
  listingId?: string | null;
  sellerId: string;
  leadUserId?: string | null;
  leadType: ListingLeadType;
  sourcePage?: string | null;
  placement?: string | null;
  isFeatured?: boolean;
  isBoosted?: boolean;
  profilePage?: "agency" | "developer" | null;
  legacyLeadId?: string | null;
  leadUserDisplay?: string | null;
  listingTitle?: string | null;
};

const DEDUPE_MINUTES = 15;

export async function captureListingLead(
  admin: SupabaseClient,
  input: CaptureListingLeadInput
): Promise<{ ok: boolean; id?: string; skipped?: boolean }> {
  if (!input.sellerId) return { ok: false };
  if (input.leadUserId && input.leadUserId === input.sellerId) {
    return { ok: true, skipped: true };
  }

  const since = new Date(Date.now() - DEDUPE_MINUTES * 60_000).toISOString();
  let dedupeQuery = admin
    .from("listing_leads")
    .select("id")
    .eq("seller_id", input.sellerId)
    .eq("lead_type", input.leadType)
    .gte("created_at", since)
    .limit(1);

  if (input.listingId) dedupeQuery = dedupeQuery.eq("listing_id", input.listingId);
  if (input.leadUserId) dedupeQuery = dedupeQuery.eq("lead_user_id", input.leadUserId);

  const { data: dup } = await dedupeQuery.maybeSingle();
  if (dup?.id) return { ok: true, skipped: true, id: dup.id as string };

  const leadSource = inferLeadSource({
    sourcePage: input.sourcePage,
    placement: input.placement,
    isFeatured: input.isFeatured,
    isBoosted: input.isBoosted,
    profilePage: input.profilePage,
  });

  const now = new Date().toISOString();
  const metadata: Record<string, unknown> = {};
  if (input.leadUserDisplay) metadata.lead_display = input.leadUserDisplay;
  if (input.listingTitle) metadata.listing_title = input.listingTitle;

  const { data, error } = await admin
    .from("listing_leads")
    .insert({
      listing_id: input.listingId ?? null,
      seller_id: input.sellerId,
      lead_user_id: input.leadUserId ?? null,
      lead_type: input.leadType,
      status: "new",
      lead_source: leadSource,
      quality_score: LEAD_QUALITY_SCORE[input.leadType],
      metadata,
      legacy_lead_id: input.legacyLeadId ?? null,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.warn("[listing-leads/capture]", error?.message);
    return { ok: false };
  }

  void notifySellerNewLead(admin, {
    sellerId: input.sellerId,
    leadId: data.id as string,
    leadType: input.leadType,
    listingTitle: input.listingTitle,
  });

  return { ok: true, id: data.id as string };
}
