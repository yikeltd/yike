import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingPromotion, Property } from "@/types/database";
import {
  BOOST_PROMOTION_SCORE,
  BOOST_PROMOTION_TYPE,
  FEATURED_PROMOTION_TYPE,
  isFeaturedDurationDays,
  type BoostPlanId,
  type FeaturedDurationDays,
  type FeaturedPromotionStatus,
  type PromotionType,
} from "@/lib/featured-promotions/constants";
import { boostVariantKey, featuredVariantKey } from "@/lib/revenue-pricing/keys";
import { getRevenuePrice } from "@/lib/revenue-pricing/service";
import { generatePromotionReference } from "@/lib/featured-promotions/reference";
import { logPaymentAudit } from "@/lib/payments/audit";

export type CreateFeaturedPromotionInput = {
  listingId: string;
  userId: string;
  durationDays: FeaturedDurationDays;
};

export type CreateBoostPromotionInput = {
  listingId: string;
  userId: string;
  plan: BoostPlanId;
};

export type PromotionResult =
  | { ok: true; promotion: ListingPromotion }
  | { ok: false; error: string; code?: string };

/** @deprecated use PromotionResult */
export type FeaturedPromotionResult = PromotionResult;

export function computePromotionExpiresAt(
  durationDays: number,
  durationHours?: number | null,
  from: Date = new Date()
): Date {
  if (durationHours && durationHours > 0) {
    return new Date(from.getTime() + durationHours * 3_600_000);
  }
  return new Date(from.getTime() + durationDays * 86_400_000);
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

export async function hasBlockingPromotion(
  admin: SupabaseClient,
  listingId: string,
  promotionType: PromotionType
): Promise<boolean> {
  const { count } = await admin
    .from("listing_promotions")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .eq("promotion_type", promotionType)
    .in("status", ["pending", "paid", "active"]);

  return (count ?? 0) > 0;
}

export async function hasBlockingFeaturedPromotion(
  admin: SupabaseClient,
  listingId: string
): Promise<boolean> {
  return hasBlockingPromotion(admin, listingId, FEATURED_PROMOTION_TYPE);
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

  const amount = await getRevenuePrice(
    admin,
    "featured_listing",
    featuredVariantKey(input.durationDays)
  );
  if (amount == null) {
    return { ok: false, error: "Featured pricing unavailable" };
  }
  const promotionReference = generatePromotionReference("FP");

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

export async function createBoostPromotion(
  admin: SupabaseClient,
  input: CreateBoostPromotionInput
): Promise<PromotionResult> {
  const listing = await loadListingForPromotion(admin, input.listingId, input.userId);
  if (!listing) {
    return { ok: false, error: "Listing not found", code: "not_found" };
  }
  if (listing.status !== "approved") {
    return { ok: false, error: "Only approved listings can be boosted", code: "not_approved" };
  }
  if (new Date(listing.expires_at) <= new Date()) {
    return { ok: false, error: "Renew this listing before boosting", code: "listing_expired" };
  }

  const blocked = await hasBlockingPromotion(admin, input.listingId, BOOST_PROMOTION_TYPE);
  if (blocked) {
    return {
      ok: false,
      error: "This listing already has a pending or active boost",
      code: "promotion_exists",
    };
  }

  const plan = input.plan === "hours24" ? { durationHours: 24, durationDays: 0 } : { durationHours: null, durationDays: 7 };
  const amount = await getRevenuePrice(admin, "boost_listing", boostVariantKey(input.plan));
  if (amount == null) {
    return { ok: false, error: "Boost pricing unavailable" };
  }
  const promotionReference = generatePromotionReference("BP");

  const { data, error } = await admin
    .from("listing_promotions")
    .insert({
      listing_id: input.listingId,
      user_id: input.userId,
      promotion_type: BOOST_PROMOTION_TYPE,
      duration_days: plan.durationDays,
      duration_hours: plan.durationHours,
      boost_score: BOOST_PROMOTION_SCORE,
      amount,
      currency: "NGN",
      status: "pending",
      promotion_reference: promotionReference,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create boost" };
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
  const expiresAt = computePromotionExpiresAt(row.duration_days, row.duration_hours, now);
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

export async function activateBoostPromotion(
  admin: SupabaseClient,
  promotionId: string,
  actorId?: string | null
): Promise<PromotionResult> {
  const { data: promotion } = await admin
    .from("listing_promotions")
    .select("*")
    .eq("id", promotionId)
    .single();

  if (!promotion) {
    return { ok: false, error: "Promotion not found", code: "not_found" };
  }

  const row = promotion as ListingPromotion;
  if (row.promotion_type !== BOOST_PROMOTION_TYPE) {
    return { ok: false, error: "Not a boost promotion", code: "invalid_type" };
  }
  if (row.status === "active") {
    return { ok: true, promotion: row };
  }
  if (!["pending", "paid"].includes(row.status)) {
    return { ok: false, error: "Boost cannot be activated", code: "invalid_status" };
  }

  const { data: listing } = await admin
    .from("properties")
    .select("id, status")
    .eq("id", row.listing_id)
    .single();

  if (!listing || listing.status !== "approved") {
    return { ok: false, error: "Listing must be approved", code: "not_approved" };
  }

  const now = new Date();
  const expiresAt = computePromotionExpiresAt(row.duration_days, row.duration_hours, now);
  const nowIso = now.toISOString();
  const expiresIso = expiresAt.toISOString();
  const score = row.boost_score ?? BOOST_PROMOTION_SCORE;

  const { data: updatedPromotion, error: promoError } = await admin
    .from("listing_promotions")
    .update({
      status: "active",
      starts_at: nowIso,
      expires_at: expiresIso,
      boost_score: score,
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
      is_boosted: true,
      boosted_until: expiresIso,
      boost_score: score,
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

  if (row.status === "active" && row.promotion_type === FEATURED_PROMOTION_TYPE) {
    await admin
      .from("properties")
      .update({
        is_featured: false,
        featured_until: null,
        sponsored_status: "none",
        updated_at: nowIso,
      })
      .eq("id", row.listing_id);
  }

  if (row.status === "active" && row.promotion_type === BOOST_PROMOTION_TYPE) {
    await admin
      .from("properties")
      .update({
        is_boosted: false,
        boosted_until: null,
        boost_score: 0,
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

async function expireDuePromotionsByType(
  admin: SupabaseClient,
  promotionType: PromotionType,
  listingFlags: Record<string, unknown>
): Promise<{ expiredListings: number; expiredPromotions: number }> {
  const nowIso = new Date().toISOString();

  const { data: duePromotions } = await admin
    .from("listing_promotions")
    .select("id, listing_id, user_id")
    .eq("promotion_type", promotionType)
    .eq("status", "active")
    .not("expires_at", "is", null)
    .lt("expires_at", nowIso);

  const promoRows = duePromotions ?? [];
  const promoIds = promoRows.map((r) => r.id as string);
  let expiredPromotions = 0;
  let expiredListings = 0;

  if (promoIds.length > 0) {
    const { error } = await admin
      .from("listing_promotions")
      .update({ status: "expired", updated_at: nowIso })
      .in("id", promoIds);

    if (!error) {
      expiredPromotions = promoIds.length;
      const listingIds = [...new Set(promoRows.map((r) => r.listing_id as string))];
      if (listingIds.length > 0) {
        const { error: listingError } = await admin
          .from("properties")
          .update({ ...listingFlags, updated_at: nowIso })
          .in("id", listingIds);
        if (!listingError) expiredListings = listingIds.length;
      }

      for (const promo of promoRows) {
        if (promo.user_id) {
          logPaymentAudit({
            action: "promotion_expired",
            actorId: promo.user_id as string,
            targetId: promo.id as string,
            targetUserId: promo.user_id as string,
            metadata: { listing_id: promo.listing_id, promotion_type: promotionType },
          });
        }
      }
    }
  }

  return { expiredListings, expiredPromotions };
}

export async function expireDueFeaturedPromotions(
  admin: SupabaseClient
): Promise<{ expiredListings: number; expiredPromotions: number }> {
  return expireDuePromotionsByType(admin, FEATURED_PROMOTION_TYPE, {
    is_featured: false,
    featured_until: null,
    sponsored_status: "none",
  });
}

export async function expireDueBoostPromotions(
  admin: SupabaseClient
): Promise<{ expiredListings: number; expiredPromotions: number }> {
  return expireDuePromotionsByType(admin, BOOST_PROMOTION_TYPE, {
    is_boosted: false,
    boosted_until: null,
    boost_score: 0,
  });
}

export async function expireDueListingPromotions(
  admin: SupabaseClient
): Promise<{
  featured: { expiredListings: number; expiredPromotions: number };
  boost: { expiredListings: number; expiredPromotions: number };
}> {
  const [featured, boost] = await Promise.all([
    expireDueFeaturedPromotions(admin),
    expireDueBoostPromotions(admin),
  ]);
  return { featured, boost };
}

