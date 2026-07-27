import type { Metadata } from "next";
import Link from "next/link";
import { VEHICLE_MAKES } from "@/lib/marketplace/vehicle-makes";
import { vehicleMakeSlug } from "@/lib/seo/vehicle-hubs";
import { PRIORITY_CITY_SLUGS } from "@/lib/seo/paths";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Cars for Sale in Nigeria | Yike",
  description:
    "Browse verified cars, SUVs, and vehicles on Yike — Nigeria’s trusted marketplace.",
  alternates: { canonical: "https://yike.ng/cars" },
};

export default function CarsHubPage() {
  if (!isLaunchFeatureVisible("vehicle_marketplace")) {
    redirect("/vehicles");
  }

  const makes = VEHICLE_MAKES.slice(0, 24);
  const cities = PRIORITY_CITY_SLUGS.slice(0, 12);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-navy">Cars on Yike</h1>
      <p className="mt-2 max-w-2xl text-navy/65">
        Shop by make or city. Every listing is moderated for trust.
      </p>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/45">
          Popular makes
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {makes.map((make) => (
            <li key={make}>
              <Link
                href={`/cars/${vehicleMakeSlug(make)}`}
                className="block rounded-xl border border-navy/10 bg-white px-3 py-3 text-sm font-semibold text-navy hover:border-gold/50"
              >
                {make}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/45">
          Cars by city
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {cities.map((city) => (
            <li key={city}>
              <Link
                href={`/cars/${city}`}
                className="inline-flex rounded-full bg-navy/[0.05] px-3 py-1.5 text-sm font-medium capitalize text-navy hover:bg-gold/20"
              >
                {city.replace(/-/g, " ")}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10">
        <Link href="/vehicles" className="font-semibold text-gold-dark underline">
          Open full vehicle marketplace →
        </Link>
      </p>
    </main>
  );
}
