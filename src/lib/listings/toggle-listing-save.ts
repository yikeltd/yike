import type { Property } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isGuestFavorite, toggleGuestFavorite } from "@/lib/guest-favorites";
import { recordEngagementSave } from "@/lib/engagement";
import { trackSavedListing } from "@/lib/browse-preferences";
import { trackEvent } from "@/lib/analytics";

export type ListingSaveAnalyticsContext = {
  city?: string | null;
  area?: string | null;
  listingType?: string | null;
  propertyType?: string | null;
  source:
    | "account"
    | "guest"
    | "card"
    | "detail"
    | "swipe"
    | "swipe_guest";
};

export type ToggleListingSaveInput = {
  listingId: string;
  currentlySaved: boolean;
  userId: string | null | undefined;
  analytics?: ListingSaveAnalyticsContext;
  sellerId?: string | null;
  listingTitle?: string | null;
  sourcePage?: string;
};

export type ToggleListingSaveResult =
  | { ok: true; saved: boolean }
  | { ok: false; saved: boolean; error: string };

function browseContextFromProperty(property: Property): Pick<
  ListingSaveAnalyticsContext,
  "city" | "area" | "listingType" | "propertyType"
> {
  return {
    city: property.city,
    area: property.area,
    listingType: property.listing_type,
    propertyType: property.property_type,
  };
}

export function listingSaveAnalyticsFromProperty(
  property: Property,
  source: ListingSaveAnalyticsContext["source"],
): ListingSaveAnalyticsContext {
  return { ...browseContextFromProperty(property), source };
}

/** Guest-only toggle; returns next saved state. */
export function toggleGuestListingSave(listingId: string): boolean {
  return toggleGuestFavorite(listingId);
}

export function toggleGuestListingSaveWithAnalytics(
  listingId: string,
  analytics?: ListingSaveAnalyticsContext,
): boolean {
  const next = toggleGuestListingSave(listingId);
  trackSaveSideEffects(listingId, analytics, next);
  return next;
}

export function readGuestListingSaved(listingId: string): boolean {
  return isGuestFavorite(listingId);
}

function trackSaveSideEffects(
  listingId: string,
  analytics: ListingSaveAnalyticsContext | undefined,
  saved: boolean,
) {
  if (!analytics) return;
  const { city, area, listingType, propertyType, source } = analytics;
  if (saved) {
    recordEngagementSave();
    trackSavedListing(
      listingId,
      city
        ? {
            city,
            area: area ?? undefined,
            listingType: listingType ?? undefined,
            propertyType: propertyType ?? undefined,
          }
        : undefined,
    );
    trackEvent("save_listing", {
      listing_id: listingId,
      city: city ?? undefined,
      source,
    });
  } else {
    trackEvent("unsave_listing", {
      listing_id: listingId,
      city: city ?? undefined,
      source,
    });
  }
}

async function captureSaveLead(input: ToggleListingSaveInput) {
  if (!input.sellerId || input.currentlySaved) return;
  try {
    await fetch("/api/listing-leads/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadType: "save",
        listingId: input.listingId,
        sellerId: input.sellerId,
        listingTitle: input.listingTitle,
        sourcePage: input.sourcePage ?? "",
      }),
    });
  } catch {
    /* non-blocking */
  }
}

/** Authenticated save/unsave against Supabase favorites (property_id column). */
export async function toggleAuthenticatedListingSave(
  input: ToggleListingSaveInput,
): Promise<ToggleListingSaveResult> {
  const { listingId, currentlySaved, userId } = input;
  if (!userId) {
    return { ok: false, saved: currentlySaved, error: "not_authenticated" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, saved: currentlySaved, error: "supabase_unconfigured" };
  }
  const supabase = createClient();
  if (!supabase) {
    return { ok: false, saved: currentlySaved, error: "supabase_client" };
  }

  if (currentlySaved) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("property_id", listingId);
    if (error) {
      return { ok: false, saved: true, error: error.message };
    }
    trackSaveSideEffects(listingId, input.analytics, false);
    return { ok: true, saved: false };
  }

  const { error } = await supabase.from("favorites").insert({
    user_id: userId,
    property_id: listingId,
  });
  if (error) {
    return { ok: false, saved: false, error: error.message };
  }
  trackSaveSideEffects(listingId, input.analytics, true);
  if (!input.currentlySaved) {
    void captureSaveLead(input);
  }
  return { ok: true, saved: true };
}

export function listingSaveAriaLabel(saved: boolean): string {
  return saved ? "Remove saved listing" : "Save listing";
}

/** Shared overlay button classes for listing cards (image corner). */
export const LISTING_SAVE_CARD_OVERLAY_CLASS =
  "pointer-events-auto pressable inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-navy/10 bg-white/95 text-navy shadow-sm backdrop-blur-sm transition-[transform,background-color,box-shadow] duration-200 ease-out hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:scale-100";

export const LISTING_SAVE_CARD_OVERLAY_ICON_CLASS = "h-[18px] w-[18px]";
