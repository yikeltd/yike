import { Suspense } from "react";
import { HeaderUniversalSearch } from "@/components/search/header-universal-search";
import {
  QuickFilterChips,
  PROPERTY_QUICK_FILTERS,
  VEHICLE_QUICK_FILTERS,
} from "@/components/marketplace/experience";
import type { QuickFilterChip } from "@/components/marketplace/experience";

type Vertical = "property" | "vehicle";

const CHIPS: Record<Vertical, QuickFilterChip[]> = {
  property: PROPERTY_QUICK_FILTERS,
  vehicle: VEHICLE_QUICK_FILTERS,
};

const BASE: Record<Vertical, string> = {
  property: "/search",
  vehicle: "/vehicles",
};

/** Initial browse only — not shown after the user submits a search. */
export function MarketplaceDiscoverySearch({
  vertical,
}: {
  vertical: Vertical;
}) {
  return (
    <div className="space-y-3" data-testid="marketplace-discovery-search">
      <HeaderUniversalSearch size="large" tone="desktop" showLocation />
      <Suspense fallback={null}>
        <QuickFilterChips
          chips={CHIPS[vertical]}
          basePath={BASE[vertical] as "/search" | "/vehicles"}
        />
      </Suspense>
    </div>
  );
}
