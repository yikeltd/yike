import Link from "next/link";
import { PropertyFeed } from "@/components/property/property-feed";
import { SafetyNotice } from "@/components/property/safety-notice";
import { ConversionStrip } from "@/components/conversion/conversion-strip";
import { SeoBreadcrumbs } from "./seo-breadcrumbs";
import { SeoHero } from "./seo-hero";
import { SeoFAQ } from "./seo-faq";
import { RelatedAreas } from "./related-areas";
import { RelatedPropertyTypes } from "./related-property-types";
import { InternalLinkGrid } from "./internal-link-grid";
import { RentPriceGuide } from "./rent-price-guide";
import { SeoStructuredData } from "./seo-structured-data";
import type { Property } from "@/types/database";
import type { SeoPropertyType } from "@/constants/seoPropertyTypes";
import type { SeoFaq } from "@/lib/seo/content";
import type { BreadcrumbItem } from "@/lib/seo/utils";
import { seoH1 } from "@/constants/seoTemplates";
import type { SeoPageLevel } from "@/constants/seoTemplates";
import { getCityPersonality } from "@/constants/cityPersonalities";
import { TRENDING_CITIES } from "@/constants/trendingCities";
import { toSlug } from "@/lib/location-slugs";
import { popularLocalSearches } from "@/lib/seo/popular-searches";
import { buildSeoHelpWhatsAppUrl, seoHelpLabel } from "@/lib/seo/help-whatsapp";
import { PopularLocalSearches } from "./popular-local-searches";
import { StickySeoHelpBar } from "@/components/leads/sticky-seo-help-bar";
import { partitionAreaListings } from "@/lib/seo/area-listings";
import {
  intentHeroVibe,
  intentHubPath,
  intentInCityPath,
  intentLabel,
  intentListingsHeading,
  intentSearchHref,
  siblingIntentLinks,
  type SeoListingIntent,
} from "@/lib/seo/intent-in-city";
import { SeoAreaRails } from "./seo-area-rails";

export function SeoLandingPage({
  level,
  city,
  state,
  citySlug,
  neighborhood,
  neighborhoodSlug,
  propertyType,
  intent,
  pageUrl,
  metaDescription,
  h1Override,
  introParagraphs,
  faqs,
  listings,
  isDemo,
}: {
  level: SeoPageLevel;
  city: string;
  state: string;
  citySlug: string;
  neighborhood?: string;
  neighborhoodSlug?: string;
  propertyType?: SeoPropertyType;
  intent?: SeoListingIntent;
  pageUrl: string;
  metaDescription: string;
  h1Override?: string;
  introParagraphs: string[];
  faqs: SeoFaq[];
  listings: Property[];
  isDemo?: boolean;
}) {
  const h1 = h1Override ?? seoH1(level, city, neighborhood, propertyType);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    intent
      ? { label: intentLabel(intent), href: intentHubPath(intent) }
      : { label: "Houses", href: "/search" },
    ...(intent
      ? [{ label: city, href: intentInCityPath(intent, citySlug) }]
      : [{ label: city, href: `/houses/${citySlug}` }]),
  ];
  if (neighborhood && neighborhoodSlug) {
    breadcrumbs.push({
      label: neighborhood,
      href: `/houses/${citySlug}/${neighborhoodSlug}`,
    });
  }
  if (propertyType && neighborhoodSlug) {
    breadcrumbs.push({
      label: propertyType.label,
      href: `/houses/${citySlug}/${neighborhoodSlug}/${propertyType.slug}`,
    });
  }

  const personality = getCityPersonality(city);
  const searchParams = new URLSearchParams();
  searchParams.set("city", city);
  if (neighborhood) searchParams.set("area", neighborhood);
  if (propertyType?.dbValue) searchParams.set("property_type", propertyType.dbValue);
  if (propertyType?.bedrooms) searchParams.set("beds", String(propertyType.bedrooms));
  if (propertyType?.listingType) searchParams.set("type", propertyType.listingType);
  if (intent === "buy") {
    searchParams.set("type", "sale");
    searchParams.set("hub", "buy");
  }
  if (intent === "land") searchParams.set("hub", "land_sale");

  const nearbyCities = TRENDING_CITIES.filter((c) => c.slug !== citySlug)
    .slice(0, 6)
    .map((c) => ({
      label: intent ? `${intentLabel(intent)} in ${c.name}` : `Houses in ${c.name}`,
      href: intent ? intentInCityPath(intent, c.slug) : `/houses/${c.slug}`,
    }));

  const popular = popularLocalSearches(
    city,
    citySlug,
    neighborhood,
    neighborhoodSlug
  );
  const helpUrl = buildSeoHelpWhatsAppUrl(city, neighborhood);
  const helpLabel = seoHelpLabel(city, neighborhood);
  const sections = partitionAreaListings(listings);
  const searchHref = intent
    ? intentSearchHref(intent, city)
    : `/search?${searchParams.toString()}`;
  const intentSiblings = intent ? siblingIntentLinks(citySlug, city, intent) : [];

  const listingsTitle = intent
    ? intentListingsHeading(intent, city, listings.length)
    : listings.length > 0
      ? `${listings.length} home${listings.length === 1 ? "" : "s"} in this area`
      : "Homes in this area";

  return (
    <div className="mx-auto max-w-7xl px-3 pb-12 pt-4 lg:px-8 lg:pb-16 lg:pt-6">
      <SeoStructuredData
        pageUrl={pageUrl}
        pageName={h1}
        description={metaDescription}
        breadcrumbs={breadcrumbs}
        faqs={faqs}
        listings={listings}
      />

      <SeoBreadcrumbs items={breadcrumbs} />

      <SeoHero
        h1={h1}
        description={metaDescription}
        vibe={
          intent
            ? intentHeroVibe(intent, state)
            : level === "city"
              ? personality.vibe
              : undefined
        }
      />

      <article className="prose-yike max-w-3xl space-y-4 text-sm leading-relaxed text-muted lg:text-base">
        {introParagraphs.map((p) => (
          <p key={p.slice(0, 40)}>{p}</p>
        ))}
      </article>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-navy lg:text-xl">{listingsTitle}</h2>
          <Link
            href={searchHref}
            className="text-sm font-bold text-gold-dark hover:underline"
          >
            View all in search →
          </Link>
        </div>

        <SeoAreaRails
          featured={sections.featured}
          verified={sections.verified}
          recentlyAdded={sections.recentlyAdded}
          searchHref={searchHref}
          isDemo={isDemo}
        />

        <div className="mt-8">
          <PropertyFeed
            properties={sections.all}
            isDemo={isDemo}
            emptyCity={city}
            emptyArea={neighborhood}
            emptyMessage={
              neighborhood
                ? `Listings are being added in ${neighborhood}. Explore nearby areas or tell us what you need.`
                : `Listings are being added in ${city}. Browse related neighborhoods below.`
            }
          />
        </div>
      </section>

      <RentPriceGuide city={city} neighborhood={neighborhood} />

      <PopularLocalSearches title="Popular searches" links={popular} />

      {intentSiblings.length > 0 ? (
        <InternalLinkGrid
          title={`More property options in ${city}`}
          links={intentSiblings}
        />
      ) : null}

      {level === "city" && !intent && (
        <RelatedAreas city={city} citySlug={citySlug} limit={12} />
      )}

      {level === "neighborhood" && neighborhood && neighborhoodSlug && (
        <RelatedPropertyTypes citySlug={citySlug} neighborhoodSlug={neighborhoodSlug} />
      )}

      {level === "propertyType" && neighborhoodSlug && propertyType && (
        <RelatedPropertyTypes
          citySlug={citySlug}
          neighborhoodSlug={neighborhoodSlug}
          excludeSlug={propertyType.slug}
        />
      )}

      {neighborhood && (
        <RelatedAreas
          city={city}
          citySlug={citySlug}
          excludeArea={neighborhood}
          limit={8}
        />
      )}

      <InternalLinkGrid title="Explore more on Yike" links={nearbyCities} />

      <InternalLinkGrid
        title="Helpful guides"
        links={[
          { label: "Safety tips", href: "/safety" },
          { label: "Request a property", href: "/request-property" },
          { label: "List property free", href: "/post-property" },
          { label: "Verify as agent", href: "/verify-agent" },
          { label: `Blog: renting in ${city}`, href: `/blog/best-areas-to-rent-in-${citySlug}` },
        ]}
      />

      <SeoFAQ faqs={faqs} />

      <div className="mt-10 space-y-6">
        <SafetyNotice compact />
        <ConversionStrip />
      </div>

      {helpUrl ? (
        <StickySeoHelpBar label={helpLabel} whatsAppUrl={helpUrl} />
      ) : null}
    </div>
  );
}
