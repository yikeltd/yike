import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocationListingsPage } from "@/components/search/location-listings-page";
import {
  getSeoCityPaths,
  resolveCitySlug,
} from "@/lib/location-slugs";

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

  return {
    title: `Homes for Rent in ${resolved.city} | Yike`,
    description: `Browse verified rentals, shortlets and properties for sale in ${resolved.city}, Nigeria. Contact agents on WhatsApp — no agent drama.`,
    openGraph: {
      title: `Homes for Rent in ${resolved.city} | Yike`,
      description: `Find real homes in ${resolved.city} on Yike.ng`,
    },
  };
}

export default async function CitySeoPage({ params, searchParams }: Props) {
  const { citySlug } = await params;
  const resolved = resolveCitySlug(citySlug);
  if (!resolved) notFound();

  const sp = await searchParams;
  const listingLabel = sp.type === "sale" ? "for sale" : sp.type === "shortlet" ? "shortlets" : "for rent";

  return (
    <LocationListingsPage
      title={`Homes ${listingLabel} in ${resolved.city}`}
      description={`Discover verified homes in ${resolved.city}. Browse listings, compare prices, and contact trusted agents directly on WhatsApp.`}
      searchParams={sp}
      city={resolved.city}
      state={resolved.state}
      breadcrumb={[{ label: resolved.city, href: `/${citySlug}` }]}
    />
  );
}
