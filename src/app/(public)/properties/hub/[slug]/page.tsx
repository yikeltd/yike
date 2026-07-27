import type { Metadata } from "next";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

const HUBS: Record<string, { href: string; title: string; description: string }> = {
  land: {
    href: "/search?property_type=land",
    title: "Land for Sale in Nigeria | Yike",
    description: "Browse verified land listings across Nigeria.",
  },
  shortlet: {
    href: "/shortlet",
    title: "Short Lets in Nigeria | Yike",
    description: "Find short-let apartments on Yike.",
  },
  commercial: {
    href: "/search?property_type=commercial",
    title: "Commercial Property in Nigeria | Yike",
    description: "Offices, shops, and commercial spaces on Yike.",
  },
};

export async function generateStaticParams() {
  return Object.keys(HUBS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hub = HUBS[slug];
  if (!hub) return { title: "Properties | Yike" };
  return {
    title: hub.title,
    description: hub.description,
    alternates: { canonical: `https://yike.ng/properties/hub/${slug}` },
  };
}

export default async function PropertiesHubSlugPage({ params }: Props) {
  const { slug } = await params;
  const hub = HUBS[slug];
  if (!hub) redirect("/properties");
  redirect(hub.href);
}
