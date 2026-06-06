import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SeoLandingPage } from "@/components/seo/programmatic/seo-landing-page";
import {
  buildPropertyTypeFaqs,
  buildPropertyTypeIntro,
} from "@/lib/seo/content";
import {
  generateCanonicalUrl,
  generateSeoDescription,
  generateSeoTitle,
} from "@/lib/seo/utils";
import { getHousesPropertyTypeParams } from "@/lib/seo/paths";
import { resolveAreaSlug } from "@/lib/location-slugs";
import { resolveSeoPropertyType } from "@/constants/seoPropertyTypes";
import { getPublicProperties } from "@/lib/properties";
import { isDemoProperty } from "@/lib/mock-listings";

type Props = {
  params: Promise<{
    city: string;
    neighborhood: string;
    propertyType: string;
  }>;
};

export async function generateStaticParams() {
  return getHousesPropertyTypeParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, neighborhood: neighborhoodSlug, propertyType: typeSlug } =
    await params;
  const resolved = resolveAreaSlug(citySlug, neighborhoodSlug);
  const type = resolveSeoPropertyType(typeSlug);
  if (!resolved || !type) return { title: "Houses | Yike" };

  const title = generateSeoTitle(
    "propertyType",
    resolved.city,
    resolved.area,
    type
  );
  const description = generateSeoDescription(
    "propertyType",
    resolved.city,
    resolved.area,
    type
  );
  const url = generateCanonicalUrl(citySlug, neighborhoodSlug, typeSlug);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Yike", type: "website" },
  };
}

export default async function HousesPropertyTypePage({ params }: Props) {
  const { city: citySlug, neighborhood: neighborhoodSlug, propertyType: typeSlug } =
    await params;
  const resolved = resolveAreaSlug(citySlug, neighborhoodSlug);
  const type = resolveSeoPropertyType(typeSlug);
  if (!resolved || !type) redirect("/search");

  const searchParams: Parameters<typeof getPublicProperties>[0] = {
    city: resolved.city,
    area: resolved.area,
  };
  if (type.dbValue) searchParams.property_type = type.dbValue;
  if (type.bedrooms) searchParams.bedrooms = type.bedrooms;
  if (type.listingType) searchParams.listing_type = type.listingType;

  const listings = await getPublicProperties(searchParams, 24);
  const isDemo =
    listings.length > 0 && listings.every((p) => isDemoProperty(p.id));
  const pageUrl = generateCanonicalUrl(citySlug, neighborhoodSlug, typeSlug);

  return (
    <SeoLandingPage
      level="propertyType"
      city={resolved.city}
      state={resolved.state}
      citySlug={citySlug}
      neighborhood={resolved.area}
      neighborhoodSlug={neighborhoodSlug}
      propertyType={type}
      pageUrl={pageUrl}
      metaDescription={generateSeoDescription(
        "propertyType",
        resolved.city,
        resolved.area,
        type
      )}
      introParagraphs={buildPropertyTypeIntro(
        resolved.city,
        resolved.area,
        type
      )}
      faqs={buildPropertyTypeFaqs(resolved.city, resolved.area, type)}
      listings={listings}
      isDemo={isDemo}
    />
  );
}
