import { Suspense } from "react";
import type { Metadata } from "next";
import { HomeMarketplaceExperience } from "@/components/home/home-marketplace-experience";
import { MarketplaceLocationBootstrap } from "@/components/location/marketplace-location-bootstrap";
import { PropertyGridSkeleton } from "@/components/ui/skeleton";
import { PrefSync } from "@/components/personalization/pref-sync";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/constants";
import {
  getFeaturedProperties,
  getPublicProperties,
} from "@/lib/properties";
import { createClient } from "@/lib/supabase/server";
import { queryPublicVehicles } from "@/lib/marketplace/listings";
import { parseHomeCategory } from "@/lib/home/marketplace-category";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  demoFeaturedRail,
  demoRecentRail,
  demoLuxuryRail,
  demoNearYouRail,
  demoLowMileageRail,
  filterDemoByLocation,
  withEmptyInventoryDemoFixtures,
} from "@/lib/demo-ui-fixtures";
import {
  dedupeById,
  pickFeaturedRail,
  pickRecentRail,
  pickLuxuryRail,
  pickNearYouRail,
  pickLowMileageRail,
  pickTrendingRail,
  pickNationwideFeaturedRail,
} from "@/lib/home/inventory-rails";
import { getServerMarketplaceLocation } from "@/lib/search-preferences";
import { getHomepageAds } from "@/lib/advertisements/public";
import { ORG_ID, WEBSITE_ID } from "@/lib/seo/schema-ids";
import { BRAND_OG_IMAGE, BRAND_OG_IMAGE_WEBP } from "@/lib/share-images";
import type { Property } from "@/types/database";
import type { LocationScope, MarketplaceLocation } from "@/lib/marketplace-location";

export const metadata: Metadata = {
  title: {
    absolute: "Yike — Nigeria's Trusted Marketplace for Property & Vehicles",
  },
  description:
    "Find verified properties and vehicles across Nigeria. One marketplace, WhatsApp contact, trusted sellers.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Yike — Nigeria's Trusted Marketplace",
    description:
      "Find verified properties and vehicles across Nigeria. One marketplace.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: BRAND_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Yike — Nigerian marketplace",
        type: "image/png",
      },
      {
        url: BRAND_OG_IMAGE_WEBP,
        width: 1200,
        height: 630,
        alt: "Yike — Nigerian marketplace",
        type: "image/webp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yike — Nigeria's Trusted Marketplace",
    description:
      "Find verified properties and vehicles across Nigeria. One marketplace.",
    images: [BRAND_OG_IMAGE],
  },
};

function logHomeDataFailure(label: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[home] ${label} unavailable`, message);
}

async function safeLoad<T>(
  label: string,
  load: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await load();
  } catch (error) {
    logHomeDataFailure(label, error);
    return fallback;
  }
}

function HomePageStructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: "Yike — Nigeria's Trusted Marketplace",
        description: SITE_TAGLINE,
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
        inLanguage: "en-NG",
        about: [
          "Property marketplace Nigeria",
          "Vehicles marketplace Nigeria",
          "Verified listings",
        ],
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

function railMeta(
  result: { items: Property[]; scope: LocationScope; expanded: boolean },
): { items: Property[]; scope: LocationScope; expanded: boolean } {
  return {
    items: result.items,
    scope: result.scope,
    expanded: result.expanded,
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category = parseHomeCategory(params.category);
  const marketplaceLoc = await getServerMarketplaceLocation();
  const preferredCity = marketplaceLoc?.city || undefined;
  const preferredState = marketplaceLoc?.state || undefined;
  // City, state-wide, or null (nationwide)
  const loc: MarketplaceLocation | null =
    marketplaceLoc?.city || marketplaceLoc?.state
      ? {
          ...marketplaceLoc,
          city: marketplaceLoc.city || "",
          state: marketplaceLoc.state || "",
        }
      : null;

  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");

  // Lean fetch: featured + recent pool (+ city when set). Luxury/state derived in-memory.
  const [featuredProps, recentProps, nearYouProps, vehiclePool] =
    await Promise.all([
      safeLoad("featured properties", () => getFeaturedProperties(8), []),
      safeLoad("recent properties", () => getPublicProperties({}, 36), []),
      preferredCity
        ? safeLoad(
            "near-you properties",
            () => getPublicProperties({ city: preferredCity }, 12),
            [],
          )
        : preferredState
          ? safeLoad(
              "near-you properties",
              () => getPublicProperties({ state: preferredState }, 12),
              [],
            )
          : Promise.resolve([] as Property[]),
      vehiclesOn
        ? (async () => {
            const supabase = await createClient();
            if (!supabase) return [] as Property[];
            const [featured, recent, local] = await Promise.all([
              safeLoad(
                "featured vehicles",
                () =>
                  queryPublicVehicles(supabase, { featured: true, limit: 8 }),
                [],
              ),
              safeLoad(
                "recent vehicles",
                () => queryPublicVehicles(supabase, { limit: 36 }),
                [],
              ),
              preferredCity
                ? safeLoad(
                    "local vehicles",
                    () =>
                      queryPublicVehicles(supabase, {
                        city: preferredCity,
                        limit: 12,
                      }),
                    [],
                  )
                : preferredState
                  ? safeLoad(
                      "local vehicles",
                      () =>
                        queryPublicVehicles(supabase, {
                          state: preferredState,
                          limit: 12,
                        }),
                      [],
                    )
                  : Promise.resolve([] as Property[]),
            ]);
            return dedupeById([...featured, ...recent, ...local]);
          })()
        : Promise.resolve([] as Property[]),
    ]);

  const propertyPool = dedupeById([
    ...featuredProps,
    ...recentProps,
    ...nearYouProps,
  ]);
  const propertyDemo = withEmptyInventoryDemoFixtures(
    propertyPool,
    "property",
    12,
  );
  const vehicleDemo = withEmptyInventoryDemoFixtures(vehiclePool, "vehicle", 12);

  // When using demo fixtures, prefer location-matched DEMO inventory
  const propertyDemoFiltered = propertyDemo.isDemo
    ? filterDemoByLocation(propertyDemo.items, loc, 12)
    : { items: propertyDemo.items, matchedLocally: Boolean(loc?.city) };
  const vehicleDemoFiltered = vehicleDemo.isDemo
    ? filterDemoByLocation(vehicleDemo.items, loc, 12)
    : { items: vehicleDemo.items, matchedLocally: Boolean(loc?.city) };

  const propertyItems = propertyDemoFiltered.items;
  const vehicleItems = vehicleDemoFiltered.items;
  const showingDemoFixtures = propertyDemo.isDemo || vehicleDemo.isDemo;

  const nearPool = propertyDemo.isDemo
    ? propertyItems
    : dedupeById([...nearYouProps, ...recentProps]);

  const featuredLive = pickFeaturedRail(
    propertyDemo.isDemo
      ? propertyItems
      : featuredProps.length > 0
        ? featuredProps
        : propertyItems,
    6,
    loc,
  );
  const recentLive = pickRecentRail(
    propertyDemo.isDemo
      ? propertyItems
      : recentProps.length > 0
        ? recentProps
        : propertyItems,
    6,
    loc,
  );
  const nearYouLive = pickNearYouRail(nearPool, preferredCity, 6, loc);
  const trendingLive = pickTrendingRail(
    propertyDemo.isDemo ? propertyItems : nearPool,
    6,
    loc,
  );
  const luxuryLive = pickLuxuryRail(
    propertyDemo.isDemo ? propertyItems : propertyPool,
    "property",
    6,
    loc,
  );
  const nationwideLive = pickNationwideFeaturedRail(
    propertyDemo.isDemo ? propertyItems : propertyPool,
    6,
    loc,
  );

  const vFeatured = pickFeaturedRail(vehicleItems, 6, loc);
  const vRecent = pickRecentRail(vehicleItems, 6, loc);
  const vLowKm = pickLowMileageRail(vehicleItems, 6, loc);
  const vLuxury = pickLuxuryRail(vehicleItems, "vehicle", 6, loc);
  const vTrending = pickTrendingRail(vehicleItems, 6, loc);
  const vNationwide = pickNationwideFeaturedRail(vehicleItems, 6, loc);

  const homepageAds = await safeLoad(
    "homepage ads",
    () => getHomepageAds(),
    {
      homepage_slot_1: null,
      homepage_slot_2: null,
      homepage_slot_3: null,
      homepage_slot_4: null,
      homepage_slot_5: null,
    },
  );

  return (
    <div className="home-canvas min-h-[100dvh] lg:pb-8">
      <HomePageStructuredData />
      <PrefSync />
      <MarketplaceLocationBootstrap />

      <Suspense
        fallback={
          <div className="px-3 py-10">
            <PropertyGridSkeleton count={3} />
          </div>
        }
      >
        <HomeMarketplaceExperience
          initialCategory={category}
          showingDemoFixtures={showingDemoFixtures}
          homepageAds={homepageAds}
          marketplaceLocation={
            loc
              ? {
                  city: loc.city || loc.state || "",
                  state: loc.state || undefined,
                }
              : preferredCity
                ? { city: preferredCity }
                : preferredState
                  ? { city: preferredState, state: preferredState }
                  : null
          }
          propertyRails={{
            featured: railMeta(
              propertyDemo.isDemo
                ? {
                    items: demoFeaturedRail(propertyItems, 6),
                    scope: propertyDemoFiltered.matchedLocally
                      ? "city"
                      : "nationwide",
                    expanded: !propertyDemoFiltered.matchedLocally,
                  }
                : featuredLive,
            ),
            recent: railMeta(
              propertyDemo.isDemo
                ? {
                    items: demoRecentRail(propertyItems, 6),
                    scope: propertyDemoFiltered.matchedLocally
                      ? "city"
                      : "nationwide",
                    expanded: !propertyDemoFiltered.matchedLocally,
                  }
                : recentLive,
            ),
            nearYou: railMeta(
              propertyDemo.isDemo
                ? {
                    items: demoNearYouRail(propertyItems, 6),
                    scope: propertyDemoFiltered.matchedLocally
                      ? "city"
                      : "nationwide",
                    expanded: !propertyDemoFiltered.matchedLocally,
                  }
                : nearYouLive,
            ),
            trending: railMeta(
              propertyDemo.isDemo
                ? {
                    items: demoRecentRail(propertyItems, 6),
                    scope: propertyDemoFiltered.matchedLocally
                      ? "city"
                      : "nationwide",
                    expanded: !propertyDemoFiltered.matchedLocally,
                  }
                : trendingLive,
            ),
            luxury: railMeta(
              propertyDemo.isDemo
                ? {
                    items: demoLuxuryRail(propertyItems, 6),
                    scope: "nationwide",
                    expanded: true,
                  }
                : luxuryLive,
            ),
            nationwide: nationwideLive,
          }}
          vehicleRails={{
            featured: railMeta(
              vehicleDemo.isDemo
                ? {
                    items: demoFeaturedRail(vehicleItems, 6),
                    scope: vehicleDemoFiltered.matchedLocally
                      ? "city"
                      : "nationwide",
                    expanded: !vehicleDemoFiltered.matchedLocally,
                  }
                : vFeatured,
            ),
            recent: railMeta(
              vehicleDemo.isDemo
                ? {
                    items: demoRecentRail(vehicleItems, 6),
                    scope: vehicleDemoFiltered.matchedLocally
                      ? "city"
                      : "nationwide",
                    expanded: !vehicleDemoFiltered.matchedLocally,
                  }
                : vRecent,
            ),
            lowMileage: railMeta(
              vehicleDemo.isDemo
                ? {
                    items: demoLowMileageRail(vehicleItems, 6),
                    scope: vehicleDemoFiltered.matchedLocally
                      ? "city"
                      : "nationwide",
                    expanded: !vehicleDemoFiltered.matchedLocally,
                  }
                : vLowKm,
            ),
            trending: railMeta(
              vehicleDemo.isDemo
                ? {
                    items: demoRecentRail(vehicleItems, 6),
                    scope: vehicleDemoFiltered.matchedLocally
                      ? "city"
                      : "nationwide",
                    expanded: !vehicleDemoFiltered.matchedLocally,
                  }
                : vTrending,
            ),
            luxury: railMeta(
              vehicleDemo.isDemo
                ? {
                    items: demoLuxuryRail(vehicleItems, 6),
                    scope: "nationwide",
                    expanded: true,
                  }
                : vLuxury,
            ),
            nationwide: vNationwide,
          }}
        />
      </Suspense>
    </div>
  );
}
