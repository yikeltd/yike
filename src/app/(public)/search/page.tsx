import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { PropertyFeed } from "@/components/property/property-feed";
import {
  getPublicProperties,
  parseSearchParams,
  type PropertySearchParams,
} from "@/lib/properties";
import { SearchDiscoveryHub } from "@/components/search/search-discovery-hub";
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
  return <div className="h-24 border-b border-surface bg-elevated/95" />;
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
  const preloadLabel = [
    preloadParams.city,
    preloadParams.area,
    preloadParams.listing_type,
  ]
    .filter(Boolean)
    .join(" · ");

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
    <div className="search-hub-canvas min-h-[100dvh] bg-background pb-24 lg:pb-12">
      {!hasQuery ? (
        <>
          <PrefSync />
          <SearchDiscoveryHub />
          <section className="mx-auto mt-4 max-w-2xl px-3 lg:max-w-7xl lg:px-6 xl:px-8">
            <div className="mb-3 flex items-end justify-between px-0.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
                  Live now
                </p>
                <h2 className="text-lg font-bold text-foreground">
                  {preloadLabel ? `Homes in ${preloadLabel}` : "Homes for you"}
                </h2>
              </div>
            </div>
            <PropertyFeed
              properties={feedItems}
              isDemo={isDemo}
              midFeedAd={feedAd}
              feedAdInsertAfter={5}
              adPlacementKey="search_feed_mid"
              emptyMessage="No homes in this view yet — try another city or list your property."
              emptyCity={preloadParams.city}
              emptyArea={preloadParams.area}
            />
          </section>
        </>
      ) : (
        <Suspense fallback={<ResultsFallback />}>
          <SearchResultsChrome
            resultCount={properties.length}
            currentHref={currentHref}
            currentLabel={label || undefined}
          >
            <AdSlot
              placement="search_top"
              className="mt-3 hidden px-3 lg:block lg:px-0"
            />

            <section className="mt-3 lg:mt-4">
              <PropertyFeed
                properties={feedItems}
                isDemo={isDemo}
                midFeedAd={feedAd}
                feedAdInsertAfter={5}
                adPlacementKey="search_feed_mid"
                emptyMessage="No homes match your filters. Try a nearby area or wider budget."
                emptyCity={params.city}
                emptyArea={params.area}
              />
            </section>
          </SearchResultsChrome>
        </Suspense>
      )}

      {helpUrl ? (
        <StickySeoHelpBar label={helpLabel} whatsAppUrl={helpUrl} />
      ) : null}
    </div>
  );
}
