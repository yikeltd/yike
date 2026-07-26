import type { FeeTransparencyMode, Property } from "@/types/database";
import { resolvePlacementKind } from "@/lib/marketplace/placement";

const NEGOTIABLE_MODES = new Set<FeeTransparencyMode>([
  "negotiable",
  "not_fixed",
]);

export type ListingBadgeKind =
  | "verified"
  | "yike_verified"
  | "featured"
  | "trending"
  | "premium"
  | "new"
  | "negotiable"
  | "sold"
  | "rented";

function hasNegotiableFees(property: Property): boolean {
  const extras = property.extras;
  if (!extras) return false;
  const modes = [
    extras.agency_fee_mode,
    extras.caution_fee_mode,
    extras.agreement_fee_mode,
  ];
  return modes.some((m) => m && NEGOTIABLE_MODES.has(m));
}

function isSoldOrRented(property: Property): ListingBadgeKind | null {
  const avail = property.availability_status;
  if (avail === "sold") return "sold";
  if (avail === "rented" || property.status === "rented") return "rented";
  return null;
}

/** Which presentation badges to show on a listing (detail / cards). */
export function resolveListingBadges(
  property: Pick<
    Property,
    | "is_verified_listing"
    | "yike_verified"
    | "is_featured"
    | "featured_until"
    | "is_boosted"
    | "boosted_until"
    | "is_premium_deal"
    | "status"
    | "availability_status"
    | "listing_type"
    | "extras"
    | "created_at"
    | "updated_at"
    | "last_refreshed_at"
    | "views_count"
    | "contact_clicks"
  >,
  options?: { agentVerified?: boolean; featuredActive?: boolean }
): ListingBadgeKind[] {
  const badges: ListingBadgeKind[] = [];
  const closed = isSoldOrRented(property as Property);
  if (closed) {
    badges.push(closed);
    return badges;
  }

  // Trust first — never purchasable, may coexist with one placement badge.
  if (property.yike_verified || property.is_verified_listing || options?.agentVerified) {
    badges.push("verified");
  }
  if (property.yike_verified) {
    badges.push("yike_verified");
  }

  // Max one placement badge: Featured > Trending > New.
  const placement =
    options?.featuredActive === true
      ? ("featured" as const)
      : resolvePlacementKind(property);
  if (placement === "featured") {
    badges.push("featured");
  } else if (placement === "trending") {
    badges.push("trending");
  } else if (placement === "new") {
    badges.push("new");
  } else if (property.is_premium_deal) {
    // Editorial premium only when no higher placement applies.
    badges.push("premium");
  }

  if (hasNegotiableFees(property as Property)) {
    badges.push("negotiable");
  }

  return badges;
}
