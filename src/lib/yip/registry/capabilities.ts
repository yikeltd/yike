/**
 * Typed capability id constants. Import these instead of hand-typing string
 * literals so renames/refactors are compiler-checked.
 */
import { toCapabilityId } from "../shared/types";

export const CAPABILITIES = {
  VEHICLE_KNOWLEDGE: toCapabilityId("vehicle.knowledge"),
  PROPERTY_KNOWLEDGE: toCapabilityId("property.knowledge"),
  LOCATION_KNOWLEDGE: toCapabilityId("location.knowledge"),
  MARKET_KNOWLEDGE: toCapabilityId("market.knowledge"),
  PHOTO_KNOWLEDGE: toCapabilityId("photo.knowledge"),
  RECOMMENDATION_ENGINE: toCapabilityId("recommendation.engine"),
  PRICING_ENGINE: toCapabilityId("pricing.engine"),
  TRUST_ASSESSMENT: toCapabilityId("trust.assessment"),
  MEDIA_ANALYSIS: toCapabilityId("media.analysis"),
} as const;

export type CapabilityKey = keyof typeof CAPABILITIES;
