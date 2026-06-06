import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { PropertyFeed } from "@/components/property/property-feed";
import {
  getPublicProperties,
  parseSearchParams,
  type PropertySearchParams,
} from "@/lib/properties";
import { SearchResultsChrome } from "@/components/search/search-results-chrome";
import { withDemoFallback } from "@/lib/mock-listings";
import { hasActiveFilters } from "@/lib/search-filters";
import { hubLabel } from "@/constants/listingTypes";
import { getActiveAd } from "@/lib/ads";
import { AdSlot } from "@/components/ads/ad-slot";
import { getServerSearchPreferences } from "@/lib/search-preferences";
import { PrefSync } from "@/components/personalization/pref-sync";
import { buildSeoHelpWhatsAppUrl, seoHelpLabel } from "@/lib/seo/help-whatsapp";
import { StickySeoHelpBar } from "@/components/leads/sticky-seo-help-bar";

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
  const properties = await getPublicProperties(preloadParams, 48);
  const { items: feedItems, isDemo } = withDemoFallback(properties);

  const feedAd = await getActiveAd("search_feed_mid");

  const label = [
    params.hub ? hubLabel(params.hub) : null,
    params.listing_type,
    params.city,
    params.area,
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

  return (
    <div className="search-hub-canvas min-h-[100dvh] bg-[#f7f8fb] pb-24 lg:pb-12">
      <PrefSync />
      <Suspense fallback={<ResultsFallback />}>
        <SearchResultsChrome
          resultCount={properties.length}
          currentHref={currentHref}
          currentLabel={label || undefined}
          showEmptySuggestions={!hasQuery && feedItems.length === 0}
        >
          <AdSlot
            placement="search_top"
            className="mx-auto mt-2 hidden max-w-7xl px-3 lg:block lg:px-6 xl:px-8"
          />

          <section className="mx-auto mt-2 max-w-2xl px-3 lg:mt-3 lg:max-w-7xl lg:px-6 xl:px-8">
            <PropertyFeed
              properties={feedItems}
              isDemo={isDemo}
              midFeedAd={feedAd}
              feedAdInsertAfter={5}
              adPlacementKey="search_feed_mid"
              emptyMessage={
                hasQuery
                  ? "No homes match your filters. Try a nearby area or wider budget."
                  : "No homes in this view yet — pick a location below or refine filters."
              }
              emptyCity={params.city ?? preloadParams.city}
              emptyArea={params.area ?? preloadParams.area}
            />
          </section>
        </SearchResultsChrome>
      </Suspense>

      {helpUrl ? (
        <StickySeoHelpBar label={helpLabel} whatsAppUrl={helpUrl} />
      ) : null}
    </div>
  );
}
