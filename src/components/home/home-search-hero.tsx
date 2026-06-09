"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { getStateForCity } from "@/lib/constants";
import { budgetIndexFromSearchParams } from "@/lib/budget-ranges";
import { chipKeyFromParams, type Initial } from "@/lib/home-search-params";
import { saveBrowsePreferences } from "@/lib/browse-preferences";
import { addRecentSearch } from "@/lib/search-recent";
import { trackEvent } from "@/lib/analytics";
import { useDesktopWeb } from "@/hooks/use-desktop-web";
import { HomeMobileHero } from "@/components/home/home-mobile-hero";
import { HomeDesktopHero } from "@/components/home/home-desktop-hero";
import type { HeroTrustedAgentsConfig } from "@/lib/home/hero-trusted-agents";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";

export { type Initial } from "@/lib/home-search-params";

export function HomeSearchHero({
  initial,
  trustedAgents,
}: {
  initial?: Initial;
  trustedAgents: HeroTrustedAgentsConfig;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const desktopWeb = useDesktopWeb();

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
      const targetId = desktopWeb ? "home-desktop-search" : "home-search";
      document
        .getElementById(targetId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams, desktopWeb]);

  function handleSearch({ params, label }: BrowseSearchPayload) {
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

  if (desktopWeb) {
    return (
      <HomeDesktopHero
        browseInitial={browseInitial}
        trustedAgents={trustedAgents}
        onSearch={handleSearch}
      />
    );
  }

  return (
    <HomeMobileHero browseInitial={browseInitial} onSearch={handleSearch} />
  );
}
