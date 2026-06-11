import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingPromotion, Property } from "@/types/database";
import {
  FEATURED_PROMOTION_TYPE,
  featuredPriceForDays,
  isFeaturedDurationDays,
  type FeaturedDurationDays,
  type FeaturedPromotionStatus,
} from "@/lib/featured-promotions/constants";
import { generatePromotionReference } from "@/lib/featured-promotions/reference";

export type CreateFeaturedPromotionInput = {
  listingId: string;
  userId: string;
  durationDays: FeaturedDurationDays;
};

export type FeaturedPromotionResult =
  | { ok: true; promotion: ListingPromotion }
  | { ok: false; error: string; code?: string };

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 86_400_000);
}

export async function loadListingForPromotion(
  admin: SupabaseClient,
  listingId: string,
  userId: string
): Promise<Property | null> {
  const { data } = await admin
    .from("properties")
    .select("id, agent_id, status, expires_at, is_featured, featured_until, title")
    .eq("id", listingId)
    .eq("agent_id", userId)
    .single();

  return (data as Property | null) ?? null;
}

export async function hasBlockingFeaturedPromotion(
  admin: SupabaseClient,
  listingId: string
): Promise<boolean> {
  const { count } = await admin
    .from("listing_promotions")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .eq("promotion_type", FEATURED_PROMOTION_TYPE)
    .in("status", ["pending", "paid", "active"]);

  return (count ?? 0) > 0;
}

export async function createFeaturedPromotion(
  admin: SupabaseClient,
  input: CreateFeaturedPromotionInput
): Promise<FeaturedPromotionResult> {
  if (!isFeaturedDurationDays(input.durationDays)) {
    return { ok: false, error: "Invalid promotion duration", code: "invalid_duration" };
  }

  const listing = await loadListingForPromotion(admin, input.listingId, input.userId);
  if (!listing) {
    return { ok: false, error: "Listing not found", code: "not_found" };
  }
  if (listing.status !== "approved") {
    return { ok: false, error: "Only approved listings can be promoted", code: "not_approved" };
  }
  if (new Date(listing.expires_at) <= new Date()) {
    return { ok: false, error: "Renew this listing before promoting", code: "listing_expired" };
  }

  const blocked = await hasBlockingFeaturedPromotion(admin, input.listingId);
  if (blocked) {
    return {
      ok: false,
      error: "This listing already has a pending or active promotion",
      code: "promotion_exists",
    };
  }

  const amount = featuredPriceForDays(input.durationDays);
  const promotionReference = generatePromotionReference();

  const { data, error } = await admin
    .from("listing_promotions")
    .insert({
      listing_id: input.listingId,
      user_id: input.userId,
      promotion_type: FEATURED_PROMOTION_TYPE,
      duration_days: input.durationDays,
      amount,
      currency: "NGN",
      status: "pending",
      promotion_reference: promotionReference,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create promotion" };
  }

  return { ok: true, promotion: data as ListingPromotion };
}

export async function activateFeaturedPromotion(
  admin: SupabaseClient,
  promotionId: string,
  actorId?: string | null
): Promise<FeaturedPromotionResult> {
  const { data: promotion } = await admin
    .from("listing_promotions")
    .select("*")
    .eq("id", promotionId)
    .single();

  if (!promotion) {
    return { ok: false, error: "Promotion not found", code: "not_found" };
  }

  const row = promotion as ListingPromotion;
  if (row.status === "active") {
    return { ok: true, promotion: row };
  }
  if (!["pending", "paid"].includes(row.status)) {
    return { ok: false, error: "Promotion cannot be activated", code: "invalid_status" };
  }

  const { data: listing } = await admin
    .from("properties")
    .select("id, status, expires_at")
    .eq("id", row.listing_id)
    .single();

  if (!listing || listing.status !== "approved") {
    return { ok: false, error: "Listing must be approved", code: "not_approved" };
  }

  const now = new Date();
  const expiresAt = addDays(now, row.duration_days);
  const nowIso = now.toISOString();
  const expiresIso = expiresAt.toISOString();

  const { data: updatedPromotion, error: promoError } = await admin
    .from("listing_promotions")
    .update({
      status: "active",
      starts_at: nowIso,
      expires_at: expiresIso,
      updated_at: nowIso,
    })
    .eq("id", promotionId)
    .select("*")
    .single();

  if (promoError || !updatedPromotion) {
    return { ok: false, error: promoError?.message ?? "Activation failed" };
  }

  const { error: listingError } = await admin
    .from("properties")
    .update({
      is_featured: true,
      featured_until: expiresIso,
      featured_tier: "basic",
      featured_reason: "paid_promotion",
      featured_by: actorId ?? row.user_id,
      featured_created_at: nowIso,
      boost_score: 50,
      sponsored_status: "boosted",
      updated_at: nowIso,
    })
    .eq("id", row.listing_id);

  if (listingError) {
    await admin
      .from("listing_promotions")
      .update({ status: row.status, starts_at: row.starts_at, expires_at: row.expires_at })
      .eq("id", promotionId);
    return { ok: false, error: listingError.message };
  }

  return { ok: true, promotion: updatedPromotion as ListingPromotion };
}

export async function expireFeaturedPromotion(
  admin: SupabaseClient,
  promotionId: string
): Promise<FeaturedPromotionResult> {
  const { data: promotion } = await admin
    .from("listing_promotions")
    .select("*")
    .eq("id", promotionId)
    .single();

  if (!promotion) {
    return { ok: false, error: "Promotion not found", code: "not_found" };
  }

  const row = promotion as ListingPromotion;
  if (row.status === "expired") {
    return { ok: true, promotion: row };
  }
  if (!["active", "pending", "paid"].includes(row.status)) {
    return { ok: false, error: "Promotion cannot be expired", code: "invalid_status" };
  }

  const nowIso = new Date().toISOString();

  const { data: updatedPromotion, error: promoError } = await admin
    .from("listing_promotions")
    .update({
      status: "expired",
      expires_at: row.expires_at ?? nowIso,
      updated_at: nowIso,
    })
    .eq("id", promotionId)
    .select("*")
    .single();

  if (promoError || !updatedPromotion) {
    return { ok: false, error: promoError?.message ?? "Expiration failed" };
  }

  if (row.status === "active") {
    await admin
      .from("properties")
      .update({
        is_featured: false,
        featured_until: null,
        boost_score: 0,
        sponsored_status: "none",
        updated_at: nowIso,
      })
      .eq("id", row.listing_id);
  }

  return { ok: true, promotion: updatedPromotion as ListingPromotion };
}

export async function cancelFeaturedPromotion(
  admin: SupabaseClient,
  promotionId: string
): Promise<FeaturedPromotionResult> {
  const { data: promotion } = await admin
    .from("listing_promotions")
    .select("*")
    .eq("id", promotionId)
    .single();

  if (!promotion) {
    return { ok: false, error: "Promotion not found", code: "not_found" };
  }

  const row = promotion as ListingPromotion;
  if (row.status === "cancelled") {
    return { ok: true, promotion: row };
  }
  if (!["pending", "paid"].includes(row.status)) {
    return { ok: false, error: "Only pending promotions can be cancelled", code: "invalid_status" };
  }

  const nowIso = new Date().toISOString();
  const { data: updated, error } = await admin
    .from("listing_promotions")
    .update({ status: "cancelled", updated_at: nowIso })
    .eq("id", promotionId)
    .select("*")
    .single();

  if (error || !updated) {
    return { ok: false, error: error?.message ?? "Cancellation failed" };
  }

  return { ok: true, promotion: updated as ListingPromotion };
}

export async function expireDueFeaturedPromotions(
  admin: SupabaseClient
): Promise<{ expiredListings: number; expiredPromotions: number }> {
  const nowIso = new Date().toISOString();

  const { data: dueListings } = await admin
    .from("properties")
    .select("id")
    .eq("is_featured", true)
    .not("featured_until", "is", null)
    .lt("featured_until", nowIso);

  const listingIds = (dueListings ?? []).map((r) => r.id as string);
  let expiredListings = 0;

  if (listingIds.length > 0) {
    const { error } = await admin
      .from("properties")
      .update({
        is_featured: false,
        featured_until: null,
        boost_score: 0,
        sponsored_status: "none",
        updated_at: nowIso,
      })
      .in("id", listingIds);

    if (!error) expiredListings = listingIds.length;
  }

  const { data: duePromotions } = await admin
    .from("listing_promotions")
    .select("id")
    .eq("status", "active")
    .not("expires_at", "is", null)
    .lt("expires_at", nowIso);

  const promoIds = (duePromotions ?? []).map((r) => r.id as string);
  let expiredPromotions = 0;

  if (promoIds.length > 0) {
    const { error } = await admin
      .from("listing_promotions")
      .update({ status: "expired", updated_at: nowIso })
      .in("id", promoIds);

    if (!error) expiredPromotions = promoIds.length;
  }

  return { expiredListings, expiredPromotions };
}

export function promotionStatusLabel(status: FeaturedPromotionStatus): string {
  const labels: Record<FeaturedPromotionStatus, string> = {
    pending: "Pending",
    paid: "Paid",
    active: "Active",
    expired: "Expired",
    cancelled: "Cancelled",
    failed: "Failed",
  };
  return labels[status];
}
