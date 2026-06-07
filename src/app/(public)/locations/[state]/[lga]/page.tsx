import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SeoLandingPage } from "@/components/seo/programmatic/seo-landing-page";
import { resolveLgaSlug } from "@/lib/location-slugs";
import { getPublicProperties } from "@/lib/properties";

type Props = {
  params: Promise<{ state: string; lga: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, lga } = await params;
  const resolved = resolveLgaSlug(state, lga);
  if (!resolved) return { title: "Properties | Yike" };

  const title = `Homes in ${resolved.lga}, ${resolved.state} | Yike`;
  const description = `Browse rent, buy, and land listings in ${resolved.lga}, ${resolved.state} on Yike.ng.`;
  const url = `https://yike.ng/locations/${resolved.stateSlug}/${resolved.lgaSlug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Yike", type: "website" },
  };
}

export default async function LgaLocationPage({ params }: Props) {
  const { state, lga } = await params;
  const resolved = resolveLgaSlug(state, lga);
  if (!resolved) redirect("/search");

  const listings = await getPublicProperties(
    { state: resolved.state, area: resolved.lga },
    24
  );

  const pageUrl = `https://yike.ng/locations/${resolved.stateSlug}/${resolved.lgaSlug}`;

  return (
    <SeoLandingPage
      level="neighborhood"
      city={resolved.lga}
      state={resolved.state}
      citySlug={resolved.stateSlug}
      neighborhood={resolved.lga}
      neighborhoodSlug={resolved.lgaSlug}
      pageUrl={pageUrl}
      metaDescription={`Find properties in ${resolved.lga}, ${resolved.state}.`}
      introParagraphs={[
        `Explore homes, shops, and land in ${resolved.lga}, ${resolved.state}. Yike lists verified agents and fresh listings across Nigeria.`,
      ]}
      faqs={[
        {
          q: `How do I find homes in ${resolved.lga}?`,
          a: `Use Yike search filters for ${resolved.state} and ${resolved.lga}, or contact agents directly on WhatsApp.`,
        },
      ]}
      listings={listings}
    />
  );
}
