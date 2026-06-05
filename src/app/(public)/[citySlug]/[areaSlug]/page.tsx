import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocationListingsPage } from "@/components/search/location-listings-page";
import { getSeoAreaPaths, resolveAreaSlug } from "@/lib/location-slugs";

type Props = {
  params: Promise<{ citySlug: string; areaSlug: string }>;
  searchParams: Promise<{ type?: string }>;
};

export async function generateStaticParams() {
  return getSeoAreaPaths();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { citySlug, areaSlug } = await params;
  const resolved = resolveAreaSlug(citySlug, areaSlug);
  if (!resolved) return { title: "Homes | Yike" };

  return {
    title: `Homes for Rent in ${resolved.area}, ${resolved.city} | Yike`,
    description: `Browse verified rentals and properties in ${resolved.area}, ${resolved.city}. Real prices, WhatsApp contact, trusted agents.`,
    openGraph: {
      title: `Homes in ${resolved.area}, ${resolved.city} | Yike`,
      description: `Find homes in ${resolved.area} on Yike.ng`,
    },
  };
}

export default async function AreaSeoPage({ params, searchParams }: Props) {
  const { citySlug, areaSlug } = await params;
  const resolved = resolveAreaSlug(citySlug, areaSlug);
  if (!resolved) notFound();

  const sp = await searchParams;
  const listingLabel =
    sp.type === "sale"
      ? "for sale"
      : sp.type === "shortlet"
        ? "shortlets"
        : "for rent";

  return (
    <LocationListingsPage
      title={`Homes ${listingLabel} in ${resolved.area}, ${resolved.city}`}
      description={`Explore verified listings in ${resolved.area}. See photos, prices, and contact agents instantly on WhatsApp.`}
      searchParams={sp}
      city={resolved.city}
      area={resolved.area}
      state={resolved.state}
      breadcrumb={[
        { label: resolved.city, href: `/${citySlug}` },
        { label: resolved.area, href: `/${citySlug}/${areaSlug}` },
      ]}
    />
  );
}
