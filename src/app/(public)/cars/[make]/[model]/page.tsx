import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  getVehicleMakeModelParams,
  resolveVehicleMake,
  resolveVehicleModel,
  vehicleMakeSlug,
} from "@/lib/seo/vehicle-hubs";
import { toSlug } from "@/lib/location-slugs";

type Props = { params: Promise<{ make: string; model: string }> };

export async function generateStaticParams() {
  return getVehicleMakeModelParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { make: makeSlug, model: modelSlug } = await params;
  const make = resolveVehicleMake(makeSlug);
  const model = make ? resolveVehicleModel(make, modelSlug) : null;
  if (!make || !model) return { title: "Cars | Yike" };
  const title = `${make} ${model} for Sale in Nigeria | Yike`;
  return {
    title,
    description: `Browse verified ${make} ${model} listings on Yike.`,
    alternates: {
      canonical: `https://yike.ng/cars/${vehicleMakeSlug(make)}/${toSlug(model)}`,
    },
  };
}

export default async function CarsMakeModelPage({ params }: Props) {
  if (!isLaunchFeatureVisible("vehicle_marketplace")) redirect("/vehicles");

  const { make: makeSlug, model: modelSlug } = await params;
  const make = resolveVehicleMake(makeSlug);
  const model = make ? resolveVehicleModel(make, modelSlug) : null;
  if (!make || !model) redirect("/cars");

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy/45">
        <Link href="/cars" className="hover:underline">
          Cars
        </Link>
        {" / "}
        <Link href={`/cars/${vehicleMakeSlug(make)}`} className="hover:underline">
          {make}
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-bold text-navy">
        {make} {model}
      </h1>
      <p className="mt-2 text-navy/65">
        Live inventory for {make} {model} across Nigeria.
      </p>
      <p className="mt-8">
        <Link
          href={`/vehicles?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`}
          className="font-semibold text-gold-dark underline"
        >
          View {make} {model} listings →
        </Link>
      </p>
    </main>
  );
}
