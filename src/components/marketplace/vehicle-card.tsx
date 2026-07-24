"use client";

import Link from "next/link";
import Image from "next/image";
import type { Property } from "@/types/database";
import { listingPath } from "@/lib/marketplace/listing-path";
import { ListingSaveButton } from "@/components/marketplace/listing-save-button";
import { ListingDistanceLabel } from "@/components/marketplace/listing-distance-label";
import { BROWSE_THUMB_ASPECT } from "@/lib/marketplace/browse-grid";
import { isFeaturedActive } from "@/lib/agent-tiers";
import { isDemoProperty } from "@/lib/mock-listings";
import { cn, isVerifiedAgent } from "@/lib/utils";
import {
  MapPin,
  Gauge,
  Fuel,
  Settings2,
  Calendar,
  ShieldCheck,
} from "lucide-react";

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

function transmissionShort(value?: string | null): string | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === "automatic") return "Auto";
  if (v === "manual") return "Manual";
  if (v === "cvt") return "CVT";
  return value;
}

function fuelShort(value?: string | null): string | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === "petrol" || v === "gasoline") return "Petrol";
  if (v === "diesel") return "Diesel";
  if (v === "electric" || v === "ev") return "EV";
  if (v === "hybrid") return "Hybrid";
  if (v === "cng") return "CNG";
  return value;
}

function conditionShort(value?: string | null): string | null {
  if (!value) return null;
  const v = value.toLowerCase().replace(/_/g, " ");
  if (v.includes("foreign") || v === "tokunbo") return "Foreign used";
  if (v.includes("nigeria") || v === "local") return "Nigerian used";
  if (v.includes("new") || v === "brand new") return "Brand new";
  return value.length > 14 ? `${value.slice(0, 12)}…` : value;
}

type AttrItem = { icon: typeof Gauge; label: string };

function buildVehicleAttrs(vehicle: Property): AttrItem[] {
  const items: AttrItem[] = [];
  if (vehicle.year) {
    items.push({ icon: Calendar, label: String(vehicle.year) });
  }
  if (vehicle.mileage != null) {
    items.push({
      icon: Gauge,
      label: `${vehicle.mileage.toLocaleString()} km`,
    });
  }
  const transmission = transmissionShort(vehicle.transmission);
  if (transmission) {
    items.push({ icon: Settings2, label: transmission });
  }
  const fuel = fuelShort(vehicle.fuel_type);
  if (fuel) {
    items.push({ icon: Fuel, label: fuel });
  }
  const condition = conditionShort(vehicle.vehicle_condition);
  if (condition && items.length < 4) {
    items.push({ icon: ShieldCheck, label: condition });
  }
  return items;
}

export function VehicleCard({
  vehicle,
  variant = "default",
  priorityImage = false,
}: {
  vehicle: Property;
  /** browse = inventory-first poster; marketplace = legacy home compact. */
  variant?: "default" | "marketplace" | "browse";
  /** Only first above-the-fold thumbs should be true. */
  priorityImage?: boolean;
}) {
  const href = listingPath(vehicle);
  const img = vehicle.media_urls?.[0];
  const featured = isFeaturedActive(vehicle);
  const isBrowse = variant === "browse";
  const isMarketplace = variant === "marketplace" || isBrowse;
  const isDemo = isDemoProperty(vehicle.id);
  const location = [vehicle.area, vehicle.city || vehicle.state]
    .filter(Boolean)
    .join(", ");
  const verified =
    vehicle.is_verified_listing ||
    (vehicle.agent ? isVerifiedAgent(vehicle.agent) : false);
  const attrs = buildVehicleAttrs(vehicle);

  if (isBrowse) {
    return (
      <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-transparent">
        <Link href={href} prefetch={!isDemo} className="block">
          <div
            className={cn(
              "listing-thumb relative overflow-hidden rounded-xl bg-navy/5",
              BROWSE_THUMB_ASPECT,
            )}
          >
            {img ? (
              <Image
                src={img}
                alt={vehicle.title}
                fill
                priority={priorityImage}
                loading={priorityImage ? undefined : "lazy"}
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 25vw, (max-width: 1536px) 14vw, 12vw"
              />
            ) : null}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy/35 to-transparent" />
            <div className="absolute left-1.5 top-1.5 z-10 flex max-w-[calc(100%-2.5rem)] flex-wrap gap-1">
              {featured ? (
                <span className="rounded-md bg-gold px-1.5 py-0.5 text-[9px] font-bold text-navy">
                  Feat
                </span>
              ) : null}
              {verified ? (
                <span
                  className="rounded-md bg-emerald-600/92 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-[2px]"
                  title="Verified"
                >
                  ✓ Verified
                </span>
              ) : null}
            </div>
          </div>
        </Link>

        {!isDemo ? (
          <div className="absolute right-1.5 top-1.5 z-10 opacity-90 transition-opacity group-hover:opacity-100">
            <ListingSaveButton
              listingId={vehicle.id}
              compact
              className="!h-8 !w-8 !bg-white/95 !text-navy shadow-sm backdrop-blur-sm"
            />
          </div>
        ) : null}

        <div className="flex flex-1 flex-col gap-0 pt-1.5">
          <Link href={href} prefetch={!isDemo} className="min-w-0">
            <p className="text-[13px] font-bold tabular-nums leading-tight text-navy sm:text-sm">
              {formatNaira(Number(vehicle.price))}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold leading-snug text-navy/90 sm:text-[12px]">
              {vehicle.title}
            </p>
            {location ? (
              <p className="mt-0.5 flex items-center gap-0.5 text-[10px] font-medium text-navy/50">
                <MapPin className="h-2.5 w-2.5 shrink-0 text-gold" aria-hidden />
                <span className="line-clamp-1">{location}</span>
                <ListingDistanceLabel
                  city={vehicle.city}
                  state={vehicle.state}
                  className="ml-auto shrink-0 tabular-nums text-navy/40"
                />
              </p>
            ) : null}
            {attrs.length > 0 ? (
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-semibold text-navy/45">
                {attrs.slice(0, 3).map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-0.5">
                    <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden />
                    {label}
                  </span>
                ))}
              </p>
            ) : null}
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article
      className={
        isMarketplace
          ? "group flex h-full flex-col overflow-hidden rounded-xl bg-transparent"
          : "group flex h-full flex-col overflow-hidden rounded-xl border border-navy/8 bg-white shadow-card ring-1 ring-black/[0.03]"
      }
    >
      <Link href={href} prefetch={!isDemo} className="block">
        <div className="listing-thumb relative aspect-[4/3] overflow-hidden rounded-xl bg-navy/5">
          {img ? (
            <Image
              src={img}
              alt={vehicle.title}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 25vw, (max-width: 1536px) 14vw, 12vw"
            />
          ) : null}
          <div className="absolute left-1.5 top-1.5 z-10 flex max-w-[calc(100%-2.5rem)] flex-wrap gap-1">
            {featured ? (
              <span className="rounded-md bg-gold px-1.5 py-0.5 text-[9px] font-bold text-navy">
                Feat
              </span>
            ) : null}
            {!isDemo && vehicle.is_verified_listing ? (
              <span
                className="rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white"
                title="Verified"
              >
                ✓ Verified
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-0.5 pt-2">
        <div className="flex items-start justify-between gap-1">
          <Link href={href} prefetch={!isDemo} className="min-w-0 flex-1">
            <p className="text-sm font-bold tabular-nums leading-tight text-navy sm:text-[15px]">
              {formatNaira(Number(vehicle.price))}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[12px] font-semibold leading-snug text-navy sm:text-[13px]">
              {vehicle.title}
            </p>
          </Link>
          {!isDemo ? (
            <ListingSaveButton
              listingId={vehicle.id}
              compact
              className="shrink-0"
            />
          ) : null}
        </div>
        {location ? (
          <p className="flex items-center gap-0.5 text-[10px] font-medium text-black/50 sm:text-[11px]">
            <MapPin className="h-2.5 w-2.5 shrink-0 text-gold" aria-hidden />
            <span className="line-clamp-1">{location}</span>
          </p>
        ) : null}
        {attrs.length > 0 ? (
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-semibold text-black/45 sm:text-[11px]">
            {attrs.slice(0, 3).map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-0.5">
                <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden />
                {label}
              </span>
            ))}
          </p>
        ) : null}
        <Link
          href={href}
          prefetch={!isDemo}
          className="mt-auto pt-1 text-[10px] font-bold text-gold-dark hover:underline sm:text-[11px]"
        >
          View
        </Link>
      </div>
    </article>
  );
}
