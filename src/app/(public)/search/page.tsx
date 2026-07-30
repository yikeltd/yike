import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { PropertyFeed } from "@/components/property/property-feed";
import {
  getPublicProperties,
  getPublicPropertiesStrict,
  parseSearchParams,
  type PropertySearchParams,
} from "@/lib/properties";
import { SearchResultsChrome } from "@/components/search/search-results-chrome";
import { isDemoProperty } from "@/lib/mock-listings";
import { hasActiveFilters } from "@/lib/search-filters";
import { hubLabel } from "@/constants/listingTypes";
import { propertyTypeLabel } from "@/lib/utils";
import { getActiveAd } from "@/lib/ads";
import { getSponsoredAd } from "@/lib/advertisements/public";
import { AdSlot } from "@/components/ads/ad-slot";
import { getServerSearchPreferences } from "@/lib/search-preferences";
import { PrefSync } from "@/components/personalization/pref-sync";
import { AdminPromoSlot } from "@/components/promo/admin-promo-slot";
import {
  buildSearchEmptyCopy,
  resolveSearchResults,
} from "@/lib/search-fallback";
import { MarketplaceCategoryHeader } from "@/components/marketplace/category-header";
import {
  DiscoveryEmptyPanel,
  QuickFilterChips,
  PROPERTY_QUICK_FILTERS,
} from "@/components/marketplace/experience";
import { withEmptyInventoryDemoFixtures } from "@/lib/demo-ui-fixtures";
import { HeaderUniversalSearch } from "@/components/search/header-universal-search";
import { SearchClientChrome } from "@/components/search/search-client-chrome";

export const metadata: Metadata = {
  title: `Universal Search & Discovery | ${SITE_NAME}`,
  description: `Search properties, vehicles, land, shortlets, and agents across Nigeria with instant AI filters on ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/search` },
  openGraph: {
    title: `Universal Search & Discovery | ${SITE_NAME}`,
    description: "Instant AI search across properties, vehicles, land, and verified agents in Nigeria.",
    url: `${SITE_URL}/search`,
  },
};

function ResultsFallback() {
  return (
    <div className="space-y-3 px-3 pt-2">
      <div className="skeleton h-14 w-full rounded-xl" />
      <div className="skeleton h-11 w-full rounded-xl" />
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const params = parseSearchParams(rawParams);
  const nearbyFlag =
    (typeof rawParams.nearby === "string" && rawParams.nearby === "1") ||
    (Array.isArray(rawParams.nearby) && rawParams.nearby[0] === "1");
  const hasQuery = hasActiveFilters(params) || nearbyFlag;
  const prefs = hasQuery ? {} : await getServerSearchPreferences();
  const preloadParams: PropertySearchParams = {
    ...(hasQuery ? params : prefs),
  };

  if (nearbyFlag && !preloadParams.city && !preloadParams.state) {
    const nearbyPrefs = await getServerSearchPreferences();
    if (nearbyPrefs.city) preloadParams.city = nearbyPrefs.city;
    if (nearbyPrefs.state) preloadParams.state = nearbyPrefs.state;
    if (nearbyPrefs.area) preloadParams.area = nearbyPrefs.area;
  }

  let exactCount = 0;
  let feedItems: Awaited<ReturnType<typeof getPublicProperties>> = [];
  let nearbyItems: Awaited<ReturnType<typeof getPublicProperties>> = [];
  let isDemo = false;

  if (hasQuery) {
    const bundle = await resolveSearchResults(
      getPublicPropertiesStrict,
      preloadParams,
      24
    );
    exactCount = bundle.exact.length;
    feedItems = bundle.exact;
    nearbyItems = bundle.nearby;
    isDemo =
      feedItems.length > 0 && feedItems.every((p) => isDemoProperty(p.id));
  } else {
    feedItems = await getPublicProperties(preloadParams, 24);
    exactCount = feedItems.length;
    isDemo =
      feedItems.length > 0 && feedItems.every((p) => isDemoProperty(p.id));
  }

  if (!hasQuery && feedItems.length === 0) {
    const demo = withEmptyInventoryDemoFixtures([], "property", 24);
    if (demo.isDemo) {
      feedItems = demo.items;
      exactCount = demo.items.length;
      isDemo = true;
    }
  }

  const [sponsoredSearchAd, feedAd] = await Promise.all([
    getSponsoredAd("search_results"),
    getActiveAd("search_feed_mid"),
  ]);

  const label = [
    params.hub ? hubLabel(params.hub) : null,
    params.property_type ? propertyTypeLabel(params.property_type) : params.listing_type,
    params.city,
    params.area,
    params.state,
  ]
    .filter(Boolean)
    .join(" · ");

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (typeof value === "string") qs.set(key, value);
    else if (Array.isArray(value) && value[0]) qs.set(key, value[0]);
  }
  const currentHref = qs.toString() ? `/search?${qs.toString()}` : undefined;

  const emptyCopy = buildSearchEmptyCopy(preloadParams);
  const showingNearby = hasQuery && exactCount === 0 && nearbyItems.length > 0;
  const activeItems = feedItems.length > 0 ? feedItems : nearbyItems;

  return (
    <div className="search-hub-canvas min-h-[100dvh] bg-[#f7f8fb] lg:pb-8">
      <PrefSync />
      
      {/* UNIVERSAL SEARCH BAR & CATEGORIES */}
      <div className="px-3 pt-4 lg:px-6 xl:px-8 space-y-3">
        <HeaderUniversalSearch size="large" tone="desktop" showLocation />
        <Suspense fallback={null}>
          <div>
            <QuickFilterChips
              chips={PROPERTY_QUICK_FILTERS}
              basePath="/search"
            />
          </div>
        </Suspense>
      </div>

      <Suspense fallback={<ResultsFallback />}>
        <SearchClientChrome
          feedItems={activeItems}
          exactCount={exactCount}
          nearbyCount={nearbyItems.length}
          showingFallback={showingNearby}
          currentHref={currentHref}
          currentLabel={label || "Search Results"}
        >
          <section className="mt-1 w-full px-3 lg:px-6 xl:px-8">
            {feedItems.length > 0 ? (
              <PropertyFeed
                properties={feedItems}
                isDemo={isDemo}
                sponsoredAd={sponsoredSearchAd}
                midFeedAd={sponsoredSearchAd ? null : feedAd}
                feedAdInsertAfter={5}
                adPlacementKey="search_feed_mid"
              />
            ) : showingNearby ? (
              <PropertyFeed
                properties={nearbyItems}
                isDemo={isDemo}
                sponsoredAd={sponsoredSearchAd}
                midFeedAd={sponsoredSearchAd ? null : feedAd}
                feedAdInsertAfter={5}
                adPlacementKey="search_feed_mid"
              />
            ) : (
              <DiscoveryEmptyPanel
                category="property"
                title={hasQuery ? emptyCopy.title : "Start exploring homes & vehicles"}
                subtitle={
                  hasQuery
                    ? "Try another filter, or browse popular categories below."
                    : "Recent searches, trending areas, and cities — tap to browse."
                }
                showLatestHref="/search"
              />
            )}

            <div className="mt-6 space-y-4">
              <AdminPromoSlot placement="search_page" variant="inline" />
              <AdSlot
                placement="search_top"
                className="hidden lg:block"
              />
            </div>
          </section>
        </SearchClientChrome>
      </Suspense>
    </div>
  );
}
