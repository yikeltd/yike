import type { MarketplaceLocation } from "@/lib/marketplace-location/types";
import type { DiscoverFilterState } from "@/lib/discover/filters";

/** Default Discover scope: user's state, no city pin (statewide deck). */
export function discoverStateScopeFromMarketplaceLocation(
  loc: Pick<MarketplaceLocation, "state" | "city"> | null | undefined,
): Pick<DiscoverFilterState, "state" | "city"> {
  const state = loc?.state?.trim() ?? "";
  if (!state) {
    return { state: "", city: "" };
  }
  return { state, city: "" };
}

export function discoverLocationPillLabel(
  filters: Pick<DiscoverFilterState, "state" | "city">,
): string {
  const city = filters.city?.trim() ?? "";
  const state = filters.state?.trim() ?? "";
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return `${state} statewide`;
  return "All Nigeria";
}
