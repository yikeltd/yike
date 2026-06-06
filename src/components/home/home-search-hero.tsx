"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { BUDGET_RANGES, getStateForCity } from "@/lib/constants";
import { chipKeyFromParams, type Initial } from "@/lib/home-search-params";
import { HeaderMobileSearch } from "@/components/search/header-mobile-search";
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
    const budgetIndex = String(
      BUDGET_RANGES.findIndex(
        (b) =>
          (min ? String(b.min) === min : !b.min) &&
          (max ? String(b.max) === max : !b.max)
      )
    );
    return {
      dealKey: chipKeyFromParams({ type, hub, propertyType: pt }),
      state,
      city,
      area,
      propertyType: pt === "shop" ? "" : pt,
      budgetIndex: budgetIndex === "-1" ? "0" : budgetIndex,
      locationQuery: [city, area].filter(Boolean).join(", "),
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
      className="border-b border-surface bg-background px-3 py-3 lg:px-6 xl:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-3">
        <div className="lg:hidden">
          <HeaderMobileSearch />
        </div>

        <BrowseListingsBlock
          key={browseInitial.dealKey + browseInitial.city + browseInitial.area}
          initial={browseInitial}
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

            addRecentSearch({ label, href: `/?${params.toString()}` });

            const qs = params.toString();
            router.replace(qs ? `/?${qs}` : "/", { scroll: false });
          }}
        />
      </div>
    </div>
  );
}
