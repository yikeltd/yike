import type { AdvertisementDurationPlan, AdvertisementPlacement } from "@/lib/advertisements/constants";
import type { BoostPlanId, FeaturedDurationDays } from "@/lib/featured-promotions/constants";
import type { PropertyVerificationPackageId } from "@/lib/property-verification/packages";

export function featuredVariantKey(days: FeaturedDurationDays): string {
  return `${days}d`;
}

export function boostVariantKey(plan: BoostPlanId): string {
  return plan === "hours24" ? "24h" : "7d";
}

export function advertisementVariantKey(
  placement: AdvertisementPlacement,
  durationPlan: AdvertisementDurationPlan
): string {
  return `${placement}_${durationPlan}`;
}

export function propertyVerificationVariantKey(id: PropertyVerificationPackageId): string {
  return id;
}
