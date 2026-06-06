import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocationListingsPage } from "@/components/search/location-listings-page";
import { LocationPageSchema } from "@/components/seo/location-page-schema";
import {
  getSeoCityPaths,
  resolveCitySlug,
  toSlug,
} from "@/lib/location-slugs";
import { legacyCityCanonical } from "@/lib/seo/utils";

type Props = {
  params: Promise<{ citySlug: string }>;
  searchParams: Promise<{ type?: string }>;
};

export async function generateStaticParams() {
  return getSeoCityPaths();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { citySlug } = await params;
  const resolved = resolveCitySlug(citySlug);
  if (!resolved) return { title: "Homes | Yike" };

  const canonical = legacyCityCanonical(citySlug);
  return {
    title: `Apartments & Houses for Rent in ${resolved.city} | Yike`,
    description: `Browse verified apartments, houses, shortlets and land in ${resolved.city}, Nigeria. Mobile-first discovery — contact agents on WhatsApp.`,
    alternates: { canonical },
    openGraph: {
      title: `Homes for Rent in ${resolved.city} | Yike`,
      description: `Find real homes in ${resolved.city} on Yike.ng`,
      url: canonical,
    },
  };
}

export default async function CitySeoPage({ params, searchParams }: Props) {
  const { citySlug } = await params;
  const resolved = resolveCitySlug(citySlug);
  if (!resolved) notFound();

  const sp = await searchParams;
  const listingLabel = sp.type === "sale" ? "for sale" : sp.type === "shortlet" ? "shortlets" : "for rent";

  const canonical = legacyCityCanonical(citySlug);
  const housesSlug = toSlug(resolved.city);

  return (
    <>
      <LocationPageSchema
        pageUrl={canonical}
        pageName={`Homes in ${resolved.city}`}
        description={`Verified apartments and houses in ${resolved.city}, Nigeria.`}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: resolved.city, href: `/houses/${housesSlug}` },
        ]}
      />
      <LocationListingsPage
        title={`Homes ${listingLabel} in ${resolved.city}`}
        description={`Discover verified homes in ${resolved.city}. Browse listings, compare prices, and contact trusted agents directly on WhatsApp.`}
        searchParams={sp}
        city={resolved.city}
        state={resolved.state}
        breadcrumb={[{ label: resolved.city, href: `/${citySlug}` }]}
      />
    </>
  );
}
