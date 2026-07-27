import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveCitySlug, resolveAreaSlug } from "@/lib/location-slugs";
import { PRIORITY_CITY_SLUGS } from "@/lib/seo/paths";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const cities = PRIORITY_CITY_SLUGS.slice(0, 32).map((slug) => ({ slug }));
  const neighborhoods = ["ikeja", "lekki", "victoria-island", "wuse", "gwarinpa"].map(
    (slug) => ({ slug }),
  );
  return [...cities, ...neighborhoods];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = resolveCitySlug(slug);
  if (city) {
    return {
      title: `Properties in ${city.city} | Yike`,
      description: `Homes, land, and commercial listings in ${city.city}.`,
      alternates: { canonical: `https://yike.ng/properties/in/${slug}` },
    };
  }
  return { title: "Properties | Yike" };
}

/** SEO location aliases → existing /houses surfaces (does not collide with listing detail). */
export default async function PropertiesInLocationPage({ params }: Props) {
  const { slug } = await params;
  const city = resolveCitySlug(slug);
  if (city) redirect(`/houses/${slug}`);

  for (const citySlug of PRIORITY_CITY_SLUGS.slice(0, 12)) {
    const area = resolveAreaSlug(citySlug, slug);
    if (area) redirect(`/houses/${citySlug}/${slug}`);
  }

  redirect("/search");
}
