import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoLandingPage } from "@/components/seo/programmatic/seo-landing-page";
import {
  buildNeighborhoodFaqs,
  buildNeighborhoodIntro,
} from "@/lib/seo/content";
import {
  generateCanonicalUrl,
  generateSeoDescription,
  generateSeoTitle,
} from "@/lib/seo/utils";
import { getHousesNeighborhoodParams } from "@/lib/seo/paths";
import { resolveAreaSlug } from "@/lib/location-slugs";
import { getPublicProperties } from "@/lib/properties";
import { isDemoProperty } from "@/lib/mock-listings";

type Props = {
  params: Promise<{ city: string; neighborhood: string }>;
};

export async function generateStaticParams() {
  return getHousesNeighborhoodParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, neighborhood: neighborhoodSlug } = await params;
  const resolved = resolveAreaSlug(citySlug, neighborhoodSlug);
  if (!resolved) return { title: "Houses | Yike" };

  const title = generateSeoTitle("neighborhood", resolved.city, resolved.area);
  const description = generateSeoDescription(
    "neighborhood",
    resolved.city,
    resolved.area
  );
  const url = generateCanonicalUrl(citySlug, neighborhoodSlug);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Yike", type: "website" },
  };
}

export default async function HousesNeighborhoodPage({ params }: Props) {
  const { city: citySlug, neighborhood: neighborhoodSlug } = await params;
  const resolved = resolveAreaSlug(citySlug, neighborhoodSlug);
  if (!resolved) notFound();

  const listings = await getPublicProperties(
    { city: resolved.city, area: resolved.area },
    24
  );
  const isDemo =
    listings.length > 0 && listings.every((p) => isDemoProperty(p.id));
  const pageUrl = generateCanonicalUrl(citySlug, neighborhoodSlug);

  return (
    <SeoLandingPage
      level="neighborhood"
      city={resolved.city}
      state={resolved.state}
      citySlug={citySlug}
      neighborhood={resolved.area}
      neighborhoodSlug={neighborhoodSlug}
      pageUrl={pageUrl}
      metaDescription={generateSeoDescription(
        "neighborhood",
        resolved.city,
        resolved.area
      )}
      introParagraphs={buildNeighborhoodIntro(
        resolved.city,
        resolved.area,
        resolved.state
      )}
      faqs={buildNeighborhoodFaqs(resolved.city, resolved.area)}
      listings={listings}
      isDemo={isDemo}
    />
  );
}
