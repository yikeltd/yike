import type { Metadata } from "next";
import Link from "next/link";
import { PRIORITY_CITY_SLUGS } from "@/lib/seo/paths";

export const metadata: Metadata = {
  title: "Properties in Nigeria | Yike",
  description:
    "Find verified homes, land, short lets, and commercial property on Yike.",
  alternates: { canonical: "https://yike.ng/properties" },
};

const HUBS = [
  { href: "/properties/hub/land", label: "Land" },
  { href: "/properties/hub/shortlet", label: "Short let" },
  { href: "/properties/hub/commercial", label: "Commercial" },
  { href: "/search?type=rent", label: "Rent" },
  { href: "/search?type=sale", label: "Buy" },
];

export default function PropertiesHubPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-navy">Properties on Yike</h1>
      <p className="mt-2 max-w-2xl text-navy/65">
        Browse by city or category. Trust-first discovery across Nigeria.
      </p>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/45">
          Categories
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {HUBS.map((h) => (
            <li key={h.href}>
              <Link
                href={h.href}
                className="inline-flex rounded-full bg-navy/[0.05] px-3 py-1.5 text-sm font-medium text-navy hover:bg-gold/20"
              >
                {h.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/45">
          Popular cities
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {PRIORITY_CITY_SLUGS.slice(0, 16).map((city) => (
            <li key={city}>
              <Link
                href={`/properties/in/${city}`}
                className="block rounded-xl border border-navy/10 bg-white px-3 py-3 text-sm font-semibold capitalize text-navy hover:border-gold/50"
              >
                {city.replace(/-/g, " ")}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
