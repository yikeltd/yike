import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SeoLandingPage } from "@/components/seo/programmatic/seo-landing-page";
import { buildCityFaqs, buildCityIntro } from "@/lib/seo/content";
import {
  generateCanonicalUrl,
  generateSeoDescription,
  generateSeoTitle,
} from "@/lib/seo/utils";
import { getHousesCityParams } from "@/lib/seo/paths";
import { resolveCitySlug } from "@/lib/location-slugs";
import { getPublicProperties } from "@/lib/properties";
import { isDemoProperty } from "@/lib/mock-listings";

type Props = {
  params: Promise<{ city: string }>;
};

export async function generateStaticParams() {
  return getHousesCityParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const resolved = resolveCitySlug(citySlug);
  if (!resolved) return { title: "Houses | Yike" };

  const title = generateSeoTitle("city", resolved.city);
  const description = generateSeoDescription("city", resolved.city);
  const url = generateCanonicalUrl(citySlug);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Yike", type: "website" },
  };
}

export default async function HousesCityPage({ params }: Props) {
  const { city: citySlug } = await params;
  const resolved = resolveCitySlug(citySlug);
  if (!resolved) redirect("/search");

  const listings = await getPublicProperties({ city: resolved.city }, 24);
  const isDemo =
    listings.length > 0 && listings.every((p) => isDemoProperty(p.id));
  const pageUrl = generateCanonicalUrl(citySlug);

  return (
    <SeoLandingPage
      level="city"
      city={resolved.city}
      state={resolved.state}
      citySlug={citySlug}
      pageUrl={pageUrl}
      metaDescription={generateSeoDescription("city", resolved.city)}
      introParagraphs={buildCityIntro(resolved.city, resolved.state)}
      faqs={buildCityFaqs(resolved.city)}
      listings={listings}
      isDemo={isDemo}
    />
  );
}
