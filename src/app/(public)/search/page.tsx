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
import { buildSeoHelpWhatsAppUrl, seoHelpLabel } from "@/lib/seo/help-whatsapp";
import { StickySeoHelpBar } from "@/components/leads/sticky-seo-help-bar";
import { AdminPromoSlot } from "@/components/promo/admin-promo-slot";
import {
  buildSearchEmptyCopy,
  resolveSearchResults,
} from "@/lib/search-fallback";
import { MarketplaceCategoryHeader } from "@/components/marketplace/category-header";
import { MarketplaceSafetyNotice } from "@/components/marketplace/safety-notice";
import { MarketplaceEmptyState } from "@/components/marketplace/marketplace-empty-state";
import { withEmptyInventoryDemoFixtures } from "@/lib/demo-ui-fixtures";

export const metadata: Metadata = {
  title: `Search Homes in Nigeria`,
  description: `Search apartments, houses, land and shops across Nigeria. Filter by city, area, budget and property type on ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/search` },
  openGraph: {
    title: `Search Nigerian Property | ${SITE_NAME}`,
    description: "Find verified rentals and homes — mobile-first, WhatsApp contact.",
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
  const params = parseSearchParams(await searchParams);
  const hasQuery = hasActiveFilters(params);
  const prefs = hasQuery ? {} : await getServerSearchPreferences();
  const preloadParams: PropertySearchParams = hasQuery ? params : prefs;

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

  // Dev-only: when live search is empty, fill with [DEMO] UI fixtures (no DB writes).
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

  const rawParams = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (typeof value === "string") qs.set(key, value);
    else if (Array.isArray(value) && value[0]) qs.set(key, value[0]);
  }
  const currentHref = qs.toString() ? `/search?${qs.toString()}` : undefined;

  const helpCity = params.city ?? preloadParams.city;
  const helpArea = params.area ?? preloadParams.area;
  const helpUrl = helpCity ? buildSeoHelpWhatsAppUrl(helpCity, helpArea) : null;
  const helpLabel = helpCity ? seoHelpLabel(helpCity, helpArea) : "";

  const emptyCopy = buildSearchEmptyCopy(preloadParams);
  const showingNearby = hasQuery && exactCount === 0 && nearbyItems.length > 0;

  const saveHref = currentHref ?? "/search";
  const saveLabel = label || "Properties";

  return (
    <div className="search-hub-canvas min-h-[100dvh] bg-[#f7f8fb] lg:pb-8">
      <PrefSync />
      <div className="px-3 pt-4 lg:px-6 xl:px-8">
        <MarketplaceCategoryHeader
          vertical="property"
          title="Properties"
          tagline="Find your next home."
          sellHref="/agent/listings/new"
          sellLabel="Sell Property"
          saveLabel={saveLabel}
          saveHref={saveHref}
          className="mb-3"
        />
      </div>
      <Suspense fallback={<ResultsFallback />}>
        <SearchResultsChrome
          resultCount={exactCount}
          nearbyCount={nearbyItems.length}
          showingFallback={showingNearby}
          currentHref={currentHref}
          currentLabel={label || undefined}
          showEmptySuggestions={false}
          hideSuggestions
          filtersDefaultOpen
        >
          <div className="mb-4 px-3 lg:px-6 xl:px-8">
            <MarketplaceSafetyNotice vertical="property" />
          </div>

          <AdSlot
            placement="search_top"
            className="mt-2 hidden px-3 lg:block lg:px-6 xl:px-8"
          />

          <section className="mt-2 w-full px-3 lg:px-6 xl:px-8">
            <AdminPromoSlot placement="search_page" variant="inline" className="mb-4" />
            {showingNearby ? (
              <div className="mb-4">
                <p className="mb-1 text-sm font-semibold text-navy">
                  {emptyCopy.title}
                </p>
                <p className="mb-3 text-xs text-muted">
                  Nearby in {preloadParams.state ?? preloadParams.city ?? "your area"}
                </p>
                <PropertyFeed
                  properties={nearbyItems}
                  isDemo={isDemo}
                  sponsoredAd={sponsoredSearchAd}
                  midFeedAd={sponsoredSearchAd ? null : feedAd}
                  feedAdInsertAfter={5}
                  adPlacementKey="search_feed_mid"
                />
              </div>
            ) : null}

            {feedItems.length > 0 ? (
              <PropertyFeed
                properties={feedItems}
                isDemo={isDemo}
                sponsoredAd={sponsoredSearchAd}
                midFeedAd={sponsoredSearchAd ? null : feedAd}
                feedAdInsertAfter={5}
                adPlacementKey="search_feed_mid"
              />
            ) : showingNearby ? null : (
              <MarketplaceEmptyState
                title={hasQuery ? emptyCopy.title : "No Properties Yet"}
                subtitle={
                  hasQuery
                    ? "Try fewer filters, or list one yourself."
                    : "Be the first to list one."
                }
                actionHref="/agent/listings/new"
                actionLabel="Sell Property"
                secondaryHref={hasQuery ? "/search" : undefined}
                secondaryLabel={hasQuery ? "Clear filters" : undefined}
              />
            )}
          </section>
        </SearchResultsChrome>
      </Suspense>

      {helpUrl ? (
        <StickySeoHelpBar label={helpLabel} whatsAppUrl={helpUrl} />
      ) : null}
    </div>
  );
}
