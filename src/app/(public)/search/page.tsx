import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { PropertyFeed } from "@/components/property/property-feed";
import {
  getPublicProperties,
  getPublicPropertiesStrict,
  parseSearchParams,
  type PropertySearchParams,
} from "@/lib/properties";
import { SearchResultsChrome } from "@/components/search/search-results-chrome";
import { withDemoFallback, isDemoProperty } from "@/lib/mock-listings";
import { hasActiveFilters } from "@/lib/search-filters";
import { hubLabel } from "@/constants/listingTypes";
import { propertyTypeLabel } from "@/lib/utils";
import { getActiveAd } from "@/lib/ads";
import { AdSlot } from "@/components/ads/ad-slot";
import { getServerSearchPreferences } from "@/lib/search-preferences";
import { PrefSync } from "@/components/personalization/pref-sync";
import { buildSeoHelpWhatsAppUrl, seoHelpLabel } from "@/lib/seo/help-whatsapp";
import { StickySeoHelpBar } from "@/components/leads/sticky-seo-help-bar";
import { VerificationPromoSlot } from "@/components/verification/verification-promo-slot";
import {
  buildSearchEmptyCopy,
  buildStateBrowseHref,
  resolveSearchResults,
} from "@/lib/search-fallback";

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
      48
    );
    exactCount = bundle.exact.length;
    feedItems = bundle.exact;
    nearbyItems = bundle.nearby;
    isDemo =
      feedItems.length > 0 && feedItems.every((p) => isDemoProperty(p.id));
  } else {
    const properties = await getPublicProperties(preloadParams, 48);
    const demo = withDemoFallback(properties);
    feedItems = demo.items;
    exactCount = properties.length;
    isDemo = demo.isDemo;
  }

  const feedAd = await getActiveAd("search_feed_mid");

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
  const stateBrowseHref = buildStateBrowseHref(preloadParams);
  const showingNearby = hasQuery && exactCount === 0 && nearbyItems.length > 0;

  return (
    <div className="search-hub-canvas min-h-[100dvh] bg-[#f7f8fb] lg:pb-8">
      <PrefSync />
      <Suspense fallback={<ResultsFallback />}>
        <SearchResultsChrome
          resultCount={exactCount}
          nearbyCount={nearbyItems.length}
          showingFallback={showingNearby}
          currentHref={currentHref}
          currentLabel={label || undefined}
          showEmptySuggestions={!hasQuery && feedItems.length === 0}
          hideSuggestions={hasQuery && exactCount === 0}
        >
          <AdSlot
            placement="search_top"
            className="mt-2 hidden px-3 lg:block lg:px-6 xl:px-8"
          />

          <section className="mt-2 w-full px-3 lg:px-6 xl:px-8">
            <VerificationPromoSlot placement="search_page" variant="inline" className="mb-4" />
            {showingNearby ? (
              <div className="mb-4 rounded-2xl border border-navy/8 bg-white px-4 py-4 shadow-sm">
                <p className="text-base font-bold text-navy">{emptyCopy.title}</p>
                <p className="mt-1 text-sm text-muted">{emptyCopy.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={stateBrowseHref}
                    className="pressable rounded-full bg-gold px-4 py-2 text-xs font-bold text-navy"
                  >
                    Browse in {preloadParams.state ?? preloadParams.city ?? "this area"}
                  </Link>
                  <Link
                    href="/search"
                    className="pressable rounded-full bg-surface px-4 py-2 text-xs font-bold text-navy"
                  >
                    Clear filters
                  </Link>
                  {currentHref && label ? (
                    <Link
                      href={currentHref}
                      className="pressable rounded-full border border-navy/10 px-4 py-2 text-xs font-bold text-navy"
                    >
                      Save this search
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}

            {feedItems.length > 0 ? (
              <PropertyFeed
                properties={feedItems}
                isDemo={isDemo}
                midFeedAd={feedAd}
                feedAdInsertAfter={5}
                adPlacementKey="search_feed_mid"
              />
            ) : showingNearby ? (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  Nearby matches in {preloadParams.state ?? preloadParams.city ?? "your area"}
                </p>
                <PropertyFeed
                  properties={nearbyItems}
                  isDemo={isDemo}
                  midFeedAd={feedAd}
                  feedAdInsertAfter={5}
                  adPlacementKey="search_feed_mid"
                />
              </div>
            ) : (
              <PropertyFeed
                properties={[]}
                emptyMessage={emptyCopy.message}
                emptyCity={params.city ?? preloadParams.city}
                emptyArea={params.area ?? preloadParams.area}
                emptyListingType={params.listing_type ?? preloadParams.listing_type}
                emptyPropertyType={params.property_type ?? preloadParams.property_type}
                emptyTitle={emptyCopy.title}
                stateBrowseHref={hasQuery ? stateBrowseHref : undefined}
                clearFiltersHref={hasQuery ? "/search" : undefined}
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
