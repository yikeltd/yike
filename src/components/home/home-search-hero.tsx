"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getStateForCity } from "@/lib/constants";
import { budgetValueFromSearchParams } from "@/lib/budget-ranges";
import { chipKeyFromParams, type Initial } from "@/lib/home-search-params";
import { saveBrowsePreferences } from "@/lib/browse-preferences";
import { addRecentSearch } from "@/lib/search-recent";
import { trackEvent } from "@/lib/analytics";
import { useDesktopWeb } from "@/hooks/use-desktop-web";
import { HomeMobileHero } from "@/components/home/home-mobile-hero";
import { HomeDesktopHero } from "@/components/home/home-desktop-hero";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import {
  parseHomeCategory,
  type HomeMarketplaceCategory,
} from "@/lib/home/marketplace-category";

export { type Initial } from "@/lib/home-search-params";

/**
 * Legacy entry — homepage now uses HomeMarketplaceExperience.
 * Kept for any remaining call sites that need a standalone hero.
 */
export function HomeSearchHero({
  initial,
}: {
  initial?: Initial;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const desktopWeb = useDesktopWeb();
  const [category, setCategory] = useState<HomeMarketplaceCategory>(() =>
    parseHomeCategory(searchParams.get("category")),
  );

  const browseInitial = useMemo(() => {
    const type = searchParams.get("type") ?? initial?.listingType ?? "";
    const hub = searchParams.get("hub") ?? initial?.hub ?? "";
    const pt = searchParams.get("property_type") ?? initial?.propertyType ?? "";
    const city = searchParams.get("city") ?? initial?.city ?? "";
    const area = searchParams.get("area") ?? initial?.area ?? "";
    const state =
      searchParams.get("state") ??
      initial?.state ??
      (city ? getStateForCity(city) ?? "" : "");
    const min = searchParams.get("min") ?? initial?.min;
    const max = searchParams.get("max") ?? initial?.max;
    const budgetValue = budgetValueFromSearchParams(min, max);
    return {
      dealKey: chipKeyFromParams({ type, hub, propertyType: pt }),
      state,
      city,
      area,
      propertyType: pt === "shop" ? "" : pt,
      budgetValue,
    };
  }, [searchParams, initial]);

  useEffect(() => {
    setCategory(parseHomeCategory(searchParams.get("category")));
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("focus") === "search") {
      const targetId = desktopWeb ? "home-desktop-search" : "home-search";
      document
        .getElementById(targetId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams, desktopWeb]);

  function handlePropertySearch({ params, label }: BrowseSearchPayload) {
    trackEvent("search", {
      city: params.get("city") || undefined,
      area: params.get("area") || undefined,
      listing_type: params.get("type") || undefined,
      placement: desktopWeb ? "home_desktop_filters" : "home_filters",
    });

    saveBrowsePreferences({
      city: params.get("city") || undefined,
      area: params.get("area") || undefined,
      listingType: params.get("type") || undefined,
      propertyType: params.get("property_type") || undefined,
      minPrice: params.get("min") ? Number(params.get("min")) : undefined,
      maxPrice: params.get("max") ? Number(params.get("max")) : undefined,
    });

    const qs = params.toString();
    const href = qs ? `/search?${qs}` : "/search";
    addRecentSearch({ label, href });
    router.push(href);
  }

  function handleVehicleSearch({ params, label }: BrowseSearchPayload) {
    trackEvent("search", {
      city: params.get("city") || undefined,
      listing_type: "vehicle",
      placement: "home_desktop_vehicle_filters",
    });
    const qs = params.toString();
    const href = qs ? `/vehicles?${qs}` : "/vehicles";
    addRecentSearch({ label, href });
    router.push(href);
  }

  if (desktopWeb) {
    return (
      <HomeDesktopHero
        category={category}
        onCategoryChange={setCategory}
        browseInitial={browseInitial}
        onPropertySearch={handlePropertySearch}
        onVehicleSearch={handleVehicleSearch}
      />
    );
  }

  return (
    <HomeMobileHero
      browseInitial={browseInitial}
      onSearch={handlePropertySearch}
    />
  );
}
