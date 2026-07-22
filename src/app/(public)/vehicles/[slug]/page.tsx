import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  getVehicleByIdOrSlug,
  queryPublicVehicles,
} from "@/lib/marketplace/listings";
import { vehicleCategoryLabel } from "@/lib/marketplace/vehicle-specs";
import { ContactButtons } from "@/components/property/contact-buttons";
import { ListingShareMenu } from "@/components/property/listing-share-menu";
import { ReportListingForm } from "@/components/property/report-form";
import { ListingSaveButton } from "@/components/marketplace/listing-save-button";
import { MarketplaceViewTracker } from "@/components/marketplace/view-tracker";
import { MarketplaceSafetyNotice } from "@/components/marketplace/safety-notice";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { listingAbsoluteUrl } from "@/lib/marketplace/listing-path";
import { isFeaturedActive } from "@/lib/agent-tiers";

type Props = { params: Promise<{ slug: string }> };

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isLaunchFeatureVisible("vehicle_marketplace")) {
    return { title: "Vehicle | Yike" };
  }
  const supabase = await createClient();
  const v = supabase ? await getVehicleByIdOrSlug(supabase, slug) : null;
  if (!v) return { title: "Vehicle | Yike" };
  return {
    title: `${v.title} | Yike Vehicles`,
    description: v.description?.slice(0, 160) || undefined,
  };
}

export default async function VehicleDetailPage({ params }: Props) {
  if (!isLaunchFeatureVisible("vehicle_marketplace")) notFound();
  const { slug } = await params;
  const supabase = await createClient();
  if (!supabase) notFound();

  const vehicle = await getVehicleByIdOrSlug(supabase, slug);
  if (!vehicle || vehicle.status !== "approved") notFound();

  const similar = (
    await queryPublicVehicles(supabase, {
      auto_category: vehicle.auto_category ?? undefined,
      make: vehicle.make ?? undefined,
      limit: 8,
    })
  )
    .filter((x) => x.id !== vehicle.id)
    .slice(0, 4);

  const agent = vehicle.agent as
    | {
        id: string;
        full_name?: string | null;
        whatsapp?: string | null;
        phone?: string | null;
        account_type?: string | null;
        company_name?: string | null;
      }
    | undefined;

  const priceLabel = formatNaira(Number(vehicle.price));
  const shareUrl = listingAbsoluteUrl(vehicle);
  const isDealer = agent?.account_type === "dealer";

  const specs: [string, string | number | null | undefined][] = [
    ["Category", vehicleCategoryLabel(vehicle.auto_category)],
    ["Make", vehicle.make],
    ["Model", vehicle.model],
    ["Year", vehicle.year],
    ["Trim", vehicle.trim],
    ["Condition", vehicle.vehicle_condition],
    [
      "Mileage",
      vehicle.mileage != null ? `${vehicle.mileage.toLocaleString()} km` : null,
    ],
    ["Transmission", vehicle.transmission],
    ["Fuel", vehicle.fuel_type],
    ["Body", vehicle.body_type],
    ["Drivetrain", vehicle.drivetrain],
    ["Engine", vehicle.engine],
    ["Exterior", vehicle.exterior_color],
    ["Interior", vehicle.interior_color],
    ["Registration", vehicle.registration_status],
    ["Financing", vehicle.financing_available ? "Available" : null],
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-28">
      <MarketplaceViewTracker
        id={vehicle.id}
        title={vehicle.title}
        image={vehicle.media_urls?.[0] ?? ""}
        city={vehicle.city}
        area={vehicle.area || vehicle.city}
        priceLabel={priceLabel}
        assetType="VEHICLE"
        slug={vehicle.slug}
      />

      <p className="mb-2 text-sm text-black/50">
        <Link href="/vehicles" className="hover:underline">
          Vehicles
        </Link>
        {" / "}
        {vehicleCategoryLabel(vehicle.auto_category)}
      </p>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-navy/5">
            {vehicle.media_urls?.[0] ? (
              <Image
                src={vehicle.media_urls[0]}
                alt={vehicle.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            ) : null}
            {isFeaturedActive(vehicle) ? (
              <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">
                Featured
              </span>
            ) : null}
          </div>
          {vehicle.media_urls && vehicle.media_urls.length > 1 ? (
            <ul className="mt-2 grid grid-cols-4 gap-2">
              {vehicle.media_urls.slice(1, 5).map((url) => (
                <li
                  key={url}
                  className="relative aspect-square overflow-hidden rounded-lg bg-navy/5"
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <ListingSaveButton listingId={vehicle.id} />
            <ListingShareMenu
              title={vehicle.title}
              text={`${vehicle.title} on Yike`}
              url={shareUrl}
              price={priceLabel}
              city={vehicle.city}
              listingId={vehicle.id}
              listingType="sale"
              propertyType={vehicle.auto_category}
            />
          </div>

          <h1 className="mt-3 text-2xl font-bold text-navy">{vehicle.title}</h1>
          <p className="mt-2 text-3xl font-bold text-navy">{priceLabel}</p>
          <p className="mt-1 text-sm text-black/55">
            {[vehicle.city, vehicle.state].filter(Boolean).join(", ")}
          </p>
          {vehicle.is_verified_listing ? (
            <p className="mt-2 inline-block rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-navy">
              Verified listing
            </p>
          ) : null}

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {specs
              .filter(([, v]) => v != null && v !== "")
              .map(([k, v]) => (
                <div key={k} className="rounded-lg bg-black/[0.03] px-3 py-2">
                  <dt className="text-xs text-black/45">{k}</dt>
                  <dd className="font-medium text-navy">{v}</dd>
                </div>
              ))}
          </dl>

          {agent ? (
            <div className="mt-6 rounded-xl border border-black/8 p-4">
              <p className="text-xs uppercase tracking-wide text-black/45">
                {isDealer ? "Dealer" : "Seller"}
              </p>
              <p className="font-semibold text-navy">
                {agent.company_name || agent.full_name || "Yike seller"}
              </p>
              {isDealer ? (
                <p className="mt-1 text-xs text-navy/60">
                  Dealer profile — verify paperwork before payment.
                </p>
              ) : null}
              <Link
                href={`/agents/${agent.id}`}
                className="mt-2 inline-block text-sm text-navy underline-offset-2 hover:underline"
              >
                View {isDealer ? "dealer" : "seller"} profile
              </Link>
            </div>
          ) : null}

          <div className="mt-4">
            <ContactButtons
              propertyId={vehicle.id}
              title={vehicle.title}
              area={vehicle.area || vehicle.city}
              city={vehicle.city}
              listingType={vehicle.listing_type || "sale"}
              propertyType={vehicle.auto_category}
              agentId={vehicle.agent_id}
              agentName={agent?.full_name || "Seller"}
              price={Number(vehicle.price)}
              paymentPeriod={vehicle.payment_period || "total"}
              phone={agent?.phone}
              whatsapp={agent?.whatsapp}
            />
          </div>
        </div>
      </div>

      {vehicle.description ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-navy">Description</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-black/70">
            {vehicle.description}
          </p>
        </section>
      ) : null}

      <section className="mt-8 space-y-4">
        <MarketplaceSafetyNotice vertical="vehicle" />
        <details className="rounded-xl border border-black/8 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-navy">
            Report this listing
          </summary>
          <div className="mt-3">
            <ReportListingForm propertyId={vehicle.id} />
          </div>
        </details>
      </section>

      {similar.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-navy">Similar vehicles</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {similar.map((s) => (
              <li key={s.id}>
                <VehicleCard vehicle={s} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
