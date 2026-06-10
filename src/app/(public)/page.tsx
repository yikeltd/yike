import { Suspense } from "react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { HomeSearchHero } from "@/components/home/home-search-hero";
import { HomeHotPicksSections } from "@/components/home/home-hotspot-row";
import {
  HomeFilteredFeed,
  HomeShowcaseSection,
  PopularAreasSection,
} from "@/components/home/home-sections";
import { HomeMarketplaceIntro } from "@/components/home/home-marketplace-intro";
import { SocialProofBar } from "@/components/home/social-proof-bar";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/constants";
import { getMarketplaceStats } from "@/lib/marketplace-stats";
import { getHomeHeroTrustedAgentsConfig } from "@/lib/home/hero-trusted-agents.server";
import { getDefaultHeroTrustedAgentsConfig } from "@/lib/home/hero-trusted-agents";
import { parseSearchParams } from "@/lib/properties";
import { PropertyGridSkeleton } from "@/components/ui/skeleton";
import { PrefSync } from "@/components/personalization/pref-sync";
import { AdminPromoSlot } from "@/components/promo/admin-promo-slot";
import { ORG_ID, WEBSITE_ID } from "@/lib/seo/schema-ids";
import { HOME_SEO_SEARCH_LINKS } from "@/lib/home/popular-search-links";
import { HomePopularSearches } from "@/components/home/home-popular-searches";
import { BRAND_OG_IMAGE, BRAND_OG_IMAGE_WEBP } from "@/lib/share-images";

const BrowseRail = dynamic(
  () =>
    import("@/components/retention/browse-rail").then((m) => ({
      default: m.BrowseRail,
    })),
  { loading: () => null }
);

export const metadata: Metadata = {
  title: {
    absolute: "Yike — Find Homes, Land, Shops & Agents Across Nigeria",
  },
  description:
    "Discover property listings across Nigeria, connect with agents, and explore safer real estate options on Yike.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Yike — Find Homes, Land, Shops & Agents Across Nigeria",
    description:
      "Discover property listings across Nigeria, connect with agents, and explore safer real estate options on Yike.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: BRAND_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Yike — Nigerian property marketplace",
        type: "image/png",
      },
      {
        url: BRAND_OG_IMAGE_WEBP,
        width: 1200,
        height: 630,
        alt: "Yike — Nigerian property marketplace",
        type: "image/webp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yike — Find Homes, Land, Shops & Agents Across Nigeria",
    description:
      "Discover property listings across Nigeria, connect with agents, and explore safer real estate options on Yike.",
    images: [BRAND_OG_IMAGE],
  },
};

const POPULAR_SEARCH_LINKS = HOME_SEO_SEARCH_LINKS;

function SectionFallback() {
  return (
    <div className="px-3 py-6 lg:px-0">
      <PropertyGridSkeleton count={3} />
    </div>
  );
}

function logHomeDataFailure(label: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[home] ${label} unavailable`, message);
}

async function getSafeHomeShellData() {
  const [statsResult, trustedAgentsResult] = await Promise.allSettled([
    getMarketplaceStats(),
    getHomeHeroTrustedAgentsConfig(),
  ]);

  if (statsResult.status === "rejected") {
    logHomeDataFailure("marketplace stats", statsResult.reason);
  }
  if (trustedAgentsResult.status === "rejected") {
    logHomeDataFailure("trusted agents", trustedAgentsResult.reason);
  }

  return {
    stats: statsResult.status === "fulfilled" ? statsResult.value : null,
    trustedAgents:
      trustedAgentsResult.status === "fulfilled"
        ? trustedAgentsResult.value
        : getDefaultHeroTrustedAgentsConfig(),
  };
}

function HomePageStructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: "Yike — Nigerian property search",
        description: SITE_TAGLINE,
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
        inLanguage: "en-NG",
        about: [
          "Houses for rent in Nigeria",
          "Apartments in Nigeria",
          "Verified property agents",
          "Nigerian property search",
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/#popular-searches`,
        name: "Popular Nigerian property searches",
        itemListElement: POPULAR_SEARCH_LINKS.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.label,
          url: `${SITE_URL}${item.href}`,
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { stats, trustedAgents } = await getSafeHomeShellData();
  const filters = parseSearchParams(params);
  const initial = {
    listingType: filters.listing_type,
    hub: filters.hub,
    propertyType: filters.property_type,
    state: filters.state,
    city: filters.city,
    area: filters.area,
    min: filters.min_price ? String(filters.min_price) : undefined,
    max: filters.max_price ? String(filters.max_price) : undefined,
  };

  return (
    <div className="home-canvas min-h-[100dvh] lg:pb-8">
      <HomePageStructuredData />
      <PrefSync />
      <Suspense fallback={null}>
        <HomeSearchHero initial={initial} trustedAgents={trustedAgents} />
      </Suspense>

      <HomeMarketplaceIntro />

      <Suspense fallback={<SectionFallback />}>
        <HomeHotPicksSections />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <HomeShowcaseSection />
      </Suspense>

      <Suspense fallback={null}>
        <AdminPromoSlot
          placement="homepage_inline"
          variant="card"
          className="mx-auto max-w-7xl px-3 pt-3 lg:px-6 xl:px-8"
        />
      </Suspense>

      <Suspense fallback={null}>
        <div className="mt-3">
          <BrowseRail />
        </div>
      </Suspense>

      <section className="mx-auto max-w-7xl px-3 pt-5 lg:px-6 xl:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark dark:text-gold">
              For you
            </p>
            <h2 className="text-xl font-bold text-foreground lg:text-2xl">
              Homes for you
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Verified listings · WhatsApp contact · Trusted agents
            </p>
          </div>
          <SocialProofBar stats={stats} />
        </div>
      </section>

      <Suspense fallback={<SectionFallback />}>
        <HomeFilteredFeed filters={filters} />
      </Suspense>

      <PopularAreasSection />

      <Suspense fallback={null}>
        <HomePopularSearches
          initialContext={{
            listingType: filters.listing_type,
            hub: filters.hub,
            city: filters.city,
            area: filters.area,
          }}
        />
      </Suspense>
    </div>
  );
}
