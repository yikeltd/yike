import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocationListingsPage } from "@/components/search/location-listings-page";
import { LocationPageSchema } from "@/components/seo/location-page-schema";
import { getSeoAreaPaths, resolveAreaSlug } from "@/lib/location-slugs";
import { legacyAreaCanonical } from "@/lib/seo/utils";

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

  const canonical = legacyAreaCanonical(citySlug, areaSlug);
  return {
    title: `Apartments in ${resolved.area}, ${resolved.city} | Yike`,
    description: `Browse verified apartments, self contains and houses in ${resolved.area}, ${resolved.city}. Real prices — WhatsApp contact.`,
    alternates: { canonical },
    openGraph: {
      title: `Homes in ${resolved.area}, ${resolved.city} | Yike`,
      description: `Find homes in ${resolved.area} on Yike.ng`,
      url: canonical,
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

  const canonical = legacyAreaCanonical(citySlug, areaSlug);

  return (
    <>
      <LocationPageSchema
        pageUrl={canonical}
        pageName={`Homes in ${resolved.area}, ${resolved.city}`}
        description={`Verified rentals in ${resolved.area}, ${resolved.city}.`}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: resolved.city, href: `/houses/${citySlug}` },
          { name: resolved.area, href: `/houses/${citySlug}/${areaSlug}` },
        ]}
      />
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
    </>
  );
}
