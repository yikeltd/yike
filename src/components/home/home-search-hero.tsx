"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { getStateForCity } from "@/lib/constants";
import { budgetIndexFromSearchParams } from "@/lib/budget-ranges";
import { chipKeyFromParams, type Initial } from "@/lib/home-search-params";
import { BrowseListingsBlock } from "@/components/search/browse-listings-block";
import { saveBrowsePreferences } from "@/lib/browse-preferences";
import { addRecentSearch } from "@/lib/search-recent";
import { trackEvent } from "@/lib/analytics";

export { type Initial } from "@/lib/home-search-params";

export function HomeSearchHero({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    const budgetIndex = String(budgetIndexFromSearchParams(min, max));
    return {
      dealKey: chipKeyFromParams({ type, hub, propertyType: pt }),
      state,
      city,
      area,
      propertyType: pt === "shop" ? "" : pt,
      budgetIndex,
    };
  }, [searchParams, initial]);

  useEffect(() => {
    if (searchParams.get("focus") === "search") {
      document
        .getElementById("home-search")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  return (
    <div
      id="home-search"
      className="home-hero-premium full-bleed px-3 pb-6 pt-3 lg:border-b lg:border-navy/10 lg:bg-gradient-to-b lg:from-navy/[0.07] lg:via-navy/[0.03] lg:to-background lg:px-6 lg:py-4 xl:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <BrowseListingsBlock
          key={
            browseInitial.dealKey +
            browseInitial.city +
            browseInitial.area +
            browseInitial.propertyType +
            browseInitial.budgetIndex
          }
          variant="home-premium"
          initial={browseInitial}
          title="Discover Homes Across Nigeria"
          onSearch={({ params, label }) => {
            trackEvent("search", {
              city: params.get("city") || undefined,
              area: params.get("area") || undefined,
              listing_type: params.get("type") || undefined,
              placement: "home_filters",
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
          }}
        />
      </div>
    </div>
  );
}
