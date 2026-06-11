import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SeoLandingPage } from "@/components/seo/programmatic/seo-landing-page";
import {
  buildIntentCityFaqs,
  buildIntentCityIntro,
  getPriorityIntentCityParams,
  intentInCityUrl,
  intentSearchParams,
  intentSeoDescription,
  intentSeoH1,
  intentSeoTitle,
  type SeoListingIntent,
} from "@/lib/seo/intent-in-city";
import { resolveCitySlug } from "@/lib/location-slugs";
import { getPublicProperties } from "@/lib/properties";
import { isDemoProperty } from "@/lib/mock-listings";

type Props = {
  params: Promise<{ intent: string; city: string }>;
};

function isIntent(value: string): value is SeoListingIntent {
  return value === "rent" || value === "buy" || value === "land";
}

export async function generateStaticParams() {
  return getPriorityIntentCityParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { intent: intentRaw, city: citySlug } = await params;
  if (!isIntent(intentRaw)) return { title: "Yike" };

  const resolved = resolveCitySlug(citySlug);
  if (!resolved) return { title: "Yike" };

  const title = intentSeoTitle(intentRaw, resolved.city, resolved.state);
  const description = intentSeoDescription(intentRaw, resolved.city, resolved.state);
  const url = intentInCityUrl(intentRaw, citySlug);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Yike", type: "website" },
  };
}

export default async function IntentCityPage({ params }: Props) {
  const { intent: intentRaw, city: citySlug } = await params;
  if (!isIntent(intentRaw)) redirect("/search");

  const resolved = resolveCitySlug(citySlug);
  if (!resolved) redirect("/search");

  const listings = await getPublicProperties(
    intentSearchParams(intentRaw, resolved.city),
    24
  );
  const isDemo =
    listings.length > 0 && listings.every((p) => isDemoProperty(p.id));
  const pageUrl = intentInCityUrl(intentRaw, citySlug);
  const h1 = intentSeoH1(intentRaw, resolved.city, resolved.state);
  const metaDescription = intentSeoDescription(
    intentRaw,
    resolved.city,
    resolved.state
  );

  return (
    <SeoLandingPage
      level="city"
      intent={intentRaw}
      city={resolved.city}
      state={resolved.state}
      citySlug={citySlug}
      pageUrl={pageUrl}
      h1Override={h1}
      metaDescription={metaDescription}
      introParagraphs={buildIntentCityIntro(
        intentRaw,
        resolved.city,
        resolved.state
      )}
      faqs={buildIntentCityFaqs(intentRaw, resolved.city, resolved.state)}
      listings={listings}
      isDemo={isDemo}
    />
  );
}
