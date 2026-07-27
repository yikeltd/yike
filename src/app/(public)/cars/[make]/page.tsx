import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  getVehicleCityParams,
  getVehicleMakeParams,
  resolveCarsSegment,
  vehicleMakeSlug,
} from "@/lib/seo/vehicle-hubs";
import { VEHICLE_MAKE_TYPES } from "@/lib/marketplace/vehicle-makes";
import { toSlug } from "@/lib/location-slugs";

type Props = { params: Promise<{ make: string }> };

export async function generateStaticParams() {
  const makes = getVehicleMakeParams().map((p) => ({ make: p.make }));
  const cities = getVehicleCityParams().map((p) => ({ make: p.city }));
  return [...makes, ...cities];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { make: segment } = await params;
  const resolved = resolveCarsSegment(segment);
  if (!resolved) return { title: "Cars | Yike" };
  if (resolved.kind === "make") {
    const title = `${resolved.make} Cars for Sale in Nigeria | Yike`;
    return {
      title,
      description: `Browse verified ${resolved.make} cars and SUVs on Yike.`,
      alternates: { canonical: `https://yike.ng/cars/${segment}` },
    };
  }
  return {
    title: `Cars for Sale in ${resolved.city} | Yike`,
    description: `Find verified vehicles in ${resolved.city}, ${resolved.state}.`,
    alternates: { canonical: `https://yike.ng/cars/${segment}` },
  };
}

export default async function CarsMakeOrCityPage({ params }: Props) {
  if (!isLaunchFeatureVisible("vehicle_marketplace")) redirect("/vehicles");

  const { make: segment } = await params;
  const resolved = resolveCarsSegment(segment);
  if (!resolved) redirect("/cars");

  if (resolved.kind === "make") {
    const make = resolved.make!;
    const models = VEHICLE_MAKE_TYPES[make] ?? [];
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy/45">
          <Link href="/cars" className="hover:underline">
            Cars
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-bold text-navy">{make} cars</h1>
        <p className="mt-2 text-navy/65">
          Explore popular {make} models, then open live listings.
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {models.map((model) => (
            <li key={model}>
              <Link
                href={`/cars/${vehicleMakeSlug(make)}/${toSlug(model)}`}
                className="block rounded-xl border border-navy/10 bg-white px-3 py-3 text-sm font-semibold text-navy hover:border-gold/50"
              >
                {make} {model}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8">
          <Link
            href={`/vehicles?make=${encodeURIComponent(make)}`}
            className="font-semibold text-gold-dark underline"
          >
            See all {make} listings →
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy/45">
        <Link href="/cars" className="hover:underline">
          Cars
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-bold text-navy">Cars in {resolved.city}</h1>
      <p className="mt-2 text-navy/65">
        Verified vehicles near {resolved.city}, {resolved.state}.
      </p>
      <p className="mt-8">
        <Link
          href={`/vehicles?city=${encodeURIComponent(resolved.city!)}`}
          className="font-semibold text-gold-dark underline"
        >
          Browse {resolved.city} inventory →
        </Link>
      </p>
    </main>
  );
}
